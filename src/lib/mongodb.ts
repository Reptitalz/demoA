import { MongoClient, Db, MongoClientOptions } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'heyManitoApp';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Global is used here to maintain a cached connection across hot reloads in development.
// This prevents connections from growing exponentially during API Route usage.
let cached: {
  conn: { client: MongoClient; db: Db } | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
} = (global as any).mongo;

if (!cached) {
  cached = (global as any).mongo = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.conn) {
    // Ping the connection to check if it's still alive
    try {
        await cached.conn.client.db("admin").command({ ping: 1 });
        return cached.conn;
    } catch (e) {
        console.warn("Cached MongoDB connection was stale. Creating a new one.");
        cached.conn = null;
        cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts: MongoClientOptions = {};
    cached.promise = MongoClient.connect(MONGODB_URI!, opts).then((client) => {
      console.log("New MongoDB connection established.");
      return {
        client,
        db: client.db(MONGODB_DB_NAME),
      };
    }).catch(error => {
      console.error("Failed to connect to MongoDB", error);
      cached.promise = null; // Reset promise on failure
      throw error;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch(e) {
    // If the promise was rejected, ensure we clear it so the next call can retry.
    cached.promise = null;
    throw e;
  }
}
