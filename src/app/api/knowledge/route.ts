
// src/app/api/knowledge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { KnowledgeItem, DatabaseConfig } from '@/types';
import { ObjectId } from 'mongodb';

const KNOWLEDGE_COLLECTION = 'knowledgeItems';
const PROFILES_COLLECTION = 'userProfiles';
const MAX_STORAGE_BYTES = 50 * 1024 * 1024; // 50MB

// GET all knowledge items for a specific database
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const databaseId = searchParams.get('databaseId');
  const userId = searchParams.get('userId'); // For validation

  if (!databaseId || !userId) {
    return NextResponse.json({ message: 'Se requieren el ID de la base de datos y del usuario' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    // Validate that the user actually owns this database
    const user = await db.collection(PROFILES_COLLECTION).findOne({
        _id: new ObjectId(userId),
        'databases.id': databaseId
    });
    
    if (!user) {
        return NextResponse.json({ message: 'Acceso no autorizado o la base de datos no existe' }, { status: 403 });
    }

    const items = await db.collection<KnowledgeItem>(KNOWLEDGE_COLLECTION).find({ databaseId }).toArray();
    return NextResponse.json(items);
  } catch (error) {
    console.error('API Error (GET /api/knowledge):', error);
    return NextResponse.json({ message: 'Error al obtener los elementos de conocimiento' }, { status: 500 });
  }
}

// POST a new knowledge item to a database
export async function POST(request: NextRequest) {
  const { databaseId, content, userId } = await request.json();

  if (!databaseId || !content || !userId) {
    return NextResponse.json({ message: 'Se requieren databaseId, content y userId' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const profilesCollection = db.collection(PROFILES_COLLECTION);

    // 1. Validate that the user owns the database
    const userProfile = await profilesCollection.findOne({ 
        _id: new ObjectId(userId), 
        'databases.id': databaseId 
    });

    if (!userProfile) {
      return NextResponse.json({ message: 'Acceso no autorizado o la base de datos no existe' }, { status: 403 });
    }
    
    const dbConfig = userProfile.databases.find((db: DatabaseConfig) => db.id === databaseId);
    if (!dbConfig) {
         return NextResponse.json({ message: 'Configuración de base de datos no encontrada' }, { status: 404 });
    }
    
    // 2. Calculate size and check storage limit
    const newItemSize = new TextEncoder().encode(content).length;
    const currentSize = dbConfig.storageSize || 0;

    if (currentSize + newItemSize > MAX_STORAGE_BYTES) {
        return NextResponse.json({ message: `No se puede añadir el elemento. Se excedería el límite de almacenamiento de ${MAX_STORAGE_BYTES / 1024 / 1024} MB.` }, { status: 413 });
    }

    // 3. Create the new knowledge item
    const newItem: Omit<KnowledgeItem, '_id'> = {
      databaseId,
      userId,
      content,
      size: newItemSize,
      createdAt: new Date(),
    };

    const knowledgeCollection = db.collection<KnowledgeItem>(KNOWLEDGE_COLLECTION);
    const insertResult = await knowledgeCollection.insertOne(newItem as KnowledgeItem);

    // 4. Update the storageSize in the user's profile
    await profilesCollection.updateOne(
      { _id: new ObjectId(userId), 'databases.id': databaseId },
      { $inc: { 'databases.$.storageSize': newItemSize } }
    );
    
    const createdItem = {
      _id: insertResult.insertedId,
      ...newItem
    }

    return NextResponse.json(createdItem, { status: 201 });
  } catch (error) {
    console.error('API Error (POST /api/knowledge):', error);
    return NextResponse.json({ message: 'Error al añadir el elemento de conocimiento' }, { status: 500 });
  }
}

// DELETE a knowledge item
export async function DELETE(request: NextRequest) {
  const { itemId, userId } = await request.json();

  if (!itemId || !userId) {
    return NextResponse.json({ message: 'Se requieren itemId y userId' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const knowledgeCollection = db.collection<KnowledgeItem>(KNOWLEDGE_COLLECTION);

    // 1. Find the item to be deleted to get its size and databaseId
    const itemToDelete = await knowledgeCollection.findOne({ _id: new ObjectId(itemId), userId });
    
    if (!itemToDelete) {
        return NextResponse.json({ message: 'Elemento de conocimiento no encontrado o no tienes permiso para eliminarlo' }, { status: 404 });
    }

    // 2. Delete the item
    await knowledgeCollection.deleteOne({ _id: new ObjectId(itemId) });

    // 3. Decrement the storageSize in the user's profile
    const profilesCollection = db.collection(PROFILES_COLLECTION);
    await profilesCollection.updateOne(
      { _id: new ObjectId(userId), 'databases.id': itemToDelete.databaseId },
      { $inc: { 'databases.$.storageSize': -itemToDelete.size } }
    );

    return NextResponse.json({ message: 'Elemento eliminado correctamente' }, { status: 200 });
  } catch (error) {
    console.error('API Error (DELETE /api/knowledge):', error);
    return NextResponse.json({ message: 'Error al eliminar el elemento de conocimiento' }, { status: 500 });
  }
}
