const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { connectDB } = require('./config/db');
const { login, verifyOtp } = require('./controllers/login');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());


  app.post('/api/admin/login', login);
  app.post('/api/admin/verify-otp', verifyOtp);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}

async function start(port = process.env.PORT || 3001) {
  await connectDB();
  const app = createApp();
  return app.listen(port, () => console.log(`Server running on port ${port}`));
}

module.exports = { createApp, start };
