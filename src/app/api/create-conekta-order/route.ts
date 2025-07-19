// This file is obsolete. The functionality has been migrated to /src/app/api/create-mercadopago-preference/route.ts.
// This file can be safely deleted.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'This payment gateway is deprecated.' }, { status: 410 });
}
