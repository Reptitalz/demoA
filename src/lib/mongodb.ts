
import { MongoClient, type Db, type MongoClientOptions } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'heyManitoApp'; // Default DB name if not set

if (!MONGODB_URI) {
  console.error("CRITICAL: MONGODB_URI environment variable is not set. Database connection will fail.");
  // Note: We throw an error inside the connectToDatabase function to avoid crashing the server on startup.
}

interface CustomMongoClientOptions extends MongoClientOptions {
  useNewUrlParser?: boolean;
  useUnifiedTopology?: boolean;
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!MONGODB_URI) {
    throw new Error('Database connection string (MONGODB_URI) is not configured on the server.');
  }

  if (cachedClient && cachedDb) {
    // Check if the client is still connected by pinging the admin database
    try {
      await cachedClient.db('admin').command({ ping: 1 });
      return { client: cachedClient, db: cachedDb };
    } catch (e) {
      console.warn("MongoDB connection lost, creating a new one.");
      cachedClient = null;
      cachedDb = null;
    }
  }

  const options: CustomMongoClientOptions = {};

  try {
    const client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    console.log("Successfully established a new connection to MongoDB.");
    
    const db = client.db(MONGODB_DB_NAME);

    cachedClient = client;
    cachedDb = db;

    return { client, db };

  } catch (e) {
    console.error("Failed to connect to MongoDB", e);
    // Invalidate cache on failure
    cachedClient = null;
    cachedDb = null;
    throw e; // Re-throw the error to be caught by the caller
  }
}
