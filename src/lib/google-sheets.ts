
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

let sheets: any;

async function getSheetsClient() {
    // Si ya tenemos un cliente autenticado, lo reutilizamos.
    if (sheets) {
        return sheets;
    }

    // Check for essential environment variables for the new method
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const privateKeyBase64 = process.env.GOOGLE_PRIVATE_KEY_BASE64;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    // Strict check: if any of the required new environment variables are missing, throw an error.
    if (!projectId || !privateKeyBase64 || !clientEmail) {
      const missingVars = [
        !projectId && "GOOGLE_PROJECT_ID",
        !privateKeyBase64 && "GOOGLE_PRIVATE_KEY_BASE64",
        !clientEmail && "GOOGLE_CLIENT_EMAIL"
      ].filter(Boolean).join(', ');
      
      const errorMessage = `Las credenciales de la cuenta de servicio de Google no están configuradas correctamente. Falta(n) la(s) siguiente(s) variable(s) de entorno: ${missingVars}.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log(`Attempting to authenticate with Google Sheets API using project_id: ${projectId} and client_email: ${clientEmail}`);
    
    // New, more robust method
    try {
        // Decode the private key from Base64 AND ensure newline characters are correctly formatted.
        const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8').replace(/\\n/g, '\n');

        const auth = new JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        sheets = google.sheets({ version: 'v4', auth });
        
        console.log("Successfully authenticated with Google Sheets API using new method.");
        return sheets;

    } catch (error: any) {
        console.error("Error during Google Sheets API authentication or client creation:", error.message);
        throw new Error(`No se pudo autenticar con las credenciales de la cuenta de servicio. Error: ${error.message}`);
    }
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
        console.error("Error fetching Google Sheet names:", err.message);
        if (err.code === 403 || (err.message && err.message.includes('permission'))) {
            throw new Error("Permiso denegado. Asegúrate de compartir la Hoja de Google con 'excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com'.");
        }
        throw new Error(`No se pudo conectar con la Hoja de Google. Detalle: ${err.message}`);
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
        console.error("Error fetching Google Sheet headers:", err.message);
         if (err.code === 403 || (err.message && err.message.includes('permission'))) {
            throw new Error("Permiso denegado. Asegúrate de compartir la Hoja de Google con 'excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com'.");
        }
        throw new Error(`No se pudo conectar con la Hoja de Google. Detalle: ${err.message}`);
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
        console.error("Error fetching Google Sheet data:", err.message);
         if (err.code === 403 || (err.message && err.message.includes('permission'))) {
            throw new Error("Permiso denegado. Asegúrate de compartir la Hoja de Google con 'excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com'.");
        }
        throw new Error(`No se pudo conectar con la Hoja de Google. Detalle: ${err.message}`);
    }
}
