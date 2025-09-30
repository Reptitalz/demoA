// src/app/api/products/route.ts
// This file is no longer used as product/catalog data is now part of the user profile.
// The data is fetched via the AppProvider context on the client-side.
// This file can be safely deleted in a future cleanup.

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'This API endpoint is deprecated. Product data is handled client-side.' },
    { status: 410 } // 410 Gone
  );
}
