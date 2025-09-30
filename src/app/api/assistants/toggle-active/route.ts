// src/app/api/assistants/toggle-active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const { assistantId, userId } = await request.json();

  if (!assistantId || !userId) {
    return NextResponse.json({ message: 'Se requieren assistantId y userId' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    // Find the user who owns this assistant
    const user = await userProfileCollection.findOne({ 
      _id: new ObjectId(userId),
      "assistants.id": assistantId 
    });

    if (!user) {
      return NextResponse.json({ message: 'Asistente no encontrado o no autorizado' }, { status: 404 });
    }
    
    const assistantIndex = user.assistants.findIndex(a => a.id === assistantId);
    if (assistantIndex === -1) {
        return NextResponse.json({ message: 'Asistente no encontrado en el perfil.' }, { status: 404 });
    }
    
    const currentStatus = user.assistants[assistantIndex].isActive;
    const newStatus = !currentStatus;

    // Update the isActive status for the specific assistant
    const result = await userProfileCollection.updateOne(
      { _id: new ObjectId(userId), "assistants.id": assistantId },
      { 
        $set: { [`assistants.${assistantIndex}.isActive`]: newStatus }
      }
    );

    if (result.modifiedCount === 0) {
        console.log(`isActive status for assistant ${assistantId} was not modified.`);
    }
    
    // Fetch the updated assistant to return it
    const updatedUser = await userProfileCollection.findOne({ _id: new ObjectId(userId) });
    const updatedAssistant = updatedUser?.assistants.find(a => a.id === assistantId);

    return NextResponse.json({ 
        success: true, 
        message: `Asistente ${newStatus ? 'activado' : 'desactivado'} correctamente.`,
        updatedAssistant: updatedAssistant,
    });

  } catch (error) {
    console.error('API Error (toggle-active):', error);
    let errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
