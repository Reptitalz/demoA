
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

    // 2. Fetch contacts from agent_memory collection
    const contacts = await db.collection(AGENT_MEMORY_COLLECTION).aggregate([
        {
            $match: {
                assistantId: assistantId
            }
        },
        {
            $addFields: {
                conversationSize: { $bsonSize: "$$ROOT" } // Calculate size of the whole document
            }
        },
        {
            $project: {
                _id: { $toString: "$_id" },
                destination: "$userIdentifier",
                name: "$userIdentifier", // Initially, name is the same as the identifier
                conversationSize: 1,
                // Extract images from history
                images: {
                    $filter: {
                        input: "$history",
                        as: "msg",
                        cond: { 
                            $and: [
                                { $eq: ["$$msg.role", "user"] },
                                { $eq: [{ $type: "$$msg.content" }, "object"] },
                                { $eq: ["$$msg.content.type", "image"] }
                            ]
                        }
                    }
                }
            }
        },
        {
            // Reshape the images array
            $project: {
                 _id: 1,
                 destination: 1,
                 name: 1,
                 conversationSize: 1,
                 images: {
                     $map: {
                         input: "$images",
                         as: "imgMsg",
                         in: {
                             _id: { $toString: { $ifNull: ["$$imgMsg._id", new ObjectId()] } },
                             url: "$$imgMsg.content.url",
                             receivedAt: { $ifNull: ["$$imgMsg.time", "$createdAt"] },
                             read: { $ifNull: ["$$imgMsg.read", false] }
                         }
                     }
                 }
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

