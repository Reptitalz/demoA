
import { google } from 'googleapis';

let sheets: any;

async function getSheetsClient() {
    if (sheets) {
        return sheets;
    }

    const serviceAccountKey = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountKey) {
        throw new Error("Las credenciales de la cuenta de servicio de Google (GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON) no están configuradas.");
    }
    
    let credentials;
    try {
        credentials = JSON.parse(serviceAccountKey);
    } catch(e) {
        throw new Error("La clave de la cuenta de servicio de Google no es un JSON válido.");
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: authClient });
    
    return sheets;
}


/**
 * Asynchronously gets the names of all sheets in a Google Spreadsheet.
 * @param sheetId The ID of the google sheet.
 * @returns A promise that resolves to an array of strings representing the sheet names.
 */
export async function getSheetNames(sheetId: string): Promise<string[]> {
    try {
        const client = await getSheetsClient();
        const response = await client.spreadsheets.get({
            spreadsheetId: sheetId,
            fields: 'sheets.properties.title', // Only fetch the titles of the sheets
        });
        
        const sheetsData = response.data.sheets;
        if (sheetsData) {
            return sheetsData.map(sheet => sheet.properties?.title || '').filter(Boolean);
        } else {
            return [];
        }
    } catch(err: any) {
        console.error("Error al obtener los nombres de las hojas de Google:", err.message);
        if (err.code === 403) {
            throw new Error("Permiso denegado. Asegúrate de compartir la Hoja de Google con el correo de la cuenta de servicio: excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com");
        }
        throw new Error("No se pudo conectar con la Hoja de Google.");
    }
}


/**
 * Asynchronously gets the headers from a Google Sheet.
 * @param sheetId The ID of the google sheet to import.
 * @returns A promise that resolves to an array of strings representing the column headers.
 */
export async function getSheetHeaders(sheetId: string): Promise<string[]> {
    try {
        const client = await getSheetsClient();
        const response = await client.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'A1:Z1', // Get the first row
        });

        const rows = response.data.values;
        if (rows && rows.length > 0) {
            return rows[0];
        } else {
            return [];
        }
    } catch(err: any) {
        console.error("Error al obtener los encabezados de la Hoja de Google:", err.message);
        if (err.code === 403) {
            throw new Error("Permiso denegado. Asegúrate de compartir la Hoja de Google con el correo de la cuenta de servicio: excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com");
        }
        throw new Error("No se pudo conectar con la Hoja de Google.");
    }
}

/**
 * Asynchronously gets all data from a Google Sheet.
 * @param sheetId The ID of the google sheet to import.
 * @returns A promise that resolves to a 2D array of strings representing the sheet data.
 */
export async function getSheetData(sheetId: string): Promise<any[][]> {
    try {
        const client = await getSheetsClient();
        // Assuming data is on the first sheet, and we fetch a reasonable range.
        // You might need to make this more robust to get the actual sheet name and used range.
        const response = await client.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'A:Z', // Get all data in columns A to Z
        });

        return response.data.values || [];
    } catch(err: any) {
        console.error("Error al obtener los datos de la Hoja de Google:", err.message);
        if (err.code === 403) {
            throw new Error("Permiso denegado. Asegúrate de compartir la Hoja de Google con el correo de la cuenta de servicio: excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com");
        }
        throw new Error("No se pudo conectar con la Hoja de Google.");
    }
}
