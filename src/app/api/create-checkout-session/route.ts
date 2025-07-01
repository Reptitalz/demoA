// This file is deprecated as Stripe is no longer used.
// It can be safely deleted.

import {NextResponse} from 'next/server';

export async function POST() {
  return NextResponse.json({error: 'This functionality is deprecated.'}, {status: 410});
}
