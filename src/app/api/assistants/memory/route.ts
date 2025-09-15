// src/app/api/assistants/memory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

const PROFILES_COLLECTION = 'userProfiles';
const AGENT_MEMORY_COLLECTION = 'agent_memory';

// GET memory usage for all assistants of a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'Se requiere el ID del usuario' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // 1. Validate the user exists
    const userProfile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({
        _id: new ObjectId(userId),
    });
    
    if (!userProfile) {
        return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    const assistantIds = userProfile.assistants.map(a => a.id);
    if (assistantIds.length === 0) {
        return NextResponse.json([]); // Return empty array if no assistants
    }

    // 2. Fetch memory usage from agent_memory collection for all assistants of the user
    const memoryUsage = await db.collection(AGENT_MEMORY_COLLECTION).aggregate([
        {
            $match: {
                assistantId: { $in: assistantIds }
            }
        },
        {
            // Calculate the size of the entire document for each conversation
            $addFields: {
                docSize: { $bsonSize: "$$ROOT" }
            }
        },
        {
            $group: {
                _id: "$assistantId",
                totalMemory: { $sum: "$docSize" } // Sum the sizes of all documents for that assistant
            }
        },
        {
            $project: {
                _id: 0,
                assistantId: "$_id",
                totalMemory: 1
            }
        }
    ]).toArray();
    
    return NextResponse.json(memoryUsage);
  } catch (error) {
    console.error('API Error (GET /api/assistants/memory):', error);
    return NextResponse.json({ message: 'Error al obtener el uso de memoria' }, { status: 500 });
  }
}
