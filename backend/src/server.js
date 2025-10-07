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

function createApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());


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
  app.use('/api/table-reservation', reservationsRouter);

  // Tables management
  app.use('/api/tables', tablesRouter);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}

async function start(port = process.env.PORT || 3001) {
  await connectDB();
  const app = createApp();
  return app.listen(port, () => console.log(`Server running on port ${port}`));
}

module.exports = { createApp, start };
