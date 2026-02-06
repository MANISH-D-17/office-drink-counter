const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'brewhub-production-secret-112233';
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://manish:GU9R6kswaW4kSj2l@cluster0.a8hpucr.mongodb.net/?appName=Cluster0";

// Admin Configuration
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'manish.d@profitstory.ai,mathan.kumar@profitstory.ai').split(',').map(e => e.trim().toLowerCase());

// --- EMAIL ENGINE ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    // Priority: Environment Variable, then the requested admin email
    user: process.env.EMAIL_USER || 'manish.d@profitstory.ai',
    // In production, you MUST set EMAIL_PASS as an App Password in your deployment env
    pass: process.env.EMAIL_PASS || 'your-secure-app-password'
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Schemas & Transforms
const transformSchema = {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; }
};

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  pin: { type: String, required: true }
});
UserSchema.set('toJSON', transformSchema);

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  items: [{ _id: false, id: String, drink: String, sugar: String, quantity: Number, note: String }],
  slot: { type: String, enum: ['11:00 AM', '03:00 PM'], required: true },
  createdAt: { type: Date, default: Date.now }
});
OrderSchema.set('toJSON', transformSchema);

const BroadcastSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 } 
});

const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);
const Broadcast = mongoose.model('Broadcast', BroadcastSchema);

// Auth Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Login required' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Session expired' });
  }
};

const isAdmin = (email) => ADMIN_EMAILS.includes((email || '').toLowerCase());

// API Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, pin } = req.body;
    const emailLower = email.toLowerCase();
    const existing = await User.findOne({ email: emailLower });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const user = new User({ name, email: emailLower, pin });
    await user.save();
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), pin });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const order = new Order({ ...req.body, userId: req.user.id, userName: (await User.findById(req.user.id)).name });
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to place order' });
  }
});

app.get('/api/orders/my', authenticate, async (req, res) => {
  res.json(await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }));
});

app.delete('/api/orders/all', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req.user.email)) return res.status(403).json({ message: 'Unauthorized' });
    await Order.deleteMany({});
    res.json({ message: 'Board cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear' });
  }
});

app.get('/api/orders/summary', authenticate, async (req, res) => {
  try {
    const tableData = await Order.aggregate([
      { $unwind: "$items" },
      { $group: {
          _id: { drink: "$items.drink", sugar: "$items.sugar" },
          morningCount: { $sum: { $cond: [{ $eq: ["$slot", "11:00 AM"] }, "$items.quantity", 0] } },
          afternoonCount: { $sum: { $cond: [{ $eq: ["$slot", "03:00 PM"] }, "$items.quantity", 0] } },
          total: { $sum: "$items.quantity" }
      }},
      { $project: { _id: 0, drink: "$_id.drink", sugar: "$_id.sugar", morningCount: 1, afternoonCount: 1, total: 1 }},
      { $sort: { drink: 1, sugar: 1 } }
    ]);
    const statsData = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: null, totalDrinks: { $sum: "$items.quantity" }, totalWithSugar: { $sum: { $cond: [{ $eq: ["$items.sugar", "With Sugar"] }, "$items.quantity", 0] } } }}
    ]);
    const stats = statsData[0] || { totalDrinks: 0, totalWithSugar: 0 };
    res.json({ ...stats, table: tableData, allOrders: await Order.find().sort({ createdAt: -1 }) });
  } catch (err) {
    res.status(500).json({ message: 'Stats error' });
  }
});

app.post('/api/admin/email-blast', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req.user.email)) return res.status(403).json({ message: 'Unauthorized' });
    const { subject, message } = req.body;
    const users = await User.find({}, 'email');
    const recipients = users.map(u => u.email).join(', ');
    
    const mailOptions = {
      from: '"BrewHub Admin" <manish.d@profitstory.ai>',
      to: recipients,
      subject: subject || 'BrewHub Office Update',
      html: `
        <div style="font-family: sans-serif; padding: 25px; border: 1px solid #f0f0f0; border-radius: 15px; max-width: 600px; margin: auto; background-color: #ffffff;">
          <h2 style="color: #003B73; border-bottom: 2px solid #FBBF24; padding-bottom: 10px;">📢 BrewHub Notification</h2>
          <p style="font-size: 16px; color: #333333; line-height: 1.6;">${message}</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999999;">
            Sent by <b>Manish D (Admin)</b> via the Office Drink Counter.<br/>
            This is an automated message. Please do not reply directly to this email.
          </div>
        </div>`
    };
    
    transporter.sendMail(mailOptions);
    res.json({ message: 'Email blast sent from manish.d@profitstory.ai' });
  } catch (err) {
    res.status(500).json({ message: 'Blast failed' });
  }
});

app.post('/api/broadcasts', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req.user.email)) return res.status(403).json({ message: 'Unauthorized' });
    const broadcast = new Broadcast(req.body);
    await broadcast.save();
    res.json(broadcast);
  } catch (err) {
    res.status(500).json({ message: 'Failed to broadcast' });
  }
});

app.get('/api/broadcasts/latest', authenticate, async (req, res) => {
  res.json(await Broadcast.findOne().sort({ createdAt: -1 }));
});

// SPA Handling
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: 'Not Found' });
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 BrewHub Production Server live on port ${PORT}`));