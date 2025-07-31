
"use server";

import axios from 'axios';
import { formatMexicanPhoneNumberForWebhook } from '@/lib/utils';
import { storeVerificationCode } from '@/app/api/user-profile/route';

const VERIFICATION_WEBHOOK_URL = 'https://n8n.reptitalz.cloud/webhook/3c0e3d8f-a4e3-441f-9164-14491310bdba';

interface VerificationPayload {
  phoneNumber: string;
  verificationCode: string;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
