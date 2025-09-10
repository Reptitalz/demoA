// src/app/api/assistants/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Conversation, UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

const CONVERSATIONS_COLLECTION = 'conversations';
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

    // 2. Fetch conversations from the 'conversations' collection
    const conversations = await db.collection<Conversation>(CONVERSATIONS_COLLECTION).aggregate([
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
                _id: 1,
                userIdentifier: 1,
                assistantId: 1,
                createdAt: 1,
                updatedAt: 1,
                // Get the last message from the history array
                lastMessage: { $arrayElemAt: [ "$history.content", -1 ] } 
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
        
        // 1. Find the conversation
        const conversation = await db.collection<Conversation>(CONVERSATIONS_COLLECTION).findOne({
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

        // 3. Return the full conversation object
        return NextResponse.json(conversation);

    } catch (error) {
        console.error('API Error (POST /api/assistants/conversations):', error);
        return NextResponse.json({ message: 'Error al obtener la conversación' }, { status: 500 });
    }
}
