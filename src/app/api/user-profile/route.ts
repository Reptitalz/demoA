
import type { UserProfile, AssistantConfig } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

const PROFILES_COLLECTION = 'userProfiles';

// This function now exclusively fetches a user profile by their email address.
// This is used by the AppProvider to check for an existing profile after a Firebase login.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ message: 'Email query parameter is required' }, { status: 400 });
  }
  
  try {
    const { db } = await connectToDatabase();
    const profile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({ email: email });
    if (profile) {
      return NextResponse.json({ userProfile: profile, message: "User profile fetched successfully" });
    } else {
      return NextResponse.json({ userProfile: null, message: "User profile not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("API GET Error (unauthenticated):", error);
    return NextResponse.json({ message: 'Failed to fetch user profile due to an internal error' }, { status: 500 });
  }
}


export async function PUT(request: NextRequest) {
    // This part of the API is still required for updating the profile from the dashboard.
    
  try {
    const { userProfile } = await request.json();
    const userId = userProfile._id;

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

    // Create a copy of the profile and remove fields that should not be updated directly
    const { _id, isAuthenticated, email, firebaseUid, authProvider, ...updateData } = userProfile;
    
    // Ensure assistants and databases are arrays and have required fields initialized
    if (updateData.assistants) {
      updateData.assistants = updateData.assistants.map((asst: AssistantConfig) => ({
        ...asst,
        purposes: Array.isArray(asst.purposes) ? asst.purposes : [],
        messageCount: asst.messageCount || 0,
        monthlyMessageLimit: asst.monthlyMessageLimit || 0,
      }));
    }
     if (updateData.databases) {
      updateData.databases = updateData.databases.map((db: any) => ({
        ...db,
        selectedColumns: db.selectedColumns || [],
        relevantColumnsDescription: db.relevantColumnsDescription || '',
      }));
    }

    const result = await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User profile updated successfully', updatedCount: result.modifiedCount });

  } catch (error) {
    console.error("API PUT Error:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update user profile' }, { status: 500 });
  }
}

    
