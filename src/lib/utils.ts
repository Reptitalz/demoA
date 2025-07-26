
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to convert VAPID public key string to a Uint8Array
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Formats a Mexican phone number to include a '1' after the country code.
 * E.g., from "+5233..." to "+52133...".
 * @param phoneNumber The phone number to format.
 * @returns The formatted phone number.
 */
export function formatMexicanPhoneNumberForWebhook(phoneNumber: string): string {
  if (typeof phoneNumber !== 'string') return phoneNumber;
  
  // Remove non-digit characters except for the leading '+'
  const cleanedNumber = phoneNumber.replace(/[^+\d]/g, '');

  // Check if it's a Mexican number that needs the '1'
  if (cleanedNumber.startsWith('+52') && !cleanedNumber.startsWith('+521')) {
    // Insert '1' after '+52'
    return `+521${cleanedNumber.substring(3)}`;
  }
  
  return cleanedNumber;
}
