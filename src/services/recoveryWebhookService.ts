
// src/services/recoveryWebhookService.ts
"use server";

import axios from 'axios';
import { formatMexicanPhoneNumberForWebhook } from '@/lib/utils';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

const RECOVERY_WEBHOOK_URL = 'https://n8n.reptitalz.cloud/webhook/recovery';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
const TOKEN_EXPIRATION_MINUTES = 15;

interface RecoveryPayload {
  phoneNumber: string;
  verificationCode: string; // This will now be the full recovery URL
  method: 'whatsapp' | 'email';
}

/**
 * Generates a secure recovery token, stores it in the database,
 * and sends a recovery URL to the specified webhook.
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

  // 1. Generate a secure, URL-safe token
  const token = crypto.randomBytes(32).toString('hex');
  const recoveryUrl = `${BASE_URL}/reset-password?token=${token}`;
  
  // 2. Store the token and its expiration date in the user's profile
  try {
    const { db } = await connectToDatabase();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + TOKEN_EXPIRATION_MINUTES);

    const result = await db.collection<UserProfile>('userProfiles').updateOne(
      { phoneNumber: phoneNumber },
      { $set: { recoveryToken: token, recoveryTokenExpiry: expirationDate } }
    );

    if (result.matchedCount === 0) {
      // This case should ideally be handled in the API route, but as a safeguard:
      throw new Error("User not found, cannot set recovery token.");
    }
  } catch (dbError) {
    console.error("Database error while setting recovery token:", dbError);
    throw new Error("Could not prepare recovery process due to a database error.");
  }
  
  // 3. Send the full recovery URL to the webhook
  const formattedPhoneNumber = formatMexicanPhoneNumberForWebhook(phoneNumber);

  const payload: RecoveryPayload = {
    phoneNumber: formattedPhoneNumber,
    verificationCode: recoveryUrl, // The payload now sends the full URL
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
