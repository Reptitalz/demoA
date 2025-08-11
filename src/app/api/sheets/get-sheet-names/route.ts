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
    let errorMessage = 'No se pudieron cargar las hojas. Asegúrate de que la hoja sea pública o que la cuenta de servicio tenga acceso.';
    if (error.message && error.message.includes('Permiso denegado')) {
        errorMessage = 'Permiso denegado. Verifica que la hoja sea "Pública en la web" o compártela con el correo de la cuenta de servicio: excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com';
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
