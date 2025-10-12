
// src/app/api/credit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, CreditLine } from '@/types';
import { ObjectId } from 'mongodb';

const PROFILES_COLLECTION = 'userProfiles';

// POST a new credit line application
export async function POST(request: NextRequest) {
  try {
    const { ownerId, assistantId, applicantIdentifier, documents, paymentFrequency } = await request.json();

    if (!ownerId || !assistantId || !applicantIdentifier || !documents || !paymentFrequency) {
      return NextResponse.json({ message: 'Faltan campos requeridos.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);
    
    // Verify owner exists
    const owner = await userProfileCollection.findOne({ _id: new ObjectId(ownerId) });
    if (!owner) {
        return NextResponse.json({ message: 'Propietario no encontrado.' }, { status: 404 });
    }

    const newCreditLine: CreditLine = {
      id: `cl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      amount: 0, // Amount will be set on approval
      status: 'pending',
      applicantIdentifier,
      assistantId,
      documents,
      paymentFrequency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await userProfileCollection.updateOne(
      { _id: new ObjectId(ownerId) },
      { $push: { creditLines: newCreditLine } }
    );
    
    if (result.modifiedCount === 0) {
        throw new Error('No se pudo guardar la solicitud de crédito.');
    }

    return NextResponse.json({ success: true, message: 'Solicitud de crédito enviada.', creditLine: newCreditLine }, { status: 201 });

  } catch (error) {
    console.error('API Error (POST /api/credit):', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}


// PUT to update a credit line (approve/reject)
export async function PUT(request: NextRequest) {
    try {
        const { ownerId, creditLineId, status, amount } = await request.json();
        
        if (!ownerId || !creditLineId || !status) {
            return NextResponse.json({ message: 'Faltan campos requeridos.' }, { status: 400 });
        }
        
        if (status === 'approved' && (typeof amount !== 'number' || amount <= 0)) {
            return NextResponse.json({ message: 'Se requiere un monto válido para aprobar el crédito.' }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

        const updateFields: any = {
            'creditLines.$.status': status,
            'creditLines.$.updatedAt': new Date().toISOString(),
        };

        if (status === 'approved') {
            updateFields['creditLines.$.amount'] = amount;
            // When approved, set a more descriptive active status
            updateFields['creditLines.$.status'] = 'Al Corriente'; 
        }

        const result = await userProfileCollection.updateOne(
            { _id: new ObjectId(ownerId), 'creditLines.id': creditLineId },
            { $set: updateFields }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ message: 'No se encontró la solicitud de crédito o no se realizaron cambios.' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: 'El estado de la solicitud de crédito ha sido actualizado.' });

    } catch (error) {
        console.error('API Error (PUT /api/credit):', error);
        const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
