
import type { UserProfile } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const PROFILES_COLLECTION = 'userProfiles';
const SALT_ROUNDS = 10;

// This function will now be called by the verification webhook service to store the code in the DB.
export async function storeVerificationCode(phoneNumber: string, code: string): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>(PROFILES_COLLECTION);
    
    // Temporarily store the verification code on a document identified by the phone number.
    // We can use a temporary user document for this.
    await userCollection.updateOne(
      { phoneNumber: phoneNumber },
      { 
        $set: { verificationCode: code, verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000) }, // 15 min expiry
        $setOnInsert: { phoneNumber: phoneNumber } // Create if it doesn't exist
      },
      { upsert: true }
    );
    console.log(`Stored verification code for phone number ${phoneNumber} in DB.`);
  } catch (error) {
    console.error('Failed to store verification code in DB:', error);
    // Even if DB fails, don't block the webhook from sending. The user can try again.
  }
}

// GET now uses phone number instead of firebaseUid
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phoneNumber = searchParams.get('phoneNumber');

  if (!phoneNumber) {
    return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const profile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({ phoneNumber: phoneNumber, password: { $exists: true } }); // Ensure it's a complete profile

    if (profile) {
      // Ensure the returned profile conforms to the latest UserProfile structure
      const profileSafe: Omit<UserProfile, 'password'> & { isAuthenticated: boolean } = {
        _id: profile._id,
        isAuthenticated: true,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        address: profile.address,
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
    const { userProfile, verificationCode } = await request.json();

    if (!userProfile || !userProfile.phoneNumber || !userProfile.password || !verificationCode) {
      return NextResponse.json({ message: 'Se requieren todos los datos del perfil y el código de verificación.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

    // *** Verification Step ***
    const tempUser = await userCollection.findOne({ phoneNumber: userProfile.phoneNumber });

    if (!tempUser || !tempUser.verificationCode || tempUser.verificationCode !== verificationCode) {
        return NextResponse.json({ message: 'El código de verificación es incorrecto.' }, { status: 400 });
    }
    
    // Optional: Check expiry if you want to keep it. For now, removing it as requested.
    // if (!tempUser.verificationCodeExpiry || new Date() > new Date(tempUser.verificationCodeExpiry)) {
    //   return NextResponse.json({ message: 'El código de verificación ha expirado.' }, { status: 400 });
    // }

    // Check if a user with this phone number and a password already exists
    const existingUser = await userCollection.findOne({ phoneNumber: userProfile.phoneNumber, password: { $exists: true } });
    if (existingUser) {
        return NextResponse.json({ message: "El número de teléfono ya está registrado." }, { status: 409 }); // 409 Conflict
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userProfile.password, SALT_ROUNDS);

    // Prepare a clean, serializable profile for MongoDB
    const finalProfile: Omit<UserProfile, 'isAuthenticated'> = {
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      address: userProfile.address,
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
      // Update the temporary user document with the full profile info, and remove verification fields.
      const result = await userCollection.updateOne(
        { phoneNumber: userProfile.phoneNumber },
        {
          $set: finalProfile,
          $unset: { verificationCode: "", verificationCodeExpiry: "" }
        }
      );

      return NextResponse.json({ 
          message: "User profile created successfully.", 
          userId: tempUser._id?.toString() ?? 'unknown',
          insertedId: tempUser._id,
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
