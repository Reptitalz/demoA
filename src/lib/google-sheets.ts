
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

let sheets: any;

async function getSheetsClient() {
    if (sheets) {
        return sheets;
    }

    // --- SECURITY WARNING ---
    // The credentials are being hardcoded here for debugging and prototyping purposes ONLY.
    // In a production environment, these should be loaded securely from environment variables
    // or a secret management service (like Google Secret Manager or HashiCorp Vault).
    // Storing credentials directly in the source code is a security risk.
    const credentials = {
      type: "service_account",
      project_id: "reptitalz-413408",
      private_key_id: "17c535f6b299c34bd0c4ef3d5a31debb0e748686",
      private_key: `-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDeE4i5l1uPusTn\nFGRumXyifCWj8VGz2NoIk8eaxTzWtMEj+bBAoDQQU55ixWlOZnhFILhlkytLk5Ap\npNZ3RL2H4fOHHjq45SMsj8e/FCx1QKpD3Ee4hrTVWiBmIeJO2pMis0He10wywLEb\njIYIcFvDaaR2rziwOjMW8mow6q35pxMPj7Tj6tdkYz7MioxYTZVjn6joUrjYSk4N\n8BlO9od0x8EJWhT2mXxOSuOOwsGnK6u8tJJNZgLusZy1OkjfxQwnpf861/v8Owec\nGPXk0IQ608JxKvdid4HHneVnVvSA5KvDtJbRIYrb6vEBzwJe+iqOSb4X4ONxSfEx\nqlH1BEzTAgMBAAECggEADekeVYsaw/2N1kW2PCFRfSIWqiwfEzYVrkIyLMqHEuc+\no+triW4fj22VdxgTjm19F3jDDtscSVR5zB9UWc3iALrRai4lZ9iJOVeGSmdP7kZP\nLrID12taCh/mS097DA0ao1VO3npmU6rd99z3tlvyEOMIrMXcC1nnQlw2n6V2TAl3\ntUFPzByI7oN6HQ+PpoNByQFfrxkG9Ho+syGzc13JYSTcKi1e6Ez1ojkdqMNEaAer\n9BaeTMYHt4SoGbG6IaAu1saTO/mzi5b23M9/9EAilAkaRX5S7fRFaxM96ED4Fd94\n/5xwkC5wyfOisMpa86XVHUU3Bg32e37qOXgr+mz0BQKBgQD9tmzIuwbbwk18U7/+\nyro2CpLxBjat7hAbpqdP/XM3nj1C+IeV5DgaxG6jpXd3n3YjknLIH2rjMSSaeEX5\n5p9y5uXx/uKDmakVEXmjyqF33UzEwYSGouiJd5RzYtO3ZkhuvU0Y525UzOXWaox8\nc/rJC6Frw5SNIULTRSQW0TRdfwKBgQDgFBd/MzYWkeCBnVgmYisOWJfFMEaMYqSt\nOuPPL72H4jVPQwp9oyCVDBhPYl8ZTt4ueXtAYVMYKR682cKQ7bcecm+gfB8S4rsJ\nGU0c90mdN88KKaGyCF9gSZfore7SCnniw3GCt60krV5CkYpmMnSPg/z1IrZLrsfO\nq8emf2nirQKBgQCFQud6u7nLfhBjCD5lXyhVsFIkJSZdTxjI3U0uV6rIAOaeoZnd\n4kSR0rFmZUgN3gUYhBikAtSKxso6FIh0zWzc1mjbJgzmILTN6yLgJFORePyUsCyi\n5ziK0/N2c+dOgnvzJp0zQoQSKJlkeQyXZffI18IOr2j8hAbsn3loPrRpkwKBgQDC\nDGQ0wXKLpRSY6luWEdlbeRklqKLPm/UkFyWFHMCzVg/4bgQ9vPDQYkMDLBtS3VvH\nP2ie3imJeMKnpKS7wUCdW1iT0ClQv4xdWs3O0c+sGNJw6JCgjmOaDOFCnK1+s5fN\n6pb4LnwAkSpZ15PU4MjUJ+b9mmvnqppZvaUN6LUXmQKBgQCStjh+4fQvu0arBpbh\nhd3tc9/egyYEG0hX0kG0lTi66tlw8Ww3NBO4DgR8l6WmV+CGKKGPHDiIZfMCE7dX\nEEl3Eeb1VjkEWeta0H+S7myDfKzwEr5ZdsAIuUTC8rFTdEiGcDJEmRYG3uTsNMiV\nTd0h4uTNZDQoD1bP31XhxBmpig==\n-----END PRIVATE KEY-----\n`,
      client_email: "excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com",
      client_id: "103633657615530363104",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/excel-sheets-writer%40reptitalz-413408.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    };

    try {
        const auth = google.auth.fromJSON(credentials);
        auth.scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
        
        sheets = google.sheets({ version: 'v4', auth });
        
        console.log(`Successfully authenticated with Google Sheets API using hardcoded client_email: ${credentials.client_email}`);
        return sheets;

    } catch (error: any) {
        let errorMessage = `No se pudo autenticar con las credenciales de la cuenta de servicio. Error: ${error.message}`;
        console.error("Error during Google Sheets API authentication or client creation:", errorMessage);
        throw new Error(errorMessage);
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
            return sheetsData.map((sheet: any) => sheet.properties?.title || '').filter(Boolean);
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
