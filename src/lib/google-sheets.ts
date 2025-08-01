
import { google } from 'googleapis';

let sheets: any;

async function getSheetsClient() {
    if (sheets) {
        return sheets;
    }

    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY no está configurada en las variables de entorno.");
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
            throw new Error("Permiso denegado. Asegúrate de compartir la Hoja de Google con el correo de la cuenta de servicio.");
        }
        throw new Error("No se pudo conectar con la Hoja de Google.");
    }
}
