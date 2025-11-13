import africastalking from 'africastalking';
import { normalizeKenyanNumber } from './utils';

const username = process.env.AFRICASTALKING_USERNAME;
const apiKey = process.env.AFRICASTALKING_API_KEY;

if (!username || !apiKey) {
  throw new Error('Africa\'s Talking credentials not configured. Please set AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY environment variables.');
}

const africasTalking = africastalking({
  apiKey,
  username,
});

const sms = (africasTalking as any).SMS;

/**
 * Validates if a phone number is a valid Kenyan number.
 * @param phoneNumber - The phone number to validate.
 * @returns True if valid Kenyan number, false otherwise.
 */
export function isValidKenyanNumber(phoneNumber: string): boolean {
  try {
    normalizeKenyanNumber(phoneNumber);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a phone number to the international format required by Africa's Talking.
 * @param phoneNumber - The phone number to format.
 * @returns The formatted phone number (e.g., +254712345678).
 */
export function formatPhoneNumber(phoneNumber: string): string {
  return normalizeKenyanNumber(phoneNumber);
}

/**
 * Sends a voucher code via SMS using Africa's Talking.
 * @param phoneNumber - The recipient's phone number.
 * @param voucherCode - The voucher code to send.
 * @param durationText - Human-readable duration (e.g., "24 hours").
 * @returns Promise resolving to the SMS send result.
 */
export async function sendVoucherSMS(phoneNumber: string, voucherCode: string, durationText: string): Promise<any> {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  const message = `WiFly Voucher: ${voucherCode}. Valid for ${durationText}. Redeem at our hotspot portal.`;

  try {
    const result = await sms.send({
      to: formattedNumber,
      message,
    });

    console.log('SMS sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw new Error('SMS delivery failed');
  }
}

/**
 * Sends an expiry warning SMS to a user.
 * @param phoneNumber - The recipient's phone number.
 * @param minutesLeft - Minutes remaining before expiry.
 * @returns Promise resolving to the SMS send result.
 */
export async function sendExpiryWarningSMS(phoneNumber: string, minutesLeft: number): Promise<any> {
  const formattedNumber = formatPhoneNumber(phoneNumber);

  let message: string;
  if (minutesLeft <= 60) {
    message = `WiFly: Your internet session expires in ${minutesLeft} minutes. Top up now to continue.`;
  } else {
    const hoursLeft = Math.floor(minutesLeft / 60);
    message = `WiFly: Your internet session expires in ${hoursLeft} hours. Top up now to continue.`;
  }

  try {
    const result = await sms.send({
      to: formattedNumber,
      message,
    });

    console.log('Expiry warning SMS sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send expiry warning SMS:', error);
    throw new Error('Expiry warning SMS delivery failed');
  }
}
