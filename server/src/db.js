const mongoose = require("mongoose");

let cached = global.mongoose;

async function connectDB() {
  if (cached?.conn) {
    return cached.conn;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }
  const conn = await mongoose.connect(uri);
  cached = global.mongoose = { conn };
  return conn;
}

module.exports = connectDB;
