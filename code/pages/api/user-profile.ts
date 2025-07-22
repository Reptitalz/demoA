import type { UserProfile } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import * as admin from 'firebase-admin';

// --- Firebase Admin Initialization (Server-Side Only) ---
const FIREBASE_SERVICE_ACCOUNT_JSON_STRING = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (admin.apps.length === 0 && FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
  try {
    // Replace literal \n with actual newlines for the private_key
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON_STRING.replace(/\\n/g, '\n'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK for user-profile route initialized.");
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error in user-profile route:', e.stack);
  }
}
// --- End Firebase Admin Initialization ---

async function verifyFirebaseToken(request: NextRequest): Promise<admin.auth.DecodedIdToken | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) return null;

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying Firebase ID token in user-profile route:', error);
    return null;
  }
}


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
          // Ensure purposes is always an array to prevent iteration errors
          purposes: Array.isArray(asst.purposes) ? asst.purposes : [],
          imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
          businessInfo: asst.businessInfo || {},
        })),
        databases: profile.databases || [],
        ownerPhoneNumberForNotifications: profile.ownerPhoneNumberForNotifications,
        credits: profile.credits || 0,
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

    // Prepare a clean, serializable profile for MongoDB
    const serializableProfile = {
      firebaseUid: decodedToken.uid,
      email: userProfile.email,
      isAuthenticated: userProfile.isAuthenticated,
      ownerPhoneNumberForNotifications: userProfile.ownerPhoneNumberForNotifications,
      credits: userProfile.credits || 0,
      assistants: (userProfile.assistants || []).map((asst: any) => ({
        ...asst,
        // Ensure purposes is converted to Array for MongoDB
        purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || []),
        imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
        businessInfo: asst.businessInfo || {},
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