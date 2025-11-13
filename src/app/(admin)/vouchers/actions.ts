'use server';

import { db, Voucher } from '@/lib/db';
import { revalidatePath } from 'next/cache';

function generateVoucherCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result.slice(0, 4) + '-' + result.slice(4);
}

export async function generateVouchersAction(
    prevState: { success: boolean; message: string },
    formData: FormData
): Promise<{ success: boolean; message: string, count?: number }> {
    const quantity = parseInt(formData.get('quantity') as string, 10);
    const duration = parseInt(formData.get('plan') as string, 10);

    if (isNaN(quantity) || isNaN(duration) || quantity < 1) {
        return { success: false, message: "Invalid quantity or duration." };
    }

    try {
        for (let i = 0; i < quantity; i++) {
            await db.voucher.create({
                code: generateVoucherCode(),
                duration_minutes: duration,
            });
        }
        revalidatePath('/vouchers');
        return { success: true, message: `${quantity} vouchers created successfully.`, count: quantity };
    } catch (error) {
        console.error('Error generating vouchers:', error);
        return { success: false, message: "An internal error occurred while generating vouchers." };
    }
}

export async function deleteVoucherAction(id: number): Promise<{ success: boolean; message: string }> {
    try {
        await db.voucher.delete(id);
        revalidatePath('/vouchers');
        return { success: true, message: 'Voucher deleted successfully.' };
    } catch (error) {
        console.error(`Error deleting voucher ${id}:`, error);
        return { success: false, message: 'Failed to delete voucher.' };
    }
}

export async function getVouchers(): Promise<Voucher[]> {
    return db.voucher.findMany();
}
