
import { NextRequest, NextResponse } from 'next/server';
import { getSheetHeaders } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const { sheetUrl } = await request.json();

    if (!sheetUrl || typeof sheetUrl !== 'string') {
      return NextResponse.json({ message: 'Se requiere la URL de la Hoja de Google.' }, { status: 400 });
    }
    
    // Simple regex to extract the sheet ID from various URL formats
    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch || !sheetIdMatch[1]) {
      return NextResponse.json({ message: 'URL de Hoja de Google inválida.' }, { status: 400 });
    }
    const sheetId = sheetIdMatch[1];

    const headers = await getSheetHeaders(sheetId);
    
    return NextResponse.json({ columns: headers });

  } catch (error: any) {
    console.error('API Error (sheets/get-columns):', error);
    let errorMessage = 'No se pudieron cargar las columnas. Asegúrate de que la hoja sea pública o que la cuenta de servicio tenga acceso.';
    if (error.message && error.message.includes('permission')) {
        errorMessage = 'Permiso denegado. Verifica que la hoja sea "Pública en la web" o compártela con el correo de la cuenta de servicio.';
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
