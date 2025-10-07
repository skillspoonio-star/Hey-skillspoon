// Script: remove_order_id_index.js
// Purpose: Drop the legacy unique index on `id` in the `orders` collection (id_1)
// and remove any existing `id` fields from documents to avoid E11000 duplicate key errors.

const mongoose = require('mongoose');

// Use MONGO_URI from env or default to local
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/Hey-skillspoon';

async function run() {
  console.log('Connecting to', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;
  const collName = 'orders';

  try {
    const indexes = await db.collection(collName).indexes();
    console.log('Existing indexes:', indexes.map(i => i.name));

    // If the legacy index 'id_1' exists, drop it
    const targetIndex = indexes.find(i => i.name === 'id_1');
    if (targetIndex) {
      console.log("Dropping index 'id_1'...");
      await db.collection(collName).dropIndex('id_1');
      console.log("Dropped index 'id_1'.");
    } else {
      console.log("Index 'id_1' not found. Nothing to drop.");
    }

    // Remove any `id` fields from existing documents (if present)
    console.log('Unsetting `id` field from documents (if any)...');
    const result = await db.collection(collName).updateMany({ id: { $exists: true } }, { $unset: { id: '' } });
    console.log(`Documents matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
