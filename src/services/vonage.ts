
'use server';
import axios from 'axios';

const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
const VONAGE_BASE_URL = 'https://rest.nexmo.com';

if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
  console.error('Vonage API Key or Secret is not defined in environment variables.');
  // Potentially throw an error or handle this state appropriately
}

interface VonageSearchResponseNumber {
  country: string;
  msisdn: string;
  type: string;
  cost: string;
  features: string[];
}

interface VonageSearchResponse {
  count: number;
  numbers: VonageSearchResponseNumber[];
}

interface VonageBuyResponse {
  'error-code'?: string;
  'error-code-label'?: string;
  // Add other success fields if known
}

/**
 * Searches for an available phone number in the specified country.
 * @param countryCode The 2-letter country code (e.g., "US").
 * @returns A promise that resolves to the first available phone number string (msisdn) or null if none found.
 */
export async function searchAvailableNumber(countryCode: string): Promise<string | null> {
  if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
    console.error('Vonage API credentials not configured.');
    return null;
  }
  try {
    const response = await axios.get<VonageSearchResponse>(`${VONAGE_BASE_URL}/number/search`, {
      params: {
        country: countryCode,
        features: 'VOICE,SMS', // Requesting VOICE and SMS features
        api_key: VONAGE_API_KEY,
        api_secret: VONAGE_API_SECRET,
        size: 5, // Fetch a few numbers to choose from, defaults to 10
      },
    });

    if (response.data && response.data.numbers && response.data.numbers.length > 0) {
      // Potentially add logic here to select the best number if multiple are returned
      const availableNumber = response.data.numbers[0].msisdn;
      console.log(`Found available Vonage number in ${countryCode}: ${availableNumber}`);
      return availableNumber;
    } else {
      console.warn(`No available Vonage numbers found for country: ${countryCode}`);
      return null;
    }
  } catch (error) {
    console.error(`Error searching for Vonage number in ${countryCode}:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * Buys a specific phone number.
 * @param countryCode The 2-letter country code (e.g., "US").
 * @param msisdn The phone number (msisdn) to purchase.
 * @returns A promise that resolves to true if the purchase was successful, false otherwise.
 */
export async function buyNumber(countryCode: string, msisdn: string): Promise<boolean> {
  if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
    console.error('Vonage API credentials not configured.');
    return false;
  }
  try {
    const response = await axios.post<VonageBuyResponse>(
      `${VONAGE_BASE_URL}/number/buy`,
      {
        country: countryCode,
        msisdn: msisdn,
        api_key: VONAGE_API_KEY,
        api_secret: VONAGE_API_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Vonage API for buy often expects form-urlencoded
        },
      }
    );
    
    // Vonage API returns 200 OK for both success and failure, check error-code
    if (response.data && response.data['error-code']) {
      console.error(`Failed to buy Vonage number ${msisdn}. Error: ${response.data['error-code-label']} (${response.data['error-code']})`);
      return false;
    }
    
    // Assuming no 'error-code' means success based on typical Nexmo/Vonage patterns
    // A more robust check might involve looking for specific success indicators if available in the response
    console.log(`Successfully bought Vonage number: ${msisdn}`);
    return true;
  } catch (error) {
    console.error(`Error buying Vonage number ${msisdn}:`, error.response?.data || error.message);
    return false;
  }
}
