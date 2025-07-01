
import { MongoClient, type Db, type MongoClientOptions } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'heyManitoApp'; // Default DB name if not set

interface CustomMongoClientOptions extends MongoClientOptions {
  useNewUrlParser?: boolean;
  useUnifiedTopology?: boolean;
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Moved the check inside the function to prevent server startup crash.
  if (!MONGODB_URI) {
    console.error("CRITICAL: MONGODB_URI environment variable is not set. Database connection will fail.");
    throw new Error('Database connection string is not configured on the server.');
  }

  if (cachedClient && cachedDb) {
    // Check if the client is still connected
    try {
      // Perform a lightweight operation to check connectivity
      await cachedClient.db(MONGODB_DB_NAME).command({ ping: 1 });
      return { client: cachedClient, db: cachedDb };
    } catch (e) {
      // Connection lost, reset cache
      cachedClient = null;
      cachedDb = null;
    }
  }

  const options: CustomMongoClientOptions = {};

  const client = new MongoClient(MONGODB_URI, options);

  try {
    await client.connect();
    console.log("Successfully connected to MongoDB.");
  } catch (e) {
    console.error("Failed to connect to MongoDB", e);
    throw e; // Re-throw the error to be caught by the caller
  }

  const db = client.db(MONGODB_DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
