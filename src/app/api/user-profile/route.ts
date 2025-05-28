
// src/app/api/user-profile/route.ts
import type { UserProfile } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const PROFILES_COLLECTION = 'userProfiles';

export async function GET(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get('userId');

  if (!queryUserId) {
    return NextResponse.json({ message: 'User ID is required in query parameters' }, { status: 400 });
  }

  if (decodedToken.uid !== queryUserId) {
    return NextResponse.json({ message: 'Forbidden: Token UID does not match requested User ID' }, { status: 403 });
  }

  try {
    const { db } = await connectToDatabase();
    const profile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({ firebaseUid: queryUserId });

    if (profile) {
      const profileSafe = {
        ...profile,
        assistants: Array.isArray(profile.assistants) ? profile.assistants.map(asst => ({
          ...asst,
          purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
        })) : [],
      };
      // Optionally remove _id if you don't want to expose it, though it's generally fine.
      // delete (profileSafe as any)._id; 
      return NextResponse.json({ userProfile: profileSafe, message: "User profile fetched successfully" });
    } else {
      return NextResponse.json({ userProfile: null, message: "User profile not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("API GET Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: 'Failed to fetch user profile', error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId: bodyUserId, userProfile } = body;

    if (!bodyUserId || !userProfile) {
      return NextResponse.json({ message: 'User ID and userProfile are required in the body' }, { status: 400 });
    }

    if (decodedToken.uid !== bodyUserId) {
      return NextResponse.json({ message: 'Forbidden: Token UID does not match User ID in request body' }, { status: 403 });
    }

    if (userProfile.firebaseUid && userProfile.firebaseUid !== decodedToken.uid) {
      return NextResponse.json({ message: 'Forbidden: firebaseUid in profile data does not match authenticated user.' }, { status: 403 });
    }

    // Normalize assistants and convert sets to arrays in prop purposes
    const assistants = Array.isArray(userProfile.assistants) ? userProfile.assistants.map((asst: any) => ({
      ...asst,
      purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
    })) : [];

    const serializableProfile: Omit<UserProfile, '_id'> = { // Ensure _id is not part of the type we $set
      ...userProfile,
      firebaseUid: decodedToken.uid, // Use authoritative UID from token
      assistants,
    };
     // Remove _id explicitly if it's somehow present in userProfile from client
    delete (serializableProfile as any)._id;


    try {
      const { db } = await connectToDatabase();
      const result = await db.collection<UserProfile>(PROFILES_COLLECTION).updateOne(
        { firebaseUid: decodedToken.uid },
        { $set: serializableProfile },
        { upsert: true }
      );

      if (result.upsertedId) {
        return NextResponse.json({ message: "User profile created successfully", userId: decodedToken.uid, upsertedId: result.upsertedId });
      } else if (result.modifiedCount > 0) {
        return NextResponse.json({ message: "User profile updated successfully", userId: decodedToken.uid });
      } else if (result.matchedCount > 0) {
         return NextResponse.json({ message: "User profile already up to date", userId: decodedToken.uid }, { status: 200 });
      }
      else {
        // This case should ideally not be hit if upsert: true and the operation was successful without errors.
        console.error("API POST: Unexpected result from updateOne with upsert:true and no error thrown by driver.", result);
        return NextResponse.json({ message: "Failed to save user profile: Unexpected database response" }, { status: 500 });
      }
    } catch (error) {
      console.error("API POST (DB operation) Error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ message: 'Failed to save user profile to database', error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("API POST (request processing) Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON in request body', error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to process request', error: errorMessage }, { status: 500 });
  }
}
