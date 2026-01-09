const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
    quantity: Number,
    note: String
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
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email, pin });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: user });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.put('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { name, email, pin } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.name = name;
    user.email = email;
    if (pin) user.pin = pin;
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Update failed.' });
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
    res.status(500).json({ message: 'Order placement failed.' });
  }
});

app.get('/api/orders/my', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed.' });
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
    res.status(500).json({ message: 'Update failed.' });
  }
});

app.delete('/api/orders/:id', authenticate, async (req, res) => {
  try {
    await Order.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed.' });
  }
});

app.get('/api/orders/summary', authenticate, async (req, res) => {
  try {
    const tableData = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: { drink: "$items.drink", sugar: "$items.sugar" },
          morningCount: {
            $sum: { $cond: [{ $eq: ["$slot", "11:00 AM"] }, "$items.quantity", 0] }
          },
          afternoonCount: {
            $sum: { $cond: [{ $eq: ["$slot", "03:00 PM"] }, "$items.quantity", 0] }
          },
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
          totalWithSugar: {
            $sum: { $cond: [{ $eq: ["$items.sugar", "With Sugar"] }, "$items.quantity", 0] }
          },
          morningTotal: {
            $sum: { $cond: [{ $eq: ["$slot", "11:00 AM"] }, "$items.quantity", 0] }
          },
          morningSugar: {
            $sum: { $cond: [{ $and: [{ $eq: ["$slot", "11:00 AM"] }, { $eq: ["$items.sugar", "With Sugar"] }] }, "$items.quantity", 0] }
          },
          afternoonTotal: {
            $sum: { $cond: [{ $eq: ["$slot", "03:00 PM"] }, "$items.quantity", 0] }
          },
          afternoonSugar: {
            $sum: { $cond: [{ $and: [{ $eq: ["$slot", "03:00 PM"] }, { $eq: ["$items.sugar", "With Sugar"] }] }, "$items.quantity", 0] }
          }
        }
      }
    ]);

    const stats = statsData[0] || { totalDrinks: 0, totalWithSugar: 0, morningTotal: 0, morningSugar: 0, afternoonTotal: 0, afternoonSugar: 0 };
    const allOrders = await Order.find().sort({ createdAt: -1 });

    res.json({
      totalDrinks: stats.totalDrinks,
      totalWithSugar: stats.totalWithSugar,
      morningSummary: { total: stats.morningTotal, withSugar: stats.morningSugar },
      afternoonSummary: { total: stats.afternoonTotal, withSugar: stats.afternoonSugar },
      table: tableData,
      allOrders
    });
  } catch (err) {
    res.status(500).json({ message: 'Summary aggregation failed.' });
  }
});

const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(path.join(distPath, 'index.html'));
  else res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, () => console.log(`Server live on ${PORT}`));