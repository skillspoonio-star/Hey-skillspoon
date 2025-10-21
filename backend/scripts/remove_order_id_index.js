// Script: remove_order_id_index.js
// Purpose: Drop the legacy unique index on `id` in the `orders` collection (id_1)
// and remove any existing `id` fields from documents to avoid E11000 duplicate key errors.

const mongoose = require('mongoose');

// Use MONGO_URI from env or default to local
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/Hey-skillspoon';

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;
  const collName = 'orders';

  try {
    const indexes = await db.collection(collName).indexes();

    // If the legacy index 'id_1' exists, drop it
    const targetIndex = indexes.find(i => i.name === 'id_1');
    if (targetIndex) {
      await db.collection(collName).dropIndex('id_1');
    } else {
    }
    const result = await db.collection(collName).updateMany({ id: { $exists: true } }, { $unset: { id: '' } });
  } catch (err) {
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
