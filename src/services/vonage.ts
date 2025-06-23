
'use server';
import axios from 'axios';

const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
const VONAGE_BASE_URL = 'https://rest.nexmo.com';

if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
  console.error('Vonage API Key or Secret is not defined in environment variables.');
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

interface VonageActionResponse { // General response for buy/cancel
  'error-code'?: string;
  'error-code-label'?: string;
  // Add other success fields if known
}

/**
 * Searches for an available phone number in the specified country that costs less than $2.00.
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
        features: 'VOICE,SMS',
        api_key: VONAGE_API_KEY,
        api_secret: VONAGE_API_SECRET,
        size: 10, // Search a slightly larger pool to find a cheap one
      },
    });

    if (response.data && response.data.numbers && response.data.numbers.length > 0) {
      // Find the first number that costs less than $2.00
      const cheapNumber = response.data.numbers.find(num => {
        const price = parseFloat(num.cost);
        return !isNaN(price) && price < 2.00;
      });

      if (cheapNumber) {
        console.log(`Found available Vonage number in ${countryCode} for $${cheapNumber.cost}: ${cheapNumber.msisdn}`);
        return cheapNumber.msisdn;
      } else {
        console.warn(`No available Vonage numbers found for country ${countryCode} under $2.00.`);
        return null;
      }
    } else {
      console.warn(`No available Vonage numbers found for country: ${countryCode}`);
      return null;
    }
  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error(`Error searching for Vonage number in ${countryCode}:`, axiosError.response?.data || axiosError.message);
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
    const response = await axios.post<VonageActionResponse>(
      `${VONAGE_BASE_URL}/number/buy`,
      new URLSearchParams({ // Vonage API for buy often expects form-urlencoded
        country: countryCode,
        msisdn: msisdn,
        api_key: VONAGE_API_KEY,
        api_secret: VONAGE_API_SECRET,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    if (response.data && response.data['error-code']) {
      console.error(`Failed to buy Vonage number ${msisdn}. Error: ${response.data['error-code-label']} (${response.data['error-code']})`);
      return false;
    }
    
    console.log(`Successfully bought Vonage number: ${msisdn}`);
    return true;
  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error(`Error buying Vonage number ${msisdn}:`, axiosError.response?.data || axiosError.message);
    return false;
  }
}

/**
 * Cancels a specific phone number.
 * @param msisdn The phone number (msisdn) to cancel.
 * @param countryCode The 2-letter country code of the number.
 * @returns A promise that resolves to true if the cancellation was successful, false otherwise.
 */
export async function cancelNumber(msisdn: string, countryCode: string): Promise<boolean> {
  if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
    console.error('Vonage API credentials not configured for cancellation.');
    return false;
  }
  try {
    const response = await axios.post<VonageActionResponse>(
      `${VONAGE_BASE_URL}/number/cancel`,
      new URLSearchParams({
        country: countryCode, // Country code is typically required for cancellation
        msisdn: msisdn,
        api_key: VONAGE_API_KEY,
        api_secret: VONAGE_API_SECRET,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data['error-code']) {
      console.error(`Failed to cancel Vonage number ${msisdn}. Error: ${response.data['error-code-label']} (${response.data['error-code']})`);
      return false;
    }

    console.log(`Successfully cancelled Vonage number: ${msisdn}`);
    return true;
  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error(`Error cancelling Vonage number ${msisdn}:`, axiosError.response?.data || axiosError.message);
    return false;
  }
}
