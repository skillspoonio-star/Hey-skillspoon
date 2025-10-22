const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);  // no extra options needed
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
