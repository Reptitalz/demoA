// src/app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile, ContactImage } from '@/types';
import { ObjectId } from 'mongodb';

const PROFILES_COLLECTION = 'userProfiles';
const AGENT_MEMORY_COLLECTION = 'agent_memory';

// GET all contacts for a specific assistant
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assistantId = searchParams.get('assistantId');
  const userId = searchParams.get('userId');

  if (!assistantId || !userId) {
    return NextResponse.json({ message: 'Se requieren el ID del asistente y del usuario' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // 1. Validate that the user owns this assistant
    const userProfile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({
        _id: new ObjectId(userId),
        'assistants.id': assistantId
    });
    
    if (!userProfile) {
        return NextResponse.json({ message: 'Acceso no autorizado o el asistente no existe' }, { status: 403 });
    }

    const assistant = userProfile.assistants.find(a => a.id === assistantId);
    if (!assistant) {
        return NextResponse.json({ message: 'Configuración del asistente no encontrada' }, { status: 404 });
    }

    // 2. Fetch contacts from agent_memory collection
    const contacts = await db.collection(AGENT_MEMORY_COLLECTION).aggregate([
        {
            $match: {
                assistantId: assistantId
            }
        },
        {
            $unwind: "$history" // Deconstruct the history array
        },
        {
            // Group by destination to aggregate data per contact
            $group: {
                _id: "$userIdentifier",
                // Sum the size of all messages in the conversation
                conversationSize: { $sum: { $bsonSize: "$history" } },
                 // Collect all images from the messages
                images: {
                    $push: {
                        $cond: [
                             {
                                $and: [
                                    { $eq: ["$history.role", "user"] }, // Only user messages can contain images to moderate
                                    { $eq: [{ $type: "$history.content" }, "object"] },
                                    { $eq: ["$history.content.type", "image"] }
                                ]
                            },
                            {
                                // Using the history's own sub-document ID if available, otherwise a new one
                                _id: { $toString: { $ifNull: ["$history._id", new ObjectId()] } },
                                url: "$history.content.url",
                                receivedAt: "$createdAt", // Using the conversation's creation date for now
                                read: { $ifNull: ["$history.read", false] } // Default to false
                            },
                            "$$REMOVE"
                        ]
                    }
                }
            }
        },
        {
            // Reshape the output
            $project: {
                _id: { $toString: "$_id" },
                destination: "$_id",
                name: "$_id", // Initially, name is the same as the identifier
                conversationSize: 1,
                images: 1
            }
        },
        {
            $sort: {
                conversationSize: -1 // Sort by largest conversation size first
            }
        }
    ]).toArray();
    

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('API Error (GET /api/contacts):', error);
    return NextResponse.json({ message: 'Error al obtener los contactos' }, { status: 500 });
  }
}
