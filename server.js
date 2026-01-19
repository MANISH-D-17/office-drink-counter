const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'office-brews-secure-secret-key';
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://manish:GU9R6kswaW4kSj2l@cluster0.a8hpucr.mongodb.net/?appName=Cluster0";

const ADMIN_EMAILS = ['manish.d@profitstory.ai', 'mathan.kumar@profitstory.ai'];

// Middlewares
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully'))
  .catch(err => {
    console.error('CRITICAL: MongoDB Connection Error:', err);
    process.exit(1);
  });

// --- SCHEMAS ---

const transformSchema = {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
};

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  pin: { type: String, required: true }
});
UserSchema.set('toJSON', transformSchema);
UserSchema.set('toObject', transformSchema);

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  items: [{
    _id: false, // Prevent conflict with frontend IDs
    id: String,
    drink: String,
    sugar: String,
    quantity: Number,
    note: String
  }],
  slot: { type: String, enum: ['11:00 AM', '03:00 PM'], required: true },
  createdAt: { type: Date, default: Date.now }
});
OrderSchema.set('toJSON', transformSchema);
OrderSchema.set('toObject', transformSchema);

const BroadcastSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 } 
});
BroadcastSchema.set('toJSON', transformSchema);
BroadcastSchema.set('toObject', transformSchema);

const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);
const Broadcast = mongoose.model('Broadcast', BroadcastSchema);

// --- AUTH MIDDLEWARE ---
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No authorization header.' });
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No authentication token provided.' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

const isAdmin = (email) => ADMIN_EMAILS.includes((email || '').toLowerCase());

// --- ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, pin } = req.body;
    if (!name || !email || !pin) return res.status(400).json({ message: 'Missing fields.' });
    
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });

    const newUser = new User({ name, email: email.toLowerCase(), pin });
    await newUser.save();

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: newUser });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), pin });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: user });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { items, slot } = req.body;
    if (!items || items.length === 0 || !slot) {
      return res.status(400).json({ message: 'Invalid order data.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const order = new Order({
      userId: user._id,
      userName: user.name,
      items,
      slot
    });
    await order.save();
    console.log(`Order placed by ${user.email} for ${slot}`);
    res.json(order);
  } catch (err) {
    console.error('Order Placement Error:', err);
    res.status(500).json({ message: 'Failed to place order. Check network connection.' });
  }
});

app.delete('/api/orders/all', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req.user.email)) {
      return res.status(403).json({ message: 'Access denied: Admin only.' });
    }
    const result = await Order.deleteMany({});
    res.json({ message: `Success: ${result.deletedCount} orders cleared.` });
  } catch (err) {
    res.status(500).json({ message: 'Global delete failed.' });
  }
});

app.get('/api/orders/summary', authenticate, async (req, res) => {
  try {
    const tableData = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: { drink: "$items.drink", sugar: "$items.sugar" },
          morningCount: { $sum: { $cond: [{ $eq: ["$slot", "11:00 AM"] }, "$items.quantity", 0] } },
          afternoonCount: { $sum: { $cond: [{ $eq: ["$slot", "03:00 PM"] }, "$items.quantity", 0] } },
          total: { $sum: "$items.quantity" }
        }
      },
      {
        $project: {
          _id: 0,
          drink: "$_id.drink",
          sugar: "$_id.sugar",
          morningCount: 1,
          afternoonCount: 1,
          total: 1
        }
      },
      { $sort: { drink: 1, sugar: 1 } }
    ]);

    const statsData = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalDrinks: { $sum: "$items.quantity" },
          totalWithSugar: { $sum: { $cond: [{ $eq: ["$items.sugar", "With Sugar"] }, "$items.quantity", 0] } }
        }
      }
    ]);

    const stats = statsData[0] || { totalDrinks: 0, totalWithSugar: 0 };
    const allOrders = await Order.find().sort({ createdAt: -1 });

    res.json({
      totalDrinks: stats.totalDrinks,
      totalWithSugar: stats.totalWithSugar,
      morningSummary: { total: 0, withSugar: 0 },
      afternoonSummary: { total: 0, withSugar: 0 },
      table: tableData,
      allOrders
    });
  } catch (err) {
    console.error('Summary Error:', err);
    res.status(500).json({ message: 'Aggregation failed.' });
  }
});

app.put('/api/orders/:id', authenticate, async (req, res) => {
  try {
    const { items } = req.body;
    const filter = isAdmin(req.user.email) ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
    const order = await Order.findOneAndUpdate(filter, { items }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found or access denied.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Update failed.' });
  }
});

app.delete('/api/orders/:id', authenticate, async (req, res) => {
  try {
    const filter = isAdmin(req.user.email) ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
    const order = await Order.findOneAndDelete(filter);
    if (!order) return res.status(404).json({ message: 'Access denied.' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed.' });
  }
});

app.post('/api/broadcasts', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req.user.email)) return res.status(403).json({ message: 'Admin only.' });
    const broadcast = new Broadcast(req.body);
    await broadcast.save();
    res.json(broadcast);
  } catch (err) {
    res.status(500).json({ message: 'Broadcast failed.' });
  }
});

app.get('/api/broadcasts/latest', authenticate, async (req, res) => {
  try {
    const latest = await Broadcast.findOne().sort({ createdAt: -1 });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed.' });
  }
});

const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(path.join(distPath, 'index.html'));
  else res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, () => console.log(`Server live on ${PORT}`));