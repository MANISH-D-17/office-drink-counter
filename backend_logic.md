
# Backend Implementation Guide

This file provides the necessary code structures to transition from the provided functional frontend (which uses a simulated API) to a real Node.js/Express environment.

## 1. Mongoose Order Schema

```javascript
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  drink: { type: String, required: true },
  sugar: { type: String, required: true },
  quantity: { type: Number, required: true },
  note: String
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  items: [OrderItemSchema],
  slot: { type: String, enum: ['11:00 AM', '03:00 PM'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
```

## 2. Midnight Order Reseter (Node-cron)

To delete orders every night at 12:00 AM in a production backend:

```javascript
const cron = require('node-cron');
const Order = require('./models/Order');

// Schedule: 0 0 * * * (At 00:00 every day)
cron.schedule('0 0 * * *', async () => {
  console.log('Running Midnight Reset: Deleting all orders...');
  try {
    const result = await Order.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} orders.`);
  } catch (err) {
    console.error('Failed to reset orders:', err);
  }
});
```

## 3. MongoDB Aggregation Query (Office Summary)

This query powers the "Detailed Summary Table" requested.

```javascript
// GET /api/orders/summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await Order.aggregate([
      // Step 1: Flatten the items array
      { $unwind: "$items" },
      // Step 2: Group by Drink Type and Sugar Preference
      {
        $group: {
          _id: {
            drink: "$items.drink",
            sugar: "$items.sugar"
          },
          morningCount: {
            $sum: {
              $cond: [{ $eq: ["$slot", "11:00 AM"] }, "$items.quantity", 0]
            }
          },
          afternoonCount: {
            $sum: {
              $cond: [{ $eq: ["$slot", "03:00 PM"] }, "$items.quantity", 0]
            }
          },
          total: { $sum: "$items.quantity" }
        }
      },
      // Step 3: Project back to a cleaner format
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
      // Step 4: Sort (optional)
      { $sort: { total: -1 } }
    ]);

    // Calculate overall stats
    const stats = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalDrinks: { $sum: "$items.quantity" },
          totalWithSugar: {
            $sum: {
              $cond: [{ $eq: ["$items.sugar", "With Sugar"] }, "$items.quantity", 0]
            }
          }
        }
      }
    ]);

    res.json({
      table: summary,
      stats: stats[0] || { totalDrinks: 0, totalWithSugar: 0 }
    });
  } catch (err) {
    res.status(500).send(err);
  }
});
```

## 4. API Endpoints Setup

* `POST /api/auth/register`: Create user, hash pin (bcrypt), return JWT.
* `POST /api/auth/login`: Validate email/pin, return JWT.
* `POST /api/orders`: Save new Order document from cart.
* `GET /api/orders/my`: `Order.find({ userId: req.user.id })`.
* `GET /api/orders/summary`: Aggregation logic as shown above.

## 5. Deployment Steps

1. **Backend (Render)**:
   - Connect GitHub repo.
   - Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`.
   - Start command: `node server.js`.

2. **Frontend (Vercel)**:
   - Connect GitHub repo.
   - Set `VITE_API_BASE_URL` to your Render URL.
   - Build command: `npm run build`.

3. **Database (MongoDB Atlas)**:
   - Create cluster.
   - Whitelist IP (0.0.0.0 for Render).
   - Get Connection String.
