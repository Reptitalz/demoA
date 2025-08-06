// src/app/api/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';

// This endpoint is currently not in use as payments are handled
// via Mercado Pago's Checkout Pro redirection.
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'This payment method is not active. Please use Mercado Pago Checkout Pro.' },
    { status: 404 }
  );
}
