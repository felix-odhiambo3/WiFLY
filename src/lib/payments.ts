// IntaSend payment integration for Kenya payments.
// This replaces the previous Stripe integration.

import { db } from './db';
import { createSessionToken } from './auth';
import { addLog } from './logger';
import { normalizeKenyanNumber } from './utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const INTASEND_PUBLIC_KEY = process.env.INTASEND_PUBLIC_KEY;
const INTASEND_SECRET_KEY = process.env.INTASEND_SECRET_KEY;

/**
 * Creates a checkout session with IntaSend.
 * @param macAddress - The device's MAC address.
 * @param amount - Amount in KES (Kenya Shillings).
 * @param planName - Name of the plan being purchased.
 * @param phoneNumber - The user's phone number for STK Push.
 * @returns A URL to redirect the user to for payment.
 */
export async function createCheckoutSession(macAddress: string, amount: number = 500, planName: string = '24 Hour Access', phoneNumber?: string): Promise<string> {
  if (!BASE_URL) {
    addLog({ level: 'ERROR', source: 'Payment', message: 'NEXT_PUBLIC_BASE_URL is not set.' });
    throw new Error('NEXT_PUBLIC_BASE_URL is not set.');
  }

  if (!INTASEND_PUBLIC_KEY || !INTASEND_SECRET_KEY) {
    addLog({ level: 'ERROR', source: 'Payment', message: 'IntaSend keys not configured.' });
    throw new Error('IntaSend payment provider not configured.');
  }

  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  addLog({ level: 'INFO', source: 'Payment', message: `Creating IntaSend checkout session ${invoiceId}`, reference: macAddress });

  // In a real implementation, you would make an API call to IntaSend to create a checkout session
  // For now, we'll simulate the checkout URL
  const checkoutUrl = `https://sandbox.intasend.com/checkout/${invoiceId}?amount=${amount}&currency=KES&plan=${encodeURIComponent(planName)}`;

  // Store the payment record in our database with normalized phone number
  const normalizedPhone = phoneNumber ? normalizeKenyanNumber(phoneNumber) : null;
  await db.payment.create({
    transaction_id: invoiceId,
    amount: amount,
    plan_name: planName,
    payment_method: 'IntaSend',
    mac_address: macAddress,
    phone_number: normalizedPhone,
  });

  // Attempt STK Push if phone number provided
  if (phoneNumber) {
    try {
      // Normalize the phone number to E.164 format
      const normalizedNumber = normalizeKenyanNumber(phoneNumber);
      addLog({ level: 'INFO', source: 'Payment', message: `Attempting STK Push to ${normalizedNumber}`, reference: invoiceId });

      // Call IntaSend's STK Push API
      const stkResponse = await fetch('https://sandbox.intasend.com/api/v2/checkout/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INTASEND_SECRET_KEY}`,
        },
        body: JSON.stringify({
          phone_number: normalizedNumber,
          amount: amount,
          currency: 'KES',
          invoice_id: invoiceId,
          api_ref: `stk_${Date.now()}`,
        }),
      });

      const stkData = await stkResponse.json();

      if (stkResponse.ok && stkData.status === 'success') {
        addLog({ level: 'SUCCESS', source: 'Payment', message: 'STK Push initiated successfully', reference: invoiceId });
        return `${BASE_URL}/confirm-payment?payment_ref=${invoiceId}&mac=${macAddress}&stk=success`;
      } else {
        // STK Push failed, fall back to offline payment instructions
        addLog({ level: 'WARN', source: 'Payment', message: `STK Push failed: ${stkData.message || 'Unknown error'}`, reference: invoiceId });

        // Send offline payment SMS using normalized number
        const { sendVoucherSMS } = await import('./sms');

        try {
          await sendVoucherSMS(
            normalizedNumber,
            `OFFLINE-${invoiceId}`,
            `Pay KES ${amount} to Till 123456 Ref: ${invoiceId.substring(0, 8).toUpperCase()}`
          );
          addLog({ level: 'INFO', source: 'Payment', message: 'Offline payment SMS sent', reference: invoiceId });
        } catch (smsError) {
          addLog({ level: 'ERROR', source: 'Payment', message: 'Failed to send offline payment SMS', reference: invoiceId });
        }

        return `${BASE_URL}/confirm-payment?payment_ref=${invoiceId}&mac=${macAddress}&stk=failed`;
      }
    } catch (stkError) {
      addLog({ level: 'ERROR', source: 'Payment', message: `STK Push API error: ${stkError.message}`, reference: invoiceId });
      // Continue with fallback
    }
  }

  // For RADIUS integration, we'll create RADIUS user after payment completion
  // The webhook will handle creating the RADIUS user
  return `${BASE_URL}/confirm-payment?payment_ref=${invoiceId}&mac=${macAddress}`;
}

/**
 * Claims a session after a successful IntaSend payment.
 * @param paymentRef - The invoice ID from IntaSend.
 * @param macAddress - The device's MAC address.
 * @returns A session token.
 */
export async function claimPaymentSession(paymentRef: string, macAddress: string): Promise<string> {
  addLog({ level: 'INFO', source: 'Payment', message: `Attempting to claim payment ref: ${paymentRef}`, reference: macAddress });

  const payment = await db.payment.findUnique({ transaction_id: paymentRef });

  if (!payment || payment.mac_address !== macAddress) {
    addLog({ level: 'WARN', source: 'Payment', message: 'Invalid payment reference during claim.', reference: paymentRef });
    throw new Error('Invalid payment reference.');
  }

  if (payment.status === 'Completed') {
      addLog({ level: 'INFO', source: 'Payment', message: 'Payment already claimed.', reference: paymentRef });
  } else {
    // Mark payment as completed
    await db.payment.update(payment.id, { status: 'Completed' });
    addLog({ level: 'SUCCESS', source: 'Payment', message: 'Payment status updated to completed.', reference: paymentRef });
  }

  // Determine duration based on plan (you might want to make this more dynamic)
  let durationMinutes = 1440; // Default 24 hours
  if (payment.plan_name.includes('1 Hour')) {
    durationMinutes = 60;
  } else if (payment.plan_name.includes('12 Hour')) {
    durationMinutes = 720;
  }

  // For RADIUS integration, return RADIUS credentials instead of JWT token
  const { createRadiusUserForPayment } = await import('./radius');
  const credentials = await createRadiusUserForPayment(macAddress, payment.plan_name);

  addLog({ level: 'SUCCESS', source: 'Auth', message: 'RADIUS user created for paid access.', reference: macAddress });

  return `${credentials.username}:${credentials.password}`;
}

/**
 * Processes a refund via IntaSend API.
 * @param paymentId - The payment ID in our database.
 * @param reason - Reason for the refund.
 * @returns Success status.
 */
export async function processRefund(paymentId: number, reason: string = 'Admin requested'): Promise<boolean> {
  addLog({ level: 'INFO', source: 'Payment', message: `Processing refund for payment ID: ${paymentId}`, reference: reason });

  const payment = await db.payment.findUnique({ transaction_id: paymentId.toString() });
  if (!payment) {
    addLog({ level: 'ERROR', source: 'Payment', message: 'Payment not found for refund.', reference: paymentId.toString() });
    throw new Error('Payment not found.');
  }

  if (payment.status === 'Refunded') {
    addLog({ level: 'WARN', source: 'Payment', message: 'Payment already refunded.', reference: paymentId.toString() });
    return true;
  }

  // In a real implementation, you would call IntaSend's refund API
  // For now, we'll simulate the refund
  await db.payment.update(payment.id, { status: 'Refunded', refund_reason: reason });

  addLog({ level: 'SUCCESS', source: 'Payment', message: 'Refund processed successfully.', reference: paymentId.toString() });
  return true;
}
