import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import bcrypt from 'bcrypt';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const PROFILES_COLLECTION = 'userProfiles';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, password } = await request.json();

    if (!phoneNumber || !password) {
      return NextResponse.json({ message: 'Phone number and password are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

    const user = await userProfileCollection.findOne({ phoneNumber: phoneNumber });

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado o credenciales incorrectas.' }, { status: 404 });
    }
    
    if (!user.password) {
        return NextResponse.json({ message: 'Usuario no encontrado o credenciales incorrectas.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ message: 'Usuario no encontrado o credenciales incorrectas.' }, { status: 401 });
    }
    
    // Create Firebase user if one doesn't exist
    const adminAuth = getFirebaseAdmin().auth();
    let firebaseUid = user.firebaseUid;
    
    if (!firebaseUid) {
      try {
        const firebaseUser = await adminAuth.createUser({
          phoneNumber: phoneNumber,
          disabled: false,
        });
        firebaseUid = firebaseUser.uid;
        await userProfileCollection.updateOne(
          { _id: user._id },
          { $set: { firebaseUid: firebaseUid } }
        );
        user.firebaseUid = firebaseUid;
      } catch (error: any) {
        // If user already exists in Firebase Auth, get the user and update the profile
        if (error.code === 'auth/phone-number-already-exists') {
          const firebaseUser = await adminAuth.getUserByPhoneNumber(phoneNumber);
          firebaseUid = firebaseUser.uid;
           if (user.firebaseUid !== firebaseUid) {
             await userProfileCollection.updateOne(
              { _id: user._id },
              { $set: { firebaseUid: firebaseUid } }
            );
            user.firebaseUid = firebaseUid;
           }
        } else {
          console.error('Error creating/updating Firebase user:', error);
          return NextResponse.json({ message: 'Error de autenticación interna.' }, { status: 500 });
        }
      }
    }

    const { password: _, ...userProfileWithoutPassword } = user;
    const profileToSend = { ...userProfileWithoutPassword, isAuthenticated: true, firebaseUid: firebaseUid };


    return NextResponse.json({ 
        message: 'Login successful', 
        userProfile: profileToSend
    });

  } catch (error) {
    console.error('API Error (auth/login):', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
