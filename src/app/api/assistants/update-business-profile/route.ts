// src/app/api/assistants/update-business-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, AssistantBusinessInfo } from '@/types';
import { ObjectId } from 'mongodb';
import axios from 'axios';

const GUPSHUP_BASE_URL = 'https://api.gupshup.io/wa/app';

export async function POST(request: NextRequest) {
  const { assistantId, businessInfo }: { assistantId: string, businessInfo: AssistantBusinessInfo } = await request.json();

  if (!assistantId || !businessInfo) {
    return NextResponse.json({ message: 'Se requieren el ID del asistente y la información del negocio' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    // We need to find the user who owns this assistant to get the credentials
    const userProfile = await db.collection<UserProfile>('userProfiles').findOne({ 
      "assistants.id": assistantId 
    });

    if (!userProfile) {
      return NextResponse.json({ message: 'Asistente no encontrado' }, { status: 404 });
    }

    const assistant = userProfile.assistants.find(a => a.id === assistantId);

    if (!assistant || !assistant.numberReady) {
       return NextResponse.json({ message: 'El asistente no está activo o no fue encontrado' }, { status: 400 });
    }
    
    const { gupshupConfig } = assistant;

    if (!gupshupConfig || !gupshupConfig.appId || !gupshupConfig.apiKey) {
      return NextResponse.json({ message: 'Credenciales de Gupshup no encontradas para este asistente' }, { status: 400 });
    }

    // Map frontend businessInfo to Gupshup's form parameters
    const [addressLine1, ...addressParts] = businessInfo.companyAddress?.split(',') || [];
    const addressLine2 = addressParts.join(', ').trim();

    const formParams = new URLSearchParams();
    if (addressLine1) formParams.append('addressLine1', addressLine1);
    if (addressLine2) formParams.append('addressLine2', addressLine2);
    if (businessInfo.vertical) formParams.append('vertical', businessInfo.vertical);
    if (businessInfo.companyEmail) formParams.append('profileEmail', businessInfo.companyEmail);
    if (businessInfo.websiteUrl) formParams.append('website1', businessInfo.websiteUrl);
    // desc and other address parts could be added here if needed
    
    await axios.put(`${GUPSHUP_BASE_URL}/${gupshupConfig.appId}/business/profile`, formParams, {
        headers: {
            'apikey': gupshupConfig.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    return NextResponse.json({ success: true, message: 'Perfil de negocio de WhatsApp actualizado.' });

  } catch (error) {
    console.error('API Error (update-business-profile):', error);
    let errorMessage = 'Error interno del servidor';
    if (axios.isAxiosError(error) && error.response) {
      console.error('Gupshup API Error:', error.response.data);
      errorMessage = error.response.data.message || 'Error al comunicarse con la API de Gupshup';
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
