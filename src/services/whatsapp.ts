/**
 * Represents a phone number to send messages to.
 */
export interface PhoneNumber {
  /**
   * The phone number.
   */
  phoneNumber: string;
}

/**
 * Asynchronously sends a WhatsApp message to a phone number.
 *
 * @param phoneNumber The phone number to send the message to.
 * @param message The message to send.
 * @returns A promise that resolves to void.
 */
export async function sendMessage(phoneNumber: PhoneNumber, message: string): Promise<void> {
  // TODO: Implement this by calling an API.
  console.log(`Sending message: ${message} to ${phoneNumber.phoneNumber}`);
}
