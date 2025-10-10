// src/app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile, Contact } from '@/types';
import { ObjectId } from 'mongodb';

const PROFILES_COLLECTION = 'userProfiles';

// GET all contacts for the logged-in user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ message: 'Se requiere un ID de usuario válido' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    const userProfile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne(
        { _id: new ObjectId(userId) },
        { projection: { contacts: 1 } } // Only fetch the contacts array
    );
    
    if (!userProfile) {
        return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(userProfile.contacts || []);

  } catch (error) {
    console.error('API Error (GET /api/contacts):', error);
    return NextResponse.json({ message: 'Error al obtener los contactos' }, { status: 500 });
  }
}

// POST a new contact to the user's profile
export async function POST(request: NextRequest) {
    const { userId, newContact } = await request.json();

    if (!userId || !ObjectId.isValid(userId) || !newContact || !newContact.chatPath) {
        return NextResponse.json({ message: 'Se requieren el ID de usuario y los datos del nuevo contacto.' }, { status: 400 });
    }

    try {
        const { db } = await connectToDatabase();
        const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);
        
        // Use $addToSet to prevent duplicate contacts based on chatPath
        const result = await userProfileCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { contacts: newContact } }
        );

        if (result.modifiedCount > 0) {
             return NextResponse.json({ success: true, message: 'Contacto añadido exitosamente.', contact: newContact });
        } else {
             // It might not have been modified because the contact already exists.
             // We can check if the contact is in the user's list.
             const user = await userProfileCollection.findOne({ _id: new ObjectId(userId), "contacts.chatPath": newContact.chatPath });
             if (user) {
                return NextResponse.json({ success: false, message: 'El contacto ya existe.' });
             }
             return NextResponse.json({ success: false, message: 'No se pudo añadir el contacto.' }, { status: 500 });
        }

    } catch (error) {
        console.error('API Error (POST /api/contacts):', error);
        return NextResponse.json({ message: 'Error al añadir el contacto.' }, { status: 500 });
    }
}

// DELETE a contact from the user's profile
export async function DELETE(request: NextRequest) {
    const { userId, chatPath } = await request.json();

    if (!userId || !ObjectId.isValid(userId) || !chatPath) {
        return NextResponse.json({ message: 'Se requieren el ID de usuario y el chatPath del contacto a eliminar.' }, { status: 400 });
    }

    try {
        const { db } = await connectToDatabase();
        const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

        const result = await userProfileCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { contacts: { chatPath: chatPath } } }
        );

        if (result.modifiedCount > 0) {
            return NextResponse.json({ success: true, message: 'Contacto eliminado exitosamente.' });
        } else {
            return NextResponse.json({ success: false, message: 'No se encontró el contacto para eliminar.' }, { status: 404 });
        }

    } catch (error) {
        console.error('API Error (DELETE /api/contacts):', error);
        return NextResponse.json({ message: 'Error al eliminar el contacto.' }, { status: 500 });
    }
}
