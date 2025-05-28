
// src/app/api/user-profile/route.ts
import type { UserProfile } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { type NextRequest } from 'next/server';

const PROFILES_COLLECTION = 'userProfiles';

export async function GET(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return Response.json({ message: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get('userId'); // Firebase UID from query

  if (!queryUserId) {
    return Response.json({ message: 'User ID is required in query parameters' }, { status: 400 });
  }

  // Security check: Ensure the queried userId matches the token's uid
  if (decodedToken.uid !== queryUserId) {
    return Response.json({ message: 'Forbidden: Token UID does not match requested User ID' }, { status: 403 });
  }

  console.log(`API GET /api/user-profile: Attempting to fetch profile for userId: ${queryUserId}`);

  try {
    const { db } = await connectToDatabase();
    const profile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({ firebaseUid: queryUserId });

    if (profile) {
      // Ensure purposes are Sets if they were stored as arrays (MongoDB stores Sets as arrays)
      const profileWithSets = {
        ...profile,
        assistants: profile.assistants.map(asst => ({
          ...asst,
          purposes: new Set(Array.isArray(asst.purposes) ? asst.purposes : []),
        })),
      };
      // Remove _id before sending to client if you don't want to expose it
      // delete (profileWithSets as any)._id; 
      return Response.json({ userProfile: profileWithSets, message: "User profile fetched successfully" });
    } else {
      return Response.json({ userProfile: null, message: "User profile not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("API GET Error:", error);
    return Response.json({ message: 'Failed to fetch user profile', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return Response.json({ message: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId: bodyUserId, userProfile } = body; // userId from body is Firebase UID

    if (!bodyUserId || !userProfile) {
      return Response.json({ message: 'User ID and userProfile are required in the body' }, { status: 400 });
    }

    // Security check: Ensure the userId in the body matches the token's uid
    if (decodedToken.uid !== bodyUserId) {
      return Response.json({ message: 'Forbidden: Token UID does not match User ID in request body' }, { status: 403 });
    }
    
    // Ensure firebaseUid in the profile matches the authenticated user
    if (userProfile.firebaseUid && userProfile.firebaseUid !== decodedToken.uid) {
         return Response.json({ message: 'Forbidden: firebaseUid in profile data does not match authenticated user.' }, { status: 403 });
    }


    console.log(`API POST /api/user-profile: Attempting to save profile for userId: ${bodyUserId}`);

    try {
      const { db } = await connectToDatabase();
      
      const serializableProfile = {
        ...userProfile,
        firebaseUid: decodedToken.uid, // Ensure the UID from the token is authoritative
        assistants: userProfile.assistants.map((asst: any) => ({
          ...asst,
          purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
        })),
      };
      // Remove _id if it exists from client-side profile to avoid issues with MongoDB's _id handling on upsert
      delete (serializableProfile as any)._id;

      const result = await db.collection<UserProfile>(PROFILES_COLLECTION).updateOne(
        { firebaseUid: decodedToken.uid }, // Query by the authenticated user's UID
        { $set: serializableProfile },
        { upsert: true } // Creates the document if it doesn't exist
      );

      if (result.upsertedCount > 0) {
        return Response.json({ message: "User profile created successfully", userId: decodedToken.uid });
      } else if (result.modifiedCount > 0 || result.matchedCount > 0) { // matchedCount > 0 means it existed, even if not modified
        return Response.json({ message: "User profile updated successfully", userId: decodedToken.uid });
      } else {
         // This case should ideally not be hit with upsert:true if the query is correct
        return Response.json({ message: "User profile not changed (already up to date or error)"}, { status: 200 });
      }

    } catch (error) {
      console.error("API POST (DB operation) Error:", error);
      return Response.json({ message: 'Failed to save user profile to database', error: (error as Error).message }, { status: 500 });
    }

  } catch (error) {
    console.error("API POST (request body parsing) Error:", error);
    return Response.json({ message: 'Invalid request body', error: (error as Error).message }, { status: 400 });
  }
}
