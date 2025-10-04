// Load env from backend/.env
require("dotenv").config();
// Entry point — bootstraps the src/server
const { start } = require('./src/server');

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
