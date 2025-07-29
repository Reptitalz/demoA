
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { APP_NAME, CREDIT_PACKAGES } from '@/config/appConfig';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error("❌ CRITICAL ERROR: MERCADOPAGO_ACCESS_TOKEN is not set.");
}

const client = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN!,
    options: { timeout: 5000 },
});
const preference = new Preference(client);

export async function POST(request: NextRequest) {
  console.log('--- In-App Purchase endpoint hit ---');
  try {
    const { credits, userPhoneNumber } = await request.json();

    if (!userPhoneNumber) {
      return NextResponse.json({ error: 'No autorizado. Número de teléfono no proporcionado.' }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    const user = await db.collection<UserProfile>('userProfiles').findOne({ phoneNumber: userPhoneNumber });

    if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }
    
    if (!user._id) {
        return NextResponse.json({ error: 'ID de usuario interno no encontrado.' }, { status: 500 });
    }

    if (!credits || typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json(
        { error: 'La cantidad de créditos debe ser un número entero o flotante positivo.' },
        { status: 400 }
      );
    }
    
    const selectedPackage = CREDIT_PACKAGES.find(p => p.credits === credits);
    
    if (!selectedPackage) {
        return NextResponse.json({ error: 'Paquete de créditos no válido.' }, { status: 400 });
    }

    const external_reference = `${user._id.toString()}__${credits}__${Date.now()}`;
    const buyerEmail = user.email || `user_${user._id.toString()}@heymanito.com`; // Fallback email
    
    // Using phone number for last_name as a stable identifier when real name is not available
    const buyerFirstName = "Usuario";
    const buyerLastName = user.phoneNumber;

    const preferencePayload = {
        items: [
            {
                id: `credits-${credits}`,
                title: `${credits} Crédito(s) para ${APP_NAME}`,
                description: `Paquete de ${selectedPackage.name} con ${credits * 1000} mensajes.`,
                category_id: "virtual_credits", // Recommended: Item category
                quantity: 1,
                unit_price: selectedPackage.price, // Price without tax
                currency_id: 'MXN',
            },
        ],
        payer: {
            first_name: buyerFirstName, // Recommended: Buyer's first name
            last_name: buyerLastName,   // Recommended: Buyer's last name
            email: buyerEmail,
        },
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/dashboard?payment_status=success`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/dashboard?payment_status=failure`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/dashboard?payment_status=pending`,
        },
        auto_return: 'approved',
        external_reference,
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/api/mercadopago-webhook`,
    };

    console.log('🟡 Creating Mercado Pago preference with payload:', JSON.stringify(preferencePayload, null, 2));

    const result = await preference.create({ body: preferencePayload });

    console.log('✅ Preference created successfully with ID:', result.id);

    return NextResponse.json({
      preferenceId: result.id,
    });

  } catch (error: any) {
    const errorMessage = error.cause?.message || error.message || 'Ocurrió un error inesperado.';
    console.error('❌ --- MERCADO PAGO API ERROR ---');
    console.error('Error message:', errorMessage);
    console.error('Full Error:', error);

    return NextResponse.json(
      { error: `No se pudo crear la orden de pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}
