
// src/app/api/user-profile/route.ts
import type { UserProfile, SubscriptionPlanType, AssistantConfig, DatabaseConfig } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';

const PROFILES_COLLECTION = 'userProfiles';
const PAID_PLANS: SubscriptionPlanType[] = ['premium_179', 'business_270'];

// Helper to normalize assistant arrays for comparison (ensures purposes are sorted arrays and imageUrl is present)
const normalizeAssistantsForComparison = (assistants: AssistantConfig[]): any[] => {
  return (assistants || []).map(asst => ({
    ...asst,
    purposes: Array.from(asst.purposes || []).sort(),
    imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL, // Ensure imageUrl is part of comparison
    // Ensure other potentially variable fields are handled if deep comparison is needed
  }));
};


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
    const existingProfile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({ firebaseUid: decodedToken.uid });

    // Test Plan logic - set to pending acquisition instead of buying number directly
    if (userProfile.currentPlan === 'test_plan' && !existingProfile?.virtualPhoneNumber && existingProfile?.numberActivationStatus !== 'pending_acquisition') {
        console.log(`Test plan detected for user ${decodedToken.uid}. Setting number status to 'pending_acquisition'.`);
        userProfile.numberActivationStatus = 'pending_acquisition';
    }


    const incomingAssistantsRaw = userProfile.assistants || [];
    const incomingAssistantsProcessed: AssistantConfig[] = Array.isArray(incomingAssistantsRaw) ? incomingAssistantsRaw.map((asst: any) => ({
      ...asst,
      id: asst.id || `asst_fallback_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
      imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
    })) : [];

    let finalAssistantsToSave: AssistantConfig[] = incomingAssistantsProcessed;
    let messageSuffix = "";

    if (existingProfile) { // User exists, apply plan-based logic for assistant updates
      const planForSaving = userProfile.currentPlan as SubscriptionPlanType | null; // This is the plan the user *will be on*
      const isSavingToPaidPlan = planForSaving && PAID_PLANS.includes(planForSaving);

      const existingAssistantsForComparison = normalizeAssistantsForComparison(existingProfile.assistants || []);
      const incomingAssistantsForComparison = normalizeAssistantsForComparison(incomingAssistantsProcessed);

      const assistantsPayloadChanged = JSON.stringify(existingAssistantsForComparison) !== JSON.stringify(incomingAssistantsForComparison);

      if (assistantsPayloadChanged && !isSavingToPaidPlan) {
        console.warn(`User ${decodedToken.uid} on non-paid plan (${planForSaving || 'none'}) ` +
                    `attempted to modify assistants. Assistant changes will be IGNORED.`);
        finalAssistantsToSave = (existingProfile.assistants || []).map(asst => ({ // Revert to DB state
            ...asst,
            purposes: Array.from(asst.purposes || new Set()), // Ensure purposes are arrays
            imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
        }));
        messageSuffix = " Assistant configurations were not saved due to current plan restrictions.";
      } else if (assistantsPayloadChanged && isSavingToPaidPlan) {
        console.log(`User ${decodedToken.uid} on paid plan (${planForSaving}) modifying assistants. Changes will be saved.`);
      }
    }

    const serializableProfile: Omit<UserProfile, '_id'> = {
      ...(userProfile as Omit<UserProfile, 'assistants' | 'databases'>), 
      firebaseUid: decodedToken.uid,
      assistants: finalAssistantsToSave.map(asst => ({
        ...asst,
        imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
      })),
      databases: Array.isArray(userProfile.databases) ? userProfile.databases.map((dbConfig: any) => ({
        ...dbConfig,
        id: dbConfig.id || `db_fallback_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      })) : [],
    };
     // Ensure all UserProfile fields are present, even if undefined from client
    if (serializableProfile.email === undefined) serializableProfile.email = existingProfile?.email || undefined;
    if (serializableProfile.isAuthenticated === undefined) serializableProfile.isAuthenticated = existingProfile?.isAuthenticated || true;
    if (serializableProfile.authProvider === undefined) serializableProfile.authProvider = existingProfile?.authProvider || undefined;
    if (serializableProfile.currentPlan === undefined) serializableProfile.currentPlan = existingProfile?.currentPlan || null;
    if (serializableProfile.stripeCustomerId === undefined) serializableProfile.stripeCustomerId = existingProfile?.stripeCustomerId || undefined;
    if (serializableProfile.stripeSubscriptionId === undefined) serializableProfile.stripeSubscriptionId = existingProfile?.stripeSubscriptionId || undefined;
    if (serializableProfile.virtualPhoneNumber === undefined) serializableProfile.virtualPhoneNumber = existingProfile?.virtualPhoneNumber || undefined;
    if (serializableProfile.numberActivationStatus === undefined) serializableProfile.numberActivationStatus = existingProfile?.numberActivationStatus || undefined;
    if (serializableProfile.numberCountryCode === undefined) serializableProfile.numberCountryCode = existingProfile?.numberCountryCode || undefined;
    if (serializableProfile.numberActivationId === undefined) serializableProfile.numberActivationId = existingProfile?.numberActivationId || undefined;
    if (serializableProfile.ownerPhoneNumberForNotifications === undefined) serializableProfile.ownerPhoneNumberForNotifications = existingProfile?.ownerPhoneNumberForNotifications || undefined;

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

      return NextResponse.json({ message: `${responseMessage}${messageSuffix}`, userId: decodedToken.uid, ...(result.upsertedId && {upsertedId: result.upsertedId}) });

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
