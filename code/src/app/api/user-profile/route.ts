
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';

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
          imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
        })) : [],
      };
      return NextResponse.json({ userProfile: profileSafe, message: "User profile fetched successfully" });
    } else {
      return NextResponse.json({ userProfile: null, message: "User profile not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("API GET Error (Database Operation or Data Processing):", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: 'Failed to fetch user profile due to an internal error', error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { userId: bodyUserId, userProfile } = body;

    if (!bodyUserId || !userProfile) {
      return NextResponse.json({ message: 'User ID and userProfile are required in the body' }, { status: 400 });
    }

    if (decodedToken.uid !== bodyUserId) {
      return NextResponse.json({ message: 'Forbidden: Token UID does not match User ID in request body' }, { status: 403 });
    }

    if (userProfile.firebaseUid && userProfile.firebaseUid !== decodedToken.uid) {
      console.warn("Mismatch between userProfile.firebaseUid in body and token UID. Using token UID.");
    }
    
    const { db } = await connectToDatabase();

    // Prepare a clean, serializable profile for MongoDB
    const serializableProfile = {
      ...userProfile,
      firebaseUid: decodedToken.uid, // Enforce correct UID from token
      assistants: (userProfile.assistants || []).map((asst: any) => ({
        ...asst,
        purposes: Array.from(asst.purposes || []), // Ensure Set is converted to Array
        imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
      })),
      databases: userProfile.databases || [],
    };
    
    // Remove _id if it exists to prevent mongo error on update with upsert
    delete (serializableProfile as any)._id;

    try {
      const result = await db.collection<UserProfile>(PROFILES_COLLECTION).updateOne(
        { firebaseUid: decodedToken.uid },
        { $set: serializableProfile },
        { upsert: true }
      );

      let responseMessage = "";
      if (result.upsertedId) {
        responseMessage = "User profile created successfully.";
      } else if (result.modifiedCount > 0) {
        responseMessage = "User profile updated successfully.";
      } else if (result.matchedCount > 0 && result.modifiedCount === 0) {
         responseMessage = "User profile already up to date.";
      } else {
        console.error("API POST: No document matched, and no document was upserted despite upsert:true.", result);
        return NextResponse.json({ message: "Failed to save user profile: No document matched or upserted" }, { status: 500 });
      }

      return NextResponse.json({ message: responseMessage, userId: decodedToken.uid, ...(result.upsertedId && {upsertedId: result.upsertedId}) });

    } catch (dbError) {
      console.error("API POST (DB operation) Error:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      return NextResponse.json({ message: 'Failed to save user profile to database', error: errorMessage }, { status: 500 });
    }
  } catch (requestError) {
    console.error("API POST (Request Processing) Error:", requestError);
    const errorMessage = requestError instanceof Error ? requestError.message : String(requestError);
    if (requestError instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON in request body', error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to process request due to an internal error', error: errorMessage }, { status: 500 });
  }
}
