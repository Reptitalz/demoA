
import type { UserProfile } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import bcrypt from 'bcrypt';

const PROFILES_COLLECTION = 'userProfiles';
const SALT_ROUNDS = 10;

// GET now uses phone number instead of firebaseUid
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phoneNumber = searchParams.get('phoneNumber');

  if (!phoneNumber) {
    return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const profile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({ phoneNumber: phoneNumber });

    if (profile) {
      // Ensure the returned profile conforms to the latest UserProfile structure
      const profileSafe: Omit<UserProfile, 'password'> & { isAuthenticated: boolean } = {
        isAuthenticated: true,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        assistants: (profile.assistants || []).map(asst => ({
          ...asst,
          purposes: Array.isArray(asst.purposes) ? asst.purposes : [],
          imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
          businessInfo: asst.businessInfo || {},
        })),
        databases: profile.databases || [],
        ownerPhoneNumberForNotifications: profile.ownerPhoneNumberForNotifications,
        credits: profile.credits || 0,
        firebaseUid: profile.firebaseUid,
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

    if (!userProfile || !userProfile.phoneNumber || !userProfile.password) {
      return NextResponse.json({ message: 'UserProfile with phoneNumber and password is required' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

    // Check if a user with this phone number already exists
    const existingUser = await userCollection.findOne({ phoneNumber: userProfile.phoneNumber });
    if (existingUser) {
        return NextResponse.json({ message: "El número de teléfono ya está registrado." }, { status: 409 }); // 409 Conflict
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userProfile.password, SALT_ROUNDS);

    // Prepare a clean, serializable profile for MongoDB
    const serializableProfile: Omit<UserProfile, 'isAuthenticated'> = {
      email: userProfile.email,
      phoneNumber: userProfile.phoneNumber,
      password: hashedPassword, // Store the hashed password
      ownerPhoneNumberForNotifications: userProfile.ownerPhoneNumberForNotifications,
      credits: userProfile.credits || 0,
      assistants: (userProfile.assistants || []).map((asst: any) => ({
        ...asst,
        purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || []),
        imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
        businessInfo: asst.businessInfo || {},
      })),
      databases: userProfile.databases || [],
    };
    
    try {
      // Insert the new user profile
      const result = await userCollection.insertOne(serializableProfile as UserProfile);

      return NextResponse.json({ 
          message: "User profile created successfully.", 
          userId: result.insertedId.toString(),
          insertedId: result.insertedId 
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
