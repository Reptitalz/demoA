
// src/app/api/sheets/create-from-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSheet, updateSheet } from '@/lib/google-sheets';
import { parse } from 'papaparse'; // We need a CSV parser

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileContent } = await request.json();

    if (!fileName || !fileContent) {
      return NextResponse.json({ message: 'Se requieren el nombre y el contenido del archivo.' }, { status: 400 });
    }

    // 1. Create a new Google Sheet
    const newSheetUrl = await createSheet(`HeyManito Upload - ${fileName}`);
    const sheetId = newSheetUrl.split('/d/')[1].split('/')[0];
    
    // 2. Parse the CSV content
    const parsedData = parse(fileContent, { header: false });

    if (parsedData.errors.length > 0) {
        console.error("CSV Parsing errors:", parsedData.errors);
        // Decide if you want to fail or continue with partial data
    }

    // 3. Update the new sheet with the parsed data
    await updateSheet(sheetId, parsedData.data as any[][]);

    return NextResponse.json({ 
        success: true, 
        message: 'Hoja de Google creada exitosamente desde el archivo.',
        sheetUrl: newSheetUrl,
    });

  } catch (error: any) {
    console.error('API Error (sheets/create-from-upload):', error);
    return NextResponse.json({ message: error.message || 'No se pudo crear la hoja desde el archivo.' }, { status: 500 });
  }
}

    