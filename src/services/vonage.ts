
'use server';
import axios from 'axios';

// This service now interacts with SMS-Activate.io API.

const SMS_ACTIVATE_API_KEY = process.env.SMS_ACTIVATE_API_KEY || '25AA2772105069bf90Addb4de9e9d3f5'; // YOUR_API_KEY from https://sms-activate.org/en/profile
const SMS_ACTIVATE_BASE_URL = 'https://api.sms-activate.org/stubs/handler_api.php';

if (!process.env.SMS_ACTIVATE_API_KEY) {
  console.warn('WARNING: SMS_ACTIVATE_API_KEY is not defined in environment variables. Using hardcoded fallback key. It is strongly recommended to set this in your .env.local file for security.');
}


interface GetNumberResponse {
  ACCESS_NUMBER?: string;
  ACCESS_RETRY_GET?: string;
  ACCESS_ACTIVATION?: string;
}

interface SetStatusResponse {
    ACCESS_SUCCESS?: string;
    ACCESS_CANCEL?: string;
}

// See https://sms-activate.org/en/api2#countriesandservices
const countryMap: { [key: string]: number } = {
  'US': 0, // USA
  'GB': 1, // UK
  'CA': 36, // Canada
  // Add more mappings as needed
};

/**
 * Gets a phone number for WhatsApp activation from a specified country.
 * @param countryCode The 2-letter country code (e.g., "US").
 * @returns A promise that resolves to an object with the number and activationId, or null if it fails.
 */
export async function getNumberForWhatsApp(countryCode: string): Promise<{ number: string; activationId: string } | null> {
  if (!SMS_ACTIVATE_API_KEY) {
    console.error('SMS-Activate API key not configured.');
    return null;
  }

  const countryId = countryMap[countryCode.toUpperCase()];
  if (countryId === undefined) {
    console.error(`Country code "${countryCode}" is not mapped to an SMS-Activate country ID.`);
    return null;
  }

  try {
    const response = await axios.get(SMS_ACTIVATE_BASE_URL, {
      params: {
        api_key: SMS_ACTIVATE_API_KEY,
        action: 'getNumber',
        service: 'wa', // WhatsApp service code
        country: countryId,
      },
    });

    const responseText = response.data as string;
    if (responseText.startsWith('ACCESS_NUMBER')) {
      const [, activationId, number] = responseText.split(':');
      console.log(`Successfully acquired number ${number} for WhatsApp with activation ID ${activationId}`);
      return { number, activationId };
    } else {
      console.error(`Failed to get number from SMS-Activate. Response: ${responseText}`);
      return null;
    }
  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error(`Error getting number from SMS-Activate for ${countryCode}:`, axiosError.response?.data || axiosError.message);
    return null;
  }
}

/**
 * Cancels a specific number activation.
 * @param activationId The activation ID to cancel.
 * @returns A promise that resolves to true if the cancellation was successful, false otherwise.
 */
export async function cancelActivation(activationId: string): Promise<boolean> {
  if (!SMS_ACTIVATE_API_KEY) {
    console.error('SMS-Activate API key not configured.');
    return false;
  }
  try {
    const response = await axios.get(SMS_ACTIVATE_BASE_URL, {
        params: {
          api_key: SMS_ACTIVATE_API_KEY,
          action: 'setStatus',
          id: activationId,
          status: 8, // 8 = Cancel activation
        },
      });

      const responseText = response.data as string;

      if (responseText === 'ACCESS_CANCEL') {
        console.log(`Successfully cancelled activation ID: ${activationId}`);
        return true;
      } else {
        console.error(`Failed to cancel activation ${activationId}. Response: ${responseText}`);
        return false;
      }

  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error(`Error cancelling activation ${activationId}:`, axiosError.response?.data || axiosError.message);
    return false;
  }
}
