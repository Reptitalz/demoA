// src/app/api/assistants/link-database/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, DatabaseConfig } from '@/types';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const { assistantId, sheetUrl, userId } = await request.json();

  if (!assistantId || !sheetUrl || !userId) {
    return NextResponse.json({ message: 'Se requieren assistantId, sheetUrl y userId' }, { status: 400 });
  }
  if (!sheetUrl.startsWith('https://docs.google.com/spreadsheets/d/')) {
    return NextResponse.json({ message: 'URL de Hoja de Google inválida.' }, { status: 400 });
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
    
    const assistant = user.assistants.find(a => a.id === assistantId);
    if (!assistant) {
        return NextResponse.json({ message: 'Asistente no encontrado.' }, { status: 404 });
    }

    // Create a new database config
    const newDb: DatabaseConfig = {
      id: `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `Datos de ${assistant.name}`,
      source: 'google_sheets',
      accessUrl: sheetUrl,
    };
    
    // Add the new database and link it to the assistant
    const result = await userProfileCollection.updateOne(
      { _id: new ObjectId(userId), "assistants.id": assistantId },
      { 
        $push: { databases: newDb },
        $set: { "assistants.$.databaseId": newDb.id }
      }
    );

    if (result.modifiedCount === 0) {
        throw new Error('No se pudo vincular la base de datos al asistente.');
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Base de datos vinculada correctamente.',
        newDatabase: newDb,
        updatedAssistantId: assistantId,
    });

  } catch (error) {
    console.error('API Error (link-database):', error);
    let errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
