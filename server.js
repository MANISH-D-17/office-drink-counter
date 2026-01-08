const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'office-brews-fallback-secret';
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://manish:GU9R6kswaW4kSj2l@cluster0.a8hpucr.mongodb.net/?appName=Cluster0";

// Middlewares
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  pin: { type: String, required: true }
});

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

const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);

// --- AUTH MIDDLEWARE ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, pin } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const newUser = new User({ name, email, pin });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET);
    res.json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email, pin });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { name, email, pin } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name;
    user.email = email;
    if (pin) user.pin = pin;
    await user.save();

    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ORDER ROUTES ---
app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { items, slot } = req.body;
    const user = await User.findById(req.user.id);
    const order = new Order({
      userId: user._id,
      userName: user.name,
      items,
      slot
    });
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/orders/my', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
        totalDrinks += item.quantity;
        const isWithSugar = item.sugar === 'With Sugar';
        if (isWithSugar) totalWithSugar += item.quantity;

        if (order.slot === '11:00 AM') {
          morningSummary.total += item.quantity;
          if (isWithSugar) morningSummary.withSugar += item.quantity;
        } else {
          afternoonSummary.total += item.quantity;
          if (isWithSugar) afternoonSummary.withSugar += item.quantity;
        }

        const key = `${item.drink}|${item.sugar}`;
        if (!tableMap.has(key)) {
          tableMap.set(key, { drink: item.drink, sugar: item.sugar, morningCount: 0, afternoonCount: 0, total: 0 });
        }
        const row = tableMap.get(key);
        if (order.slot === '11:00 AM') row.morningCount += item.quantity;
        else row.afternoonCount += item.quantity;
        row.total += item.quantity;
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
    res.status(500).json({ message: err.message });
  }
});

// --- MIDNIGHT RESET CRON ---
cron.schedule('0 0 * * *', async () => {
  console.log('Midnight Reset: Clearing all orders...');
  try {
    await Order.deleteMany({});
    console.log('Successfully cleared all orders for the new day.');
  } catch (err) {
    console.error('Failed to clear orders:', err);
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});