
"use server";

import axios from 'axios';
import { formatMexicanPhoneNumberForWebhook } from '@/lib/utils';
// Corrected import path
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';

const VERIFICATION_WEBHOOK_URL = 'https://n8n.reptitalz.cloud/webhook/3c0e3d8f-a4e3-441f-9164-14491310bdba';

interface VerificationPayload {
  phoneNumber: string;
  verificationCode: string;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Stores a verification code for a user based on their phone number.
 * Note: This assumes phone numbers are unique identifiers for users.
 * @param phoneNumber The user's phone number.
 * @param verificationCode The code to store.
 */
async function storeVerificationCode(phoneNumber: string, verificationCode: string): Promise<void> {
    try {
        const { db } = await connectToDatabase();
        const userCollection = db.collection<UserProfile>('userProfiles');

        const result = await userCollection.updateOne(
            { phoneNumber: phoneNumber }, // This assumes phone number is stored and unique
            { $set: { verificationCode: verificationCode } }
        );
        
        if (result.matchedCount === 0) {
            console.warn(`Attempted to store verification code for a non-existent phone number: ${phoneNumber}`);
            // Depending on the flow, you might want to throw an error here.
            // For now, we'll just log a warning.
        }

    } catch (error) {
        console.error("Error storing verification code in DB:", error);
        // Re-throw to be caught by the calling service
        throw new Error("Failed to store verification code.");
    }
}


export async function sendVerificationCodeWebhook(phoneNumber: string): Promise<void> {
  if (!VERIFICATION_WEBHOOK_URL) {
    console.warn('VERIFICATION_WEBHOOK_URL is not configured. Skipping sending verification webhook.');
    return;
  }
  
  const formattedPhoneNumber = formatMexicanPhoneNumberForWebhook(phoneNumber);
  const verificationCode = generateVerificationCode();
  
  // Store the code in the DB so the API route can verify it later
  await storeVerificationCode(phoneNumber, verificationCode);

  const payload: VerificationPayload = {
    phoneNumber: formattedPhoneNumber,
    verificationCode,
  };

  try {
    console.log(`Sending verification code webhook to ${VERIFICATION_WEBHOOK_URL} for phone number ${formattedPhoneNumber}`);
    const response = await axios.post(VERIFICATION_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    console.log(`Verification code webhook sent successfully. Status: ${response.status}`);
  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error(`Error sending verification code webhook to ${VERIFICATION_WEBHOOK_URL}:`, axiosError.isAxiosError ? (axiosError.response?.data || axiosError.message) : String(error));
    // Re-throw to be caught by the UI
    throw new Error("Failed to send verification code webhook.");
  }
}
