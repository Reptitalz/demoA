// src/app/api/assistants/activate-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, AssistantConfig } from '@/types';
import { ObjectId } from 'mongodb';
import { MONTHLY_PLAN_CREDIT_COST, UNLIMITED_MESSAGES_LIMIT } from '@/config/appConfig';
import { sendPushNotification } from '@/services/pushService';

export async function POST(request: NextRequest) {
  const { userId, assistantId } = await request.json();

  if (!userId || !assistantId) {
    return NextResponse.json({ message: 'Se requieren el ID de usuario y de asistente' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');
    const user = await userProfileCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    // 1. Check if user has enough credits
    if (user.credits < MONTHLY_PLAN_CREDIT_COST) {
      return NextResponse.json({ message: `Créditos insuficientes. Se requieren ${MONTHLY_PLAN_CREDIT_COST} créditos.` }, { status: 402 });
    }

    const assistantIndex = user.assistants.findIndex(a => a.id === assistantId);
    if (assistantIndex === -1) {
      return NextResponse.json({ message: 'Asistente no encontrado' }, { status: 404 });
    }
    
    const assistant = user.assistants[assistantIndex];
    if (assistant.type !== 'desktop') {
        return NextResponse.json({ message: 'Los planes mensuales solo están disponibles para asistentes de escritorio.' }, { status: 400 });
    }

    // 2. Deduct credits and update assistant
    const newCreditBalance = user.credits - MONTHLY_PLAN_CREDIT_COST;
    const updatedAssistant: AssistantConfig = {
      ...assistant,
      isActive: true,
      isPlanActive: true,
      monthlyMessageLimit: UNLIMITED_MESSAGES_LIMIT,
      trialStartDate: undefined, // Clear trial data
      isFirstDesktopAssistant: false,
    };

    const updateResult = await userProfileCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          credits: newCreditBalance,
          [`assistants.${assistantIndex}`]: updatedAssistant,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
        throw new Error('No se pudo actualizar el perfil del usuario.');
    }

    // Send push notification
    await sendPushNotification(userId, {
        title: 'Plan Mensual Activado',
        body: `Tu asistente "${assistant.name}" ahora tiene mensajes ilimitados.`,
        url: '/dashboard/assistants',
        tag: 'plan-activated'
    });

    return NextResponse.json({
      success: true,
      message: 'Plan activado exitosamente.',
      updatedAssistant,
      newCreditBalance,
    });

  } catch (error) {
    console.error('API Error (activate-plan):', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}