import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a Kenyan phone number to the international E.164 format (+254XXXXXXXX).
 * @param number - The phone number to normalize.
 * @returns The normalized phone number in E.164 format.
 * @throws Error if the number is not a valid Kenyan format.
 */
export function normalizeKenyanNumber(number: string): string {
  let cleaned = number.replace(/\s+/g, '');
  if (cleaned.startsWith('0')) return '+254' + cleaned.slice(1);
  if (cleaned.startsWith('254')) return '+' + cleaned;
  if (cleaned.startsWith('+254')) return cleaned;
  throw new Error('Invalid Kenyan phone number format');
}
