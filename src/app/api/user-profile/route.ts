
import type { UserProfile, AssistantConfig } from '@/types';
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
      // Ensure the returned profile conforms to the latest UserProfile structure
      const profileSafe: UserProfile = {
        firebaseUid: profile.firebaseUid,
        email: profile.email,
        isAuthenticated: true,
        assistants: (profile.assistants || []).map(asst => ({
          ...asst,
          purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
          imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
          businessInfo: asst.businessInfo || {}, // Ensure businessInfo is an object
        })),
        databases: profile.databases || [],
        ownerPhoneNumberForNotifications: profile.ownerPhoneNumberForNotifications,
        credits: profile.credits || 0, // Ensure credits field exists
        pushSubscriptions: profile.pushSubscriptions || [],
      };
      return NextResponse.json({ userProfile: profileSafe, message: "User profile fetched successfully" });
    } else {
      return NextResponse.json({ userProfile: null, message: "User profile not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("API GET Error (Database Operation or Data Processing):", error);
    return NextResponse.json({ message: 'Failed to fetch user profile due to an internal error' }, { status: 500 });
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
    
    const { db } = await connectToDatabase();

    // Prepare a clean, serializable profile for MongoDB, ensuring it matches the latest structure
    const serializableProfile = {
      firebaseUid: decodedToken.uid,
      email: userProfile.email,
      isAuthenticated: userProfile.isAuthenticated,
      ownerPhoneNumberForNotifications: userProfile.ownerPhoneNumberForNotifications,
      credits: userProfile.credits || 0,
      assistants: (userProfile.assistants || []).map((asst: any) => ({
        ...asst,
        purposes: Array.from(asst.purposes || []), // Ensure Set is converted to Array
        imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
        businessInfo: asst.businessInfo || {}, // Pass businessInfo through
      })),
      databases: userProfile.databases || [],
      pushSubscriptions: userProfile.pushSubscriptions || [],
    };
    
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
      return NextResponse.json({ message: 'Failed to save user profile to database' }, { status: 500 });
    }
  } catch (requestError) {
    console.error("API POST (Request Processing) Error:", requestError);
    if (requestError instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to process request due to an internal error' }, { status: 500 });
  }
}
