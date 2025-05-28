// src/app/api/user-profile/route.ts
import type { UserProfile } from '@/types';
// import { MongoClient } from 'mongodb'; // Would be used in actual implementation

// IMPORTANT: The MongoDB connection string should be stored securely as an environment variable
// on the server, e.g., process.env.MONGODB_URI.
// const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongo:3afd43b0acf3e55fcd1a@reptitalz.cloud:27017/?tls=false";
// const DB_NAME = 'heyManitoApp'; // Choose your database name
// const PROFILES_COLLECTION = 'userProfiles';

// let client: MongoClient;

// async function connectToDatabase() {
//   if (client && client.topology && client.topology.isConnected()) {
//     return client.db(DB_NAME);
//   }
//   client = new MongoClient(MONGODB_URI);
//   await client.connect();
//   return client.db(DB_NAME);
// }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // Firebase UID

  if (!userId) {
    return Response.json({ message: 'User ID is required' }, { status: 400 });
  }

  console.log(`API GET /api/user-profile: Attempting to fetch profile for userId: ${userId}`);

  // TODO: Implement actual MongoDB fetching logic here
  // try {
  //   const db = await connectToDatabase();
  //   const profile = await db.collection(PROFILES_COLLECTION).findOne({ firebaseUid: userId });
  //   if (profile) {
  //     // Remember to deserialize Sets if they were stored as arrays, e.g., for assistant.purposes
  //     return Response.json({ userProfile: profile, message: "User profile fetched successfully" });
  //   } else {
  //     return Response.json({ userProfile: null, message: "User profile not found" }, { status: 404 });
  //   }
  // } catch (error) {
  //   console.error("API GET Error:", error);
  //   return Response.json({ message: 'Failed to fetch user profile', error: (error as Error).message }, { status: 500 });
  // }

  // Mock response for now:
  if (userId === "mockUser123") { // Example mock
    const mockProfile: UserProfile = {
        isAuthenticated: true,
        authProvider: "google",
        email: "mock@example.com",
        currentPlan: "free",
        assistants: [],
        databases: [],
        firebaseUid: userId,
    };
    return Response.json({ userProfile: mockProfile, message: "Mock GET: User profile fetched (mock data)" });
  }
  return Response.json({ userProfile: null, message: "Mock GET: User profile not found for this userId" }, { status: 404 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userProfile } = body; // userId is Firebase UID

    if (!userId || !userProfile) {
      return Response.json({ message: 'User ID and userProfile are required' }, { status: 400 });
    }

    console.log(`API POST /api/user-profile: Attempting to save profile for userId: ${userId}`);
    // console.log("Profile data received:", userProfile);


    // TODO: Implement actual MongoDB saving/updating logic here
    // try {
    //   const db = await connectToDatabase();
    //   // Ensure assistant.purposes (Set) is serialized to Array before saving if UserProfile type has Sets
    //   const serializableProfile = {
    //     ...userProfile,
    //     firebaseUid: userId, // Ensure firebaseUid is part of the document
    //     assistants: userProfile.assistants.map((asst: any) => ({
    //       ...asst,
    //       purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || []),
    //     })),
    //   };
    //   await db.collection(PROFILES_COLLECTION).updateOne(
    //     { firebaseUid: userId },
    //     { $set: serializableProfile },
    //     { upsert: true } // Creates the document if it doesn't exist
    //   );
    //   return Response.json({ message: "User profile saved successfully" });
    // } catch (error) {
    //   console.error("API POST Error:", error);
    //   return Response.json({ message: 'Failed to save user profile', error: (error as Error).message }, { status: 500 });
    // }

    // Mock response for now:
    return Response.json({ message: "Mock POST: User profile save initiated (not actually saved to DB)" });

  } catch (error) {
    console.error("API POST (request body parsing) Error:", error);
    return Response.json({ message: 'Invalid request body', error: (error as Error).message }, { status: 400 });
  }
}
