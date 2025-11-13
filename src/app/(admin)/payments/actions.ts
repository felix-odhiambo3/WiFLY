'use server';

import { db, Payment, Plan } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PaymentSchema = z.object({
  mac_address: z
    .string()
    .regex(
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      'Invalid MAC address format.'
    ),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  plan_name: z.string().min(1, 'Plan name is required.'),
});

type ActionResponse = {
  success: boolean;
  message: string;
  errors?: z.ZodIssue[];
};

export async function getPayments(): Promise<Payment[]> {
  return db.payment.findMany();
}

export async function getPlans(): Promise<Plan[]> {
  return db.plan.findMany();
}


export async function createManualPaymentAction(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const validatedFields = PaymentSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.issues,
    };
  }

  try {
    await db.payment.create({
      ...validatedFields.data,
      transaction_id: `manual_${Date.now()}`,
      payment_method: 'Manual',
    });
    revalidatePath('/payments');
    return { success: true, message: 'Manual payment added successfully.' };
  } catch (error) {
    console.error('Error creating manual payment:', error);
    return { success: false, message: 'Failed to add manual payment.' };
  }
}

export async function issueRefundAction(id: number): Promise<ActionResponse> {
  try {
    await db.payment.update(id, { status: 'Refunded' });
    revalidatePath('/payments');
    return { success: true, message: 'Payment has been marked as refunded.' };
  } catch (error) {
    console.error(`Error issuing refund for payment ${id}:`, error);
    return { success: false, message: 'Failed to issue refund.' };
  }
}

export async function deletePaymentAction(id: number): Promise<ActionResponse> {
  try {
    await db.payment.delete(id);
    revalidatePath('/payments');
    return { success: true, message: 'Payment record deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting payment ${id}:`, error);
    return { success: false, message: 'Failed to delete payment record.' };
  }
}
