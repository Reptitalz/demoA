
// src/services/recoveryWebhookService.ts
"use server";

import axios from 'axios';
import { formatMexicanPhoneNumberForWebhook } from '@/lib/utils';

const RECOVERY_WEBHOOK_URL = 'https://n8n.reptitalz.cloud/webhook/recovery';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

interface RecoveryPayload {
  phoneNumber: string;
  recoveryUrl: string;
  method: 'whatsapp' | 'email';
}

/**
 * Sends a recovery link to the specified webhook.
 * @param phoneNumber The user's phone number.
 * @param method The recovery method ('whatsapp' or 'email').
 * @param token The unique recovery token.
 */
export async function sendRecoveryWebhook(
  phoneNumber: string,
  method: 'whatsapp' | 'email',
  token: string
): Promise<void> {
  if (!RECOVERY_WEBHOOK_URL) {
    console.warn('RECOVERY_WEBHOOK_URL is not configured. Skipping sending recovery webhook.');
    return;
  }

  const recoveryUrl = `${BASE_URL}/reset-password?token=${token}`;
  const formattedPhoneNumber = formatMexicanPhoneNumberForWebhook(phoneNumber);

  const payload: RecoveryPayload = {
    phoneNumber: formattedPhoneNumber,
    recoveryUrl,
    method,
  };

  try {
    console.log(`Sending recovery webhook to ${RECOVERY_WEBHOOK_URL} for phone number ${formattedPhoneNumber}`);
    
    await axios.post(RECOVERY_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    console.log(`Recovery webhook sent successfully for method: ${method}`);

  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error(`Error sending recovery webhook:`, axiosError.isAxiosError ? (axiosError.response?.data || axiosError.message) : String(error));
    // Re-throw the error so the calling API endpoint can handle it.
    throw new Error('Failed to trigger the recovery process.');
  }
}
