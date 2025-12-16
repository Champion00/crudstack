import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// @ts-expect-error
let cached: MongooseCache = global.mongoose;

if (!cached) {
  // @ts-expect-error
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;
console.log("MONGODB_URI:", MONGODB_URI);
  if (!MONGODB_URI) {
    throw new Error(
      "❌ MONGODB_URI is missing. Check .env.local and restart server."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: true,
      maxPoolSize: 10,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
