const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'office-brews-secure-secret-key';
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://manish:GU9R6kswaW4kSj2l@cluster0.a8hpucr.mongodb.net/?appName=Cluster0";

// Middlewares
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// --- SCHEMAS ---

// Helper to transform _id to id in JSON output
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
    id: String,
    drink: String,
    sugar: String,
    quantity: Number
  }],
  slot: { type: String, enum: ['11:00 AM', '03:00 PM'], required: true },
  createdAt: { type: Date, default: Date.now }
});
OrderSchema.set('toJSON', transformSchema);
OrderSchema.set('toObject', transformSchema);

const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);

// --- AUTH MIDDLEWARE ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No authentication token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Session expired or invalid token.' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, pin } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });

    const newUser = new User({ name, email, pin });
    await newUser.save();

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email, pin });
    if (!user) return res.status(401).json({ message: 'Invalid email or PIN.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: user });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

app.put('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { name, email, pin } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User profile not found.' });

    user.name = name;
    user.email = email;
    if (pin) user.pin = pin;
    await user.save();

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// --- ORDER ROUTES ---
app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { items, slot } = req.body;
    const user = await User.findById(req.user.id);
    const order = new Order({
      userId: user.id,
      userName: user.name,
      items,
      slot
    });
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to place order.' });
  }
});

app.get('/api/orders/my', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve your orders.' });
  }
});

app.put('/api/orders/:id', authenticate, async (req, res) => {
  try {
    const { items } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { items },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update the order.' });
  }
});

app.delete('/api/orders/:id', authenticate, async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID format.' });
    }
    const order = await Order.findOneAndDelete({ _id: orderId, userId: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found or unauthorized.' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Failed to delete order.' });
  }
});

app.get('/api/orders/summary', authenticate, async (req, res) => {
  try {
    const orders = await Order.find();
    
    let totalDrinks = 0;
    let totalWithSugar = 0;
    const morningSummary = { total: 0, withSugar: 0 };
    const afternoonSummary = { total: 0, withSugar: 0 };
    const tableMap = new Map();

    orders.forEach(order => {
      order.items.forEach(item => {
        const qty = item.quantity || 1;
        totalDrinks += qty;
        const isWithSugar = item.sugar === 'With Sugar';
        if (isWithSugar) totalWithSugar += qty;

        if (order.slot === '11:00 AM') {
          morningSummary.total += qty;
          if (isWithSugar) morningSummary.withSugar += qty;
        } else {
          afternoonSummary.total += qty;
          if (isWithSugar) afternoonSummary.withSugar += qty;
        }

        const key = `${item.drink}|${item.sugar}`;
        if (!tableMap.has(key)) {
          tableMap.set(key, { drink: item.drink, sugar: item.sugar, morningCount: 0, afternoonCount: 0, total: 0 });
        }
        const row = tableMap.get(key);
        if (order.slot === '11:00 AM') row.morningCount += qty;
        else row.afternoonCount += qty;
        row.total += qty;
      });
    });

    res.json({
      totalDrinks,
      totalWithSugar,
      morningSummary,
      afternoonSummary,
      table: Array.from(tableMap.values()).filter(r => r.total > 0)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate office summary.' });
  }
});

// --- MIDNIGHT RESET CRON ---
cron.schedule('0 0 * * *', async () => {
  console.log('Midnight Reset: Clearing all users and orders for the new day...');
  try {
    await Promise.all([
      Order.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('Fresh start: All data cleared.');
  } catch (err) {
    console.error('Midnight Reset Error:', err);
  }
});

// Serve static assets from the Vite build directory
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback for React Router (Single Page Application)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ message: 'API endpoint not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Office Brews Backend live on port ${PORT}`);
});