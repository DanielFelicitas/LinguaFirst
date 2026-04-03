const mongoose = require("mongoose");

/** Strip quotes if MONGODB_URI was pasted with surrounding " in the Vercel UI. */
function trimUri(uri) {
  if (uri == null) return "";
  let s = String(uri).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Serverless-friendly Mongo connection (Vercel): reuse when connected, wait when connecting.
 */
async function connectDB() {
  const ready = mongoose.connection.readyState;
  if (ready === 1) {
    return mongoose.connection;
  }
  if (ready === 2 && typeof mongoose.connection.asPromise === "function") {
    await mongoose.connection.asPromise();
    return mongoose.connection;
  }

  const uri = trimUri(process.env.MONGODB_URI);
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15_000,
    socketTimeoutMS: 45_000,
    maxPoolSize: 10,
    family: 4,
  });
  return mongoose.connection;
}

module.exports = connectDB;
