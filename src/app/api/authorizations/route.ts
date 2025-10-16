
// src/app/api/authorizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile, Authorization } from '@/types';
import { ObjectId } from 'mongodb';

const PROFILES_COLLECTION = 'userProfiles';

// POST a new pending authorization to an assistant
export async function POST(request: NextRequest) {
    const { assistantId, authorization } = await request.json();

    if (!assistantId || !authorization) {
        return NextResponse.json({ message: 'Faltan el ID del asistente y los datos de autorización.' }, { status: 400 });
    }

    try {
        const { db } = await connectToDatabase();
        const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);
        
        const newAuth: Authorization = {
            ...authorization,
            id: `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            status: 'pending',
            receivedAt: new Date().toISOString(),
        };

        const result = await userProfileCollection.updateOne(
            { "assistants.id": assistantId },
            { $push: { "assistants.$.authorizations": newAuth } }
        );

        if (result.modifiedCount > 0) {
            return NextResponse.json({ success: true, message: 'Autorización pendiente guardada.', authorization: newAuth });
        } else {
            return NextResponse.json({ success: false, message: 'No se encontró el asistente o no se pudo guardar la autorización.' }, { status: 404 });
        }

    } catch (error) {
        console.error('API Error (POST /api/authorizations):', error);
        return NextResponse.json({ message: 'Error al guardar la autorización pendiente.' }, { status: 500 });
    }
}

// PUT to update an authorization's status (approve/reject)
export async function PUT(request: NextRequest) {
    const { assistantId, authorizationId, status, amount } = await request.json();

    if (!assistantId || !authorizationId || !status) {
        return NextResponse.json({ message: 'Faltan campos requeridos.' }, { status: 400 });
    }

    if (status === 'completed' && (typeof amount !== 'number' || amount <= 0)) {
        return NextResponse.json({ message: 'Se requiere un monto válido para aprobar la autorización.' }, { status: 400 });
    }

    try {
        const { db } = await connectToDatabase();
        const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

        const updateFields: any = {
            'assistants.$.authorizations.$[auth].status': status,
        };

        if (status === 'completed') {
            updateFields['assistants.$.authorizations.$[auth].amount'] = amount;
        }

        const result = await userProfileCollection.updateOne(
            { "assistants.id": assistantId },
            { $set: updateFields },
            { arrayFilters: [{ "auth.id": authorizationId }] }
        );
        
        if (result.modifiedCount === 0) {
            return NextResponse.json({ message: 'No se encontró la autorización o no se realizaron cambios.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'El estado de la autorización ha sido actualizado.' });

    } catch (error) {
        console.error('API Error (PUT /api/authorizations):', error);
        return NextResponse.json({ message: 'Error al actualizar la autorización.' }, { status: 500 });
    }
}
