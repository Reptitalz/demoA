// src/app/api/assistants/purchase-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';
import { MONTHLY_PLAN_CREDIT_COST } from '@/config/appConfig';
import { sendPushNotification } from '@/services/pushService';

// This endpoint is DEPRECATED as plan purchases now go through MercadoPago.
// It is kept for potential future use or direct credit-based purchases if needed.
export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ message: 'Se requiere un ID de usuario válido' }, { status: 400 });
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

    // 2. Deduct credits and add a purchasable plan
    const newCreditBalance = user.credits - MONTHLY_PLAN_CREDIT_COST;
    const newPurchasedPlans = (user.purchasedUnlimitedPlans || 0) + 1;

    const updateResult = await userProfileCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          credits: newCreditBalance,
          purchasedUnlimitedPlans: newPurchasedPlans,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error('No se pudo actualizar el perfil del usuario.');
    }

    // Send push notification
    await sendPushNotification(userId, {
        title: 'Plan Ilimitado Comprado',
        body: 'Has comprado un plan de mensajes ilimitados. ¡Asígnalo a un asistente!',
        url: '/dashboard/assistants',
        tag: 'plan-purchased'
    });

    return NextResponse.json({
      success: true,
      message: 'Plan ilimitado comprado exitosamente.',
      newCreditBalance,
      newPurchasedPlans,
    });

  } catch (error) {
    console.error('API Error (purchase-plan):', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
