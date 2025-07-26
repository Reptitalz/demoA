
"use server";

import axios from 'axios';
import { formatMexicanPhoneNumberForWebhook } from '@/lib/utils';

const VERIFICATION_WEBHOOK_URL = 'https://n8n.reptitalz.cloud/webhook/3c0e3d8f-a4e3-441f-9164-14491310bdba';

interface VerificationPayload {
  phoneNumber: string;
  verificationCode: string;
}

export async function sendVerificationCodeWebhook(
  phoneNumber: string,
  verificationCode: string
): Promise<void> {
  if (!VERIFICATION_WEBHOOK_URL) {
    console.warn('VERIFICATION_WEBHOOK_URL is not configured. Skipping sending verification webhook.');
    return;
  }
  
  const formattedPhoneNumber = formatMexicanPhoneNumberForWebhook(phoneNumber);

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
  }
}
