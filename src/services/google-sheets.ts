/**
 * Represents the data in a google sheet
 */
export interface GoogleSheet {
  /**
   * The ID of the google sheet.
   */
  sheetId: string;
}

/**
 * Asynchronously imports a Google Sheet.
 *
 * @param sheetId The ID of the google sheet to import.
 * @returns A promise that resolves to the contents of the Google Sheet.
 */
export async function importGoogleSheet(sheetId: string): Promise<any> {
  // TODO: Implement this by calling an API.
  console.log(`Importing Google Sheet: ${sheetId}`);
  return {};
}
