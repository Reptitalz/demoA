
'use server';
import axios from 'axios';

// This service now interacts with SMS-Activate.io API.

const SMS_ACTIVATE_API_KEY = process.env.SMS_ACTIVATE_API_KEY || '25AA2772105069bf90Addb4de9e9d3f5'; // YOUR_API_KEY from https://sms-activate.org/en/profile
const SMS_ACTIVATE_BASE_URL = 'https://api.sms-activate.org/stubs/handler_api.php';

if (!process.env.SMS_ACTIVATE_API_KEY) {
  console.warn('WARNING: SMS_ACTIVATE_API_KEY is not defined in environment variables. Using hardcoded fallback key. It is strongly recommended to set this in your .env.local file for security.');
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
