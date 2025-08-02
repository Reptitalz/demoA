
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

function convertToCSV(data: any[][]): string {
  return data.map(row => 
    row.map(cell => {
      const stringCell = String(cell);
      // Escape quotes by doubling them
      const escapedCell = stringCell.replace(/"/g, '""');
      // If the cell contains a comma, quote, or newline, wrap it in double quotes
      if (/[",\n]/.test(escapedCell)) {
        return `"${escapedCell}"`;
      }
      return escapedCell;
    }).join(',')
  ).join('\n');
}

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

    const data = await getSheetData(sheetId);
    
    if (!data || data.length === 0) {
        return new Response("No hay datos para descargar.", { status: 200, headers: { 'Content-Type': 'text/csv' } });
    }
    
    const csv = convertToCSV(data);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="data.csv"`,
      },
    });

  } catch (error: any) {
    console.error('API Error (sheets/download):', error);
    let errorMessage = 'No se pudo descargar el archivo.';
    if (error.message && error.message.includes('permission')) {
        errorMessage = 'Permiso denegado. Verifica que la hoja sea "Pública en la web" o compártela con el correo de la cuenta de servicio.';
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
