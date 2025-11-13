


'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { createRadiusUserForVoucher, createRadiusUserForPayment, deleteRadiusUser } from '@/lib/radius';
import { createCheckoutSession, claimPaymentSession, processRefund } from '@/lib/payments';
import { sendVoucherSMS, formatPhoneNumber, isValidKenyanNumber } from '@/lib/sms';
import { addLog } from '@/lib/logger';

const RedeemVoucherSchema = z.object({
  code: z.string().min(3, 'Voucher code is too short.'),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address.'),
});

const CreateCheckoutSchema = z.object({
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address.'),
  planId: z.string().optional(), // Optional plan selection
  phoneNumber: z.string().min(10, 'Phone number is required.').refine((val) => {
    // Validate Kenyan phone number format using the new normalization function
    try {
      const { normalizeKenyanNumber } = require('@/lib/utils');
      normalizeKenyanNumber(val);
      return true;
    } catch {
      return false;
    }
  }, 'Please enter a valid Safaricom or Airtel number starting with 0 or +254.'),
});

const CreateVoucherSchema = z.object({
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute.'),
  phoneNumber: z.string().optional(),
  quantity: z.number().min(1, 'Must create at least 1 voucher.').max(100, 'Cannot create more than 100 vouchers at once.'),
});

const ProcessRefundSchema = z.object({
  paymentId: z.number().positive('Invalid payment ID.'),
  reason: z.string().min(1, 'Refund reason is required.'),
});

type ActionResponse = {
  success: boolean;
  message: string;
  token?: string;
  redirectUrl?: string;
};

export async function redeemVoucherAction(prevState: ActionResponse, formData: FormData): Promise<ActionResponse> {
  const validatedFields = RedeemVoucherSchema.safeParse({
    code: formData.get('code'),
    macAddress: formData.get('macAddress'),
  });

  if (!validatedFields.success) {
    const message = validatedFields.error.errors[0].message;
    addLog({ level: 'WARN', source: 'VoucherService', message, reference: formData.get('macAddress') as string });
    return { success: false, message };
  }

  const { code, macAddress } = validatedFields.data;
  addLog({ level: 'INFO', source: 'VoucherService', message: `Attempting to redeem voucher: ${code}`, reference: macAddress });

  try {
    const voucher = await db.voucher.findUnique({ code });

    if (!voucher) {
      addLog({ level: 'WARN', source: 'VoucherService', message: `Voucher not found: ${code}`, reference: macAddress });
      return { success: false, message: 'Voucher not found.' };
    }
    if (voucher.is_used) {
      addLog({ level: 'WARN', source: 'VoucherService', message: `Voucher already used: ${code}`, reference: macAddress });
      return { success: false, message: 'This voucher has already been used.' };
    }

    // Mark voucher as used
    await db.voucher.update({
      where: { id: voucher.id },
      data: { is_used: true, used_at: new Date(), used_by_mac: macAddress },
    });

    // Create RADIUS user for authentication
    const radiusUser = await createRadiusUserForVoucher(macAddress, voucher.duration_minutes);

    // Create user session record
    await db.userSession.create({
      mac: macAddress,
      plan: `Voucher (${voucher.duration_minutes} min)`,
      startTime: new Date(),
      expiryTime: new Date(Date.now() + voucher.duration_minutes * 60 * 1000),
    });

    addLog({ level: 'SUCCESS', source: 'VoucherService', message: `Voucher redeemed successfully: ${code}`, reference: macAddress });

    return {
      success: true,
      message: 'Voucher redeemed successfully!',
      token: `${radiusUser.username}:${radiusUser.password}`, // Return RADIUS credentials
    };
  } catch (error) {
    console.error('Error redeeming voucher:', error);
    addLog({ level: 'ERROR', source: 'VoucherService', message: `Internal error redeeming voucher: ${code}`, reference: macAddress });
    return { success: false, message: 'An internal error occurred.' };
  }
}

export async function createCheckoutSessionAction(prevState: ActionResponse, formData: FormData): Promise<ActionResponse> {
  const validatedFields = CreateCheckoutSchema.safeParse({
    macAddress: formData.get('macAddress'),
    planId: formData.get('planId'),
    phoneNumber: formData.get('phoneNumber'),
  });

  if (!validatedFields.success) {
    const message = validatedFields.error.errors[0].message;
    addLog({ level: 'WARN', source: 'PaymentService', message, reference: formData.get('macAddress') as string });
    return { success: false, message };
  }

  const { macAddress, planId, phoneNumber } = validatedFields.data;

  try {
    // Determine amount based on plan (you could fetch from db.plan)
    let amount = 500; // Default 24 hours
    let planName = '24 Hour Access';

    if (planId) {
      // In a real app, you'd fetch plan details from database
      switch (planId) {
        case 'plan_1': // 1 Hour
          amount = 50;
          planName = '1 Hour Access';
          break;
        case 'plan_2': // 12 Hours
          amount = 250;
          planName = '12 Hour Access';
          break;
        case 'plan_3': // 24 Hours
          amount = 500;
          planName = '24 Hour Access';
          break;
      }
    }

    const redirectUrl = await createCheckoutSession(macAddress, amount, planName, phoneNumber);
    return { success: true, message: 'Redirecting to IntaSend payment...', redirectUrl };
  } catch (error) {
    console.error('Payment Provider error:', error);
    const message = error instanceof Error ? error.message : 'Could not connect to payment provider.';
    addLog({ level: 'ERROR', source: 'PaymentService', message: 'Error creating checkout session', reference: macAddress });
    return { success: false, message };
  }
}
export async function claimPaymentSessionAction(paymentRef: string, macAddress: string): Promise<ActionResponse> {
  try {
    const token = await claimPaymentSession(paymentRef, macAddress);

    // Get payment details to create RADIUS user
    const payment = await db.payment.findUnique({ transaction_id: paymentRef });
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Create RADIUS user for authentication
    const radiusUser = await createRadiusUserForPayment(macAddress, payment.plan_name);

    // Create user session record
    await db.userSession.create({
      mac: macAddress,
      plan: payment.plan_name,
      startTime: new Date(),
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours, could be calculated from plan
    });

    addLog({ level: 'SUCCESS', source: 'PaymentService', message: 'Payment claimed and RADIUS user created', reference: paymentRef });

    return {
      success: true,
      message: 'Payment confirmed!',
      token: `${radiusUser.username}:${radiusUser.password}`, // Return RADIUS credentials
    };
  } catch (error) {
    console.error('Error claiming payment session:', error);
    const message = error instanceof Error ? error.message : 'Could not verify payment.';
    addLog({ level: 'ERROR', source: 'PaymentService', message, reference: paymentRef });
    return { success: false, message };
  }
}

export async function createVoucherAction(prevState: ActionResponse, formData: FormData): Promise<ActionResponse> {
  const validatedFields = CreateVoucherSchema.safeParse({
    duration_minutes: parseInt(formData.get('duration_minutes') as string),
    phoneNumber: formData.get('phoneNumber') as string || undefined,
    quantity: parseInt(formData.get('quantity') as string) || 1,
  });

  if (!validatedFields.success) {
    const message = validatedFields.error.errors[0].message;
    return { success: false, message };
  }

  const { duration_minutes, phoneNumber, quantity } = validatedFields.data;

  try {
    const vouchers = [];

    for (let i = 0; i < quantity; i++) {
      // Generate unique voucher code
      const code = `WIFLY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const voucher = await db.voucher.create({
        code,
        duration_minutes,
        sms_recipient: phoneNumber,
      });

      vouchers.push(voucher);

      // Send SMS if phone number provided
      if (phoneNumber && isValidKenyanNumber(phoneNumber)) {
        try {
          const formattedNumber = formatPhoneNumber(phoneNumber);
          const durationText = duration_minutes >= 60
            ? `${Math.floor(duration_minutes / 60)} hour${Math.floor(duration_minutes / 60) > 1 ? 's' : ''}`
            : `${duration_minutes} minutes`;

          await sendVoucherSMS(formattedNumber, code, durationText);
          await db.voucher.update({ where: { id: voucher.id }, data: { sms_sent: true } });
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          // Continue without failing the voucher creation
        }
      }
    }

    addLog({ level: 'SUCCESS', source: 'VoucherService', message: `Created ${quantity} voucher(s)`, reference: phoneNumber || 'No SMS' });
    return { success: true, message: `Successfully created ${quantity} voucher(s)!` };
  } catch (error) {
    console.error('Error creating vouchers:', error);
    addLog({ level: 'ERROR', source: 'VoucherService', message: 'Failed to create vouchers' });
    return { success: false, message: 'Failed to create vouchers.' };
  }
}

export async function processRefundAction(prevState: ActionResponse, formData: FormData): Promise<ActionResponse> {
  const validatedFields = ProcessRefundSchema.safeParse({
    paymentId: parseInt(formData.get('paymentId') as string),
    reason: formData.get('reason') as string,
  });

  if (!validatedFields.success) {
    const message = validatedFields.error.errors[0].message;
    return { success: false, message };
  }

  const { paymentId, reason } = validatedFields.data;

  try {
    const success = await processRefund(paymentId, reason);

    if (success) {
      addLog({ level: 'SUCCESS', source: 'PaymentService', message: `Refund processed for payment ${paymentId}`, reference: reason });
      return { success: true, message: 'Refund processed successfully!' };
    } else {
      return { success: false, message: 'Refund failed.' };
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    const message = error instanceof Error ? error.message : 'Refund processing failed.';
    addLog({ level: 'ERROR', source: 'PaymentService', message, reference: paymentId.toString() });
    return { success: false, message };
  }
}
