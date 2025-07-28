
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
