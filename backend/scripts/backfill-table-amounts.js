// Usage: node scripts/backfill-table-amounts.js
// Backfills missing `amount` and `reservationPrice` fields on Table documents.

const mongoose = require('mongoose');
const Table = require('../src/models/table');
const { connectDB } = require('../src/config/db');

async function run() {
  await connectDB();
  try {
    const res = await Table.updateMany({ reservationPrice: { $exists: false } }, { $set: { reservationPrice: 0 } });
  } catch (err) {
    console.error('Backfill failed:', err);
  } finally {
    mongoose.connection.close();
  }
}

run();
