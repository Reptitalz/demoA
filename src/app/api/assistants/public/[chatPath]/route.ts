// src/app/api/assistants/public/[chatPath]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';

// This endpoint now finds an assistant by its public chatPath.
export async function GET(
    request: NextRequest,
    { params }: { params: { chatPath: string } }
) {
    const { chatPath } = params;

    if (!chatPath) {
        return NextResponse.json({ message: 'Se requiere el chatPath del asistente.' }, { status: 400 });
    }
  
    try {
        const { db } = await connectToDatabase();
        const userProfileCollection = db.collection<UserProfile>('userProfiles');

        // Find the user profile that contains the assistant with the matching chatPath
        const userProfile = await userProfileCollection.findOne({
            "assistants.chatPath": `/chat/${chatPath}`
        });

        if (!userProfile) {
            return NextResponse.json({ message: 'Asistente no encontrado.' }, { status: 404 });
        }

        // Find the specific assistant within the user's profile
        const assistant = userProfile.assistants.find(a => a.chatPath === `/chat/${chatPath}`);

        if (!assistant) {
            return NextResponse.json({ message: 'Asistente no encontrado.' }, { status: 404 });
        }
        
        if (!assistant.isActive || assistant.type !== 'desktop') {
             return NextResponse.json({ message: 'Este asistente no está activo o no es un asistente de escritorio.' }, { status: 403 });
        }

        // Return a public-safe version of the assistant object
        const publicAssistant = {
            id: assistant.id,
            name: assistant.name,
            imageUrl: assistant.imageUrl,
            chatPath: assistant.chatPath,
            type: assistant.type,
        };

        return NextResponse.json({ assistant: publicAssistant });

    } catch (error) {
        console.error("API GET /api/assistants/public Error:", error);
        return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
}
