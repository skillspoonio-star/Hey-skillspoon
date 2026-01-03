const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { connectDB } = require('./config/db');
const authRouter = require('./routes/auth');
const authTokenRouter = require('./routes/authToken');
const menuItemsRouter = require('./routes/menuItems');
const reviewsRouter = require('./routes/reviews');
const ordersRouter = require('./routes/orders');
const reservationsRouter = require('./routes/reservations');
const tablesRouter = require('./routes/tables');
const sessionsRouter = require('./routes/sessions');
const deliveriesRouter = require('./routes/deliveries');
const orderCountRouter = require('./routes/orderCount');
const analyticsRouter = require('./routes/analytics');
const razorpayRouter = require('./routes/razorpay');
const paymentsRouter = require('./routes/payments');
const paymentRequestsRouter = require('./routes/paymentRequests');
const restaurantRouter = require('./routes/restaurant');
function createApp() {
  const app = express();
  app.use(cors());

  // Increase body parser limits for image uploads
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


  // Mount admin auth routes from routes/auth.js
  app.use('/api/admin', authRouter);

  // Mount auth token verification routes
  app.use('/api/auth', authTokenRouter);

  // Menu items CRUD
  app.use('/api/menu/items', menuItemsRouter);

  // Reviews
  app.use('/api/reviews', reviewsRouter);

  // Orders
  app.use('/api/orders', ordersRouter);

  // Table reservations
  app.use('/api/reservation', reservationsRouter);

  // Tables management
  app.use('/api/tables', tablesRouter);

  // Sessions (table sessions and orders attached to sessions)
  app.use('/api/sessions', sessionsRouter);

  // Deliveries
  app.use('/api/deliveries', deliveriesRouter);

  // Restaurant information
  app.use('/api/restaurant', restaurantRouter);

  // Order counts
  app.use('/api/order-count', orderCountRouter);

  // Analytics
  app.use('/api/analytics', analyticsRouter);

  // Payments CRUD
  app.use('/api/payments', paymentsRouter);

  // Payment Requests (temporary, 30 min TTL)
  app.use('/api/payment-requests', paymentRequestsRouter);

  // payment gateway
  app.use('/api/razorpay', razorpayRouter);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}

async function start() {
  await connectDB();
  return createApp();
}

module.exports = { createApp, start };
