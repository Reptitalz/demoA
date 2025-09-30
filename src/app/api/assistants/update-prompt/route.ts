// src/app/api/assistants/update-prompt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const { assistantId, prompt, userId } = await request.json();

  if (!assistantId || !prompt || !userId) {
    return NextResponse.json({ message: 'Se requieren assistantId, prompt y userId' }, { status: 400 });
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
    
    // Update the prompt for the specific assistant
    const result = await userProfileCollection.updateOne(
      { _id: new ObjectId(userId), "assistants.id": assistantId },
      { 
        $set: { "assistants.$.prompt": prompt }
      }
    );

    if (result.modifiedCount === 0) {
        // This could mean the prompt was the same, so we don't throw an error,
        // but we can log it.
        console.log(`Prompt for assistant ${assistantId} was not modified.`);
    }
    
    // Find the updated assistant to return it
    const updatedUser = await userProfileCollection.findOne({ _id: new ObjectId(userId) });
    const updatedAssistant = updatedUser?.assistants.find(a => a.id === assistantId);

    return NextResponse.json({ 
        success: true, 
        message: 'Prompt del asistente actualizado correctamente.',
        updatedAssistant: updatedAssistant,
    });

  } catch (error) {
    console.error('API Error (update-prompt):', error);
    let errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
