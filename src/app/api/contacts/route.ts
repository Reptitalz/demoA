
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
            // Calculate the size of the whole document as a measure of conversation "weight"
            $addFields: {
                conversationSize: { $bsonSize: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: { $toString: "$_id" },
                destination: "$userIdentifier",
                name: "$userIdentifier", // Initially, name is the same as the identifier
                conversationSize: 1,
                // Extract all multimedia files from history
                files: {
                    $filter: {
                        input: "$history",
                        as: "msg",
                        cond: { 
                            $and: [
                                { $eq: ["$$msg.role", "user"] },
                                { $ne: [{ $type: "$$msg.content" }, "string"] }, // Content is an object for files
                                { $in: ["$$msg.content.type", ["image", "video", "audio", "document"]] }
                            ]
                        }
                    }
                }
            }
        },
        {
            // Reshape the files array to match the ContactImage type, now more generic
            $project: {
                 _id: 1,
                 destination: 1,
                 name: 1,
                 conversationSize: 1,
                 images: { // Keep the name 'images' for compatibility with the frontend type
                     $map: {
                         input: "$files",
                         as: "fileMsg",
                         in: {
                             _id: { $toString: { $ifNull: ["$$fileMsg.id", new ObjectId()] } }, // Use message ID or generate one
                             url: "$$fileMsg.content.url",
                             type: "$$fileMsg.content.type",
                             name: "$$fileMsg.content.name",
                             receivedAt: { $ifNull: ["$$fileMsg.time", "$createdAt"] },
                             read: { $ifNull: ["$$fileMsg.read", false] }
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

