
// src/app/api/sheets-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import * as XLSX from 'xlsx';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';

// Ensure these environment variables are set:
// GOOGLE_SERVICE_ACCOUNT_JSON: The stringified JSON of your service account key
// GOOGLE_DRIVE_FOLDER_ID: (Optional) The ID of the Google Drive folder to create sheets in

// Helper function to get Google Auth client
function getGoogleAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set in environment variables.');
  }
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets', // Full control of spreadsheets
        'https://www.googleapis.com/auth/drive.file',    // To create files in Drive
      ],
    });
  } catch (error: any) {
    console.error("Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:", error.message);
    throw new Error(`Invalid GOOGLE_SERVICE_ACCOUNT_JSON. Parsing failed: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { fileData, fileName, firebaseUid: bodyFirebaseUid } = body;

    if (!fileData || !fileName || !bodyFirebaseUid) {
      return NextResponse.json({ message: 'Missing fileData, fileName, or firebaseUid in request body' }, { status: 400 });
    }

    if (decodedToken.uid !== bodyFirebaseUid) {
      return NextResponse.json({ message: 'Forbidden: Token UID does not match firebaseUid in request body' }, { status: 403 });
    }

    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Convert Base64 to Buffer and Parse Excel
    let excelData: any[][];
    try {
      const buffer = Buffer.from(fileData, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }); // Ensure empty cells are ""
      if (!excelData || excelData.length === 0) {
        excelData = [[]]; // Ensure at least one empty row if sheet is empty
      }
    } catch (error: any) {
      console.error('Error processing Excel file:', error.message);
      return NextResponse.json({ message: 'Error processing Excel file', error: error.message }, { status: 500 });
    }

    // 2. Create New Google Sheet
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.\- ()]/g, '_'); // Sanitize, allow spaces and parentheses
    const newSheetName = `[AssistAI] ${sanitizedFileName} (${new Date().toISOString().split('T')[0]})`;
    
    const fileMetadata: any = {
      name: newSheetName,
      mimeType: 'application/vnd.google-apps.spreadsheet',
    };
    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
      fileMetadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
    }

    let createdFile;
    try {
      createdFile = await drive.files.create({
        resource: fileMetadata,
        fields: 'id, webViewLink, name',
      });
    } catch (error: any) {
      console.error('Error creating Google Sheet in Drive:', error.response?.data || error.message);
      return NextResponse.json({ message: 'Error creating Google Sheet', error: error.response?.data?.error?.message || error.message }, { status: 500 });
    }

    const spreadsheetId = createdFile.data.id;
    const spreadsheetUrl = createdFile.data.webViewLink;
    const actualSpreadsheetName = createdFile.data.name;

    if (!spreadsheetId || !spreadsheetUrl) {
        console.error('Failed to get ID or URL for the created Google Sheet.');
        return NextResponse.json({ message: 'Failed to get ID or URL for the created Google Sheet' }, { status: 500 });
    }

    // 3. Write Data to the New Sheet
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1', 
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: excelData,
        },
      });
    } catch (error: any) {
      console.error('Error writing data to Google Sheet:', error.response?.data || error.message);
      try { await drive.files.delete({ fileId: spreadsheetId }); } catch (delError) { console.error('Failed to cleanup partially created sheet:', delError); }
      return NextResponse.json({ message: 'Error writing data to Google Sheet', error: error.response?.data?.error?.message || error.message }, { status: 500 });
    }
    
    // 4. Make Publicly Editable (Anyone with the link can edit)
    try {
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'writer', 
          type: 'anyone',
        },
      });
    } catch (error: any) {
      console.error('Error setting Google Sheet permissions:', error.response?.data || error.message);
      return NextResponse.json({ 
        message: 'Google Sheet created and data written, but failed to set public permissions.',
        spreadsheetUrl,
        spreadsheetId,
        spreadsheetName: actualSpreadsheetName,
        warning: 'Permissions could not be set to public editable.',
        error: error.response?.data?.error?.message || error.message 
      }, { status: 207 }); 
    }

    return NextResponse.json({ 
      spreadsheetUrl,
      spreadsheetId,
      spreadsheetName: actualSpreadsheetName
    });

  } catch (error: any) {
    console.error('Unhandled error in /api/sheets-upload:', error.message, error.stack);
    const errorMessage = error instanceof Error ? error.message : String(error);
     if (error.message.includes('GOOGLE_SERVICE_ACCOUNT_JSON')) {
        return NextResponse.json({ message: 'Error de configuración del servidor (Cuenta de Servicio de Google). Revisa las variables de entorno.', error: errorMessage }, { status: 500 });
    }
    return NextResponse.json({ message: 'Ocurrió un error inesperado al procesar tu solicitud.', error: errorMessage }, { status: 500 });
  }
}
