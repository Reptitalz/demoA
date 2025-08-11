// src/app/api/sheets/get-sheet-names/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSheetNames } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const { sheetUrl } = await request.json();

    if (!sheetUrl || typeof sheetUrl !== 'string') {
      return NextResponse.json({ message: 'Se requiere la URL de la Hoja de Google.' }, { status: 400 });
    }
    
    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch || !sheetIdMatch[1]) {
      return NextResponse.json({ message: 'URL de Hoja de Google inválida.' }, { status: 400 });
    }
    const sheetId = sheetIdMatch[1];

    const sheetNames = await getSheetNames(sheetId);
    
    return NextResponse.json({ sheetNames });

  } catch (error: any) {
    console.error('API Error (sheets/get-sheet-names):', error);
    // Send a more specific error message back to the client
    let errorMessage = error.message || 'Ocurrió un error desconocido al cargar las hojas.';
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
