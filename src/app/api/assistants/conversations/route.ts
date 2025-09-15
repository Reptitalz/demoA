// src/app/api/assistants/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Conversation, UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

// CORRECTED: Use the agent_memory collection as the source of truth for conversations
const AGENT_MEMORY_COLLECTION = 'agent_memory';
const PROFILES_COLLECTION = 'userProfiles';

// GET all conversation summaries for a specific assistant
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

    // 2. Fetch conversation summaries from the 'agent_memory' collection
    const conversations = await db.collection<Conversation>(AGENT_MEMORY_COLLECTION).aggregate([
        {
            $match: {
                assistantId: assistantId
            }
        },
        {
            $sort: {
                updatedAt: -1 // Sort by most recently updated
            }
        },
        {
            $project: {
                _id: { $toString: "$_id" }, // Ensure _id is a string
                userIdentifier: 1,
                assistantId: 1,
                createdAt: 1,
                updatedAt: 1,
                // Get the last message from the history array. Since history is an array of objects, we need to access the content.
                lastMessage: { $let: {
                    vars: { last: { $arrayElemAt: [ "$history", -1 ] } },
                    in: "$$last.content"
                }}
            }
        }
    ]).toArray();
    
    return NextResponse.json(conversations);

  } catch (error) {
    console.error('API Error (GET /api/assistants/conversations):', error);
    return NextResponse.json({ message: 'Error al obtener las conversaciones' }, { status: 500 });
  }
}

// POST to get a single full conversation
export async function POST(request: NextRequest) {
    const { conversationId, userId } = await request.json();

    if (!conversationId || !userId) {
        return NextResponse.json({ message: 'Se requieren el ID de la conversación y del usuario' }, { status: 400 });
    }
    
    try {
        const { db } = await connectToDatabase();
        
        // 1. Find the conversation in the agent_memory collection
        const conversation = await db.collection<Conversation>(AGENT_MEMORY_COLLECTION).findOne({
            _id: new ObjectId(conversationId)
        });

        if (!conversation) {
            return NextResponse.json({ message: 'Conversación no encontrada' }, { status: 404 });
        }

        // 2. Validate that the user owns the assistant tied to this conversation
        const userProfile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({
            _id: new ObjectId(userId),
            'assistants.id': conversation.assistantId
        });

        if (!userProfile) {
            return NextResponse.json({ message: 'Acceso no autorizado' }, { status: 403 });
        }
        
        // Convert _id to string for JSON compatibility
        const conversationWithStrId = {
            ...conversation,
            _id: conversation._id.toString(),
        };

        // 3. Return the full conversation object
        return NextResponse.json(conversationWithStrId);

    } catch (error) {
        console.error('API Error (POST /api/assistants/conversations):', error);
        return NextResponse.json({ message: 'Error al obtener la conversación' }, { status: 500 });
    }
}
