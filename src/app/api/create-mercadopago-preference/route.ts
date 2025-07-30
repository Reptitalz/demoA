
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

    let external_reference;
    // For diagnostic purposes, use a static external_reference for the test plan
    if (selectedPackage.name === 'Prueba') {
        external_reference = '119792215961';
        console.log(`DIAGNOSTIC MODE: Using static external_reference: ${external_reference} for Test Plan.`);
    } else {
        external_reference = `${user._id.toString()}__${credits}__${Date.now()}`;
    }
    
    const preferencePayload = {
        items: [
            {
                id: `credits-${credits}`,
                title: `${selectedPackage.name} - ${credits * 1000} mensajes para ${APP_NAME}`,
                description: `Paquete de ${selectedPackage.name} para recargar ${credits} créditos en la plataforma ${APP_NAME}.`,
                category_id: "virtual_credits",
                quantity: 1,
                unit_price: selectedPackage.price,
                currency_id: 'MXN',
            },
        ],
        payer: {
            name: user.firstName,
            surname: user.lastName,
            email: user.email,
            phone: {
                area_code: user.phoneNumber?.substring(1, 3),
                number: user.phoneNumber?.substring(3)
            },
            address: user.address ? {
                street_name: user.address.street_name,
                street_number: user.address.street_number ? parseInt(user.address.street_number, 10) : undefined,
                zip_code: user.address.zip_code
            } : undefined
        },
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/dashboard?payment_status=success`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/dashboard?payment_status=failure`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/dashboard?payment_status=pending`,
        },
        auto_return: 'approved',
        external_reference,
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.heymanito.com'}/api/mercadopago-webhook`,
        statement_descriptor: "HE MANITO",
    };

    console.log('🟡 Creating Mercado Pago preference with payload:', JSON.stringify(preferencePayload, null, 2));

    const result = await preference.create({ body: preferencePayload });

    console.log('✅ Preference created successfully with ID:', result.id);

    return NextResponse.json({
      preferenceId: result.id
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
    