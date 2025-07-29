
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PRICE_PER_CREDIT, APP_NAME } from '@/config/appConfig';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || "TEST-5778475401797182-071902-c7bf3fe911512a93a32422643348f123-255854133";

if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error("❌ CRITICAL ERROR: MERCADOPAGO_ACCESS_TOKEN is not set.");
}

const client = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 },
});
const preference = new Preference(client);

export async function POST(request: NextRequest) {

  try {
    const { credits, userPhoneNumber } = await request.json();

    if (!userPhoneNumber) {
      return NextResponse.json({ error: 'No autorizado. Número de teléfono no proporcionado.' }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    // Find the user by their phone number now
    const user = await db.collection<UserProfile>('userProfiles').findOne({ phoneNumber: userPhoneNumber });

    if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }
    
    // Ensure user has a mongo _id which is used as the external reference base.
    if (!user._id) {
        return NextResponse.json({ error: 'ID de usuario interno no encontrado.' }, { status: 500 });
    }
    
    const userEmail = user.email || `${user.phoneNumber}@placeholder.com`;

    if (
      !credits ||
      typeof credits !== 'number' ||
      credits <= 0 ||
      !Number.isInteger(credits)
    ) {
      return NextResponse.json(
        { error: 'La cantidad de créditos debe ser un número entero positivo.' },
        { status: 400 }
      );
    }

    const price = credits * PRICE_PER_CREDIT;
    const IVA_RATE = 1.16;
    const totalAmount = parseFloat((price * IVA_RATE).toFixed(2));
    // Use the reliable Mongo _id for the reference
    const external_reference = `${user._id.toString()}__${credits}__${Date.now()}`;

    const preferencePayload = {
        items: [
            {
                id: `credits-${credits}`,
                title: `${credits} Crédito(s) para ${APP_NAME}`,
                quantity: 1,
                unit_price: totalAmount,
                currency_id: 'MXN',
            },
        ],
        payer: {
            email: userEmail,
            phone: {
                area_code: userPhoneNumber.substring(1, 3), // +52 -> 52
                number: userPhoneNumber.substring(3),
            },
        },
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/dashboard`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/dashboard`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/dashboard`,
        },
        auto_return: 'approved',
        external_reference,
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/api/mercadopago-webhook`,
    };

    console.log(
      '🟡 Creating Mercado Pago preference with payload:',
      JSON.stringify({ body: preferencePayload }, null, 2)
    );

    const result = await preference.create({ body: preferencePayload });

    console.log('✅ Preference created successfully:', result.id);

    return NextResponse.json({
      preferenceId: result.id,
      init_point: result.init_point,
    });

  } catch (error: any) {
    const errorMessage =
      error.cause?.message || error.message || 'Ocurrió un error inesperado.';
    console.error('❌ --- MERCADO PAGO API ERROR ---');
    console.error('Error message:', errorMessage);
    console.error('Full Error:', error);

    return NextResponse.json(
      { error: `No se pudo crear la orden de pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}
