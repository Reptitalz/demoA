
import type { UserProfile, AssistantConfig } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { ObjectId } from 'mongodb';

const PROFILES_COLLECTION = 'userProfiles';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const profile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({ email: email });

    if (profile) {
      // Ensure the returned profile conforms to the latest UserProfile structure
      const profileSafe: UserProfile & { isAuthenticated: boolean } = {
        _id: profile._id,
        isAuthenticated: true,
        email: profile.email,
        firebaseUid: profile.firebaseUid,
        authProvider: 'google',
        firstName: profile.firstName,
        lastName: profile.lastName,
        address: profile.address,
        assistants: (profile.assistants || []).map(asst => ({
          ...asst,
          isActive: asst.isActive || false,
          purposes: Array.isArray(asst.purposes) ? asst.purposes : [],
          imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
          businessInfo: asst.businessInfo || {},
          phoneLinked: asst.phoneLinked || '',
          verificationCode: asst.verificationCode || '',
          numberReady: asst.numberReady || false,
          monthlyMessageLimit: asst.monthlyMessageLimit || 0,
          messageCount: asst.messageCount || 0,
          tools: asst.tools || {},
          timezone: asst.timezone,
        })),
        databases: (profile.databases || []).map(db => ({
          ...db,
          selectedColumns: db.selectedColumns || [],
          relevantColumnsDescription: db.relevantColumnsDescription || '',
        })),
        ownerPhoneNumberForNotifications: profile.ownerPhoneNumberForNotifications,
        credits: profile.credits || 0,
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
  try {
    const { userProfile } = await request.json();

    if (!userProfile || !userProfile.email || !userProfile.firebaseUid) {
      return NextResponse.json({ message: 'User profile with email and firebaseUid is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

    const existingUser = await userCollection.findOne({ email: userProfile.email });
    if (existingUser) {
        return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 }); // 409 Conflict
    }

    // Prepare a clean, serializable profile for MongoDB
    const finalProfile: Omit<UserProfile, 'isAuthenticated' | '_id'> = {
      email: userProfile.email,
      firebaseUid: userProfile.firebaseUid,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      address: userProfile.address,
      authProvider: 'google',
      ownerPhoneNumberForNotifications: userProfile.ownerPhoneNumberForNotifications,
      credits: userProfile.credits || 0,
      assistants: (userProfile.assistants || []).map((asst: AssistantConfig) => ({
        ...asst,
        isActive: asst.isActive || false,
        purposes: Array.isArray(asst.purposes) ? asst.purposes : [],
        imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
        businessInfo: asst.businessInfo || {},
        phoneLinked: asst.phoneLinked || '',
        verificationCode: asst.verificationCode || '',
        numberReady: asst.numberReady || false,
        monthlyMessageLimit: asst.monthlyMessageLimit || 0,
        messageCount: asst.messageCount || 0,
        tools: asst.tools || {},
        timezone: asst.timezone,
      })),
      databases: (userProfile.databases || []).map((db: any) => ({
        ...db,
        selectedColumns: db.selectedColumns || [],
        relevantColumnsDescription: db.relevantColumnsDescription || '',
      })),
    };
    
    try {
      const result = await userCollection.insertOne(finalProfile as UserProfile);

      return NextResponse.json({ 
          message: "User profile created successfully.", 
          userId: result.insertedId.toString(),
      });

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

export async function PUT(request: NextRequest) {
  try {
    const { userProfile } = await request.json();
    const userId = userProfile._id;

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

    // Create a copy of the profile and remove fields that should not be updated directly
    const { _id, isAuthenticated, ...updateData } = userProfile;
    
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
