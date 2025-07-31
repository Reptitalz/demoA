// src/services/recoveryWebhookService.ts
"use server";

import axios from 'axios';
import { formatMexicanPhoneNumberForWebhook } from '@/lib/utils';
import crypto from 'crypto';

const RECOVERY_WEBHOOK_URL = 'https://n8n.reptitalz.cloud/webhook/recovery';

interface RecoveryPayload {
  phoneNumber: string;
  verificationCode: string;
  method: 'whatsapp' | 'email';
}

/**
 * Generates a secure random code and sends it to the recovery webhook.
 * @param phoneNumber The user's phone number.
 * @param method The recovery method ('whatsapp' or 'email').
 */
export async function sendRecoveryWebhook(
  phoneNumber: string,
  method: 'whatsapp' | 'email'
): Promise<void> {
  if (!RECOVERY_WEBHOOK_URL) {
    console.warn('RECOVERY_WEBHOOK_URL is not configured. Skipping sending recovery webhook.');
    return;
  }

  // Generate a secure, user-friendly 6-digit code.
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  
  const formattedPhoneNumber = formatMexicanPhoneNumberForWebhook(phoneNumber);

  const payload: RecoveryPayload = {
    phoneNumber: formattedPhoneNumber,
    verificationCode, // This is the dynamic, secure code.
    method,
  };

  try {
    console.log(`Sending recovery webhook to ${RECOVERY_WEBHOOK_URL} for phone number ${formattedPhoneNumber}`);
    
    await axios.post(RECOVERY_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    console.log(`Recovery webhook sent successfully for method: ${method}`);

    // In a real application, you would also save this code (or a hash of it)
    // to the database with an expiration timestamp to verify it later.
    // e.g., db.collection('userProfiles').updateOne({ phoneNumber }, { $set: { recoveryCode: hashedCode, recoveryExpires: new Date(Date.now() + 10 * 60 * 1000) } });

  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error(`Error sending recovery webhook:`, axiosError.isAxiosError ? (axiosError.response?.data || axiosError.message) : String(error));
    // Re-throw the error so the calling API endpoint can handle it.
    throw new Error('Failed to trigger the recovery process.');
  }
}
