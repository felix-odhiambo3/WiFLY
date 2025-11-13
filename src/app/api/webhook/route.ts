import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { addLog } from '@/lib/logger';

// IntaSend webhook endpoint for payment confirmations.
// In production, you should verify the webhook signature using your secret key.

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    addLog({ level: 'INFO', source: 'Webhook', message: `Received IntaSend webhook payload.`, reference: 'POST /api/webhook' });

    // IntaSend webhook payload structure
    // { "invoice": { "invoice_id": "...", "state": "COMPLETE", "provider": "MPESA", ... }, ... }
    const invoiceId = payload?.invoice?.invoice_id;
    const state = payload?.invoice?.state;
    const amount = payload?.invoice?.amount;
    const provider = payload?.invoice?.provider;

    if (state === 'COMPLETE' && invoiceId) {
      addLog({ level: 'SUCCESS', source: 'Webhook', message: `Processing completed IntaSend payment for invoice ID: ${invoiceId}`, reference: `${provider} - ${amount}` });

      const existingPayment = await db.payment.findUnique({ transaction_id: invoiceId });

      if (existingPayment) {
        if (existingPayment.status === 'Completed') {
           addLog({ level: 'INFO', source: 'Webhook', message: `Payment for ${invoiceId} already processed.` });
          return NextResponse.json({ received: true, message: 'Already processed.' });
        } else {
          // Update status to completed
          await db.payment.update(existingPayment.id, { status: 'Completed' });
          addLog({ level: 'SUCCESS', source: 'Webhook', message: `Updated payment status to completed for ${invoiceId}.` });

          // Create RADIUS user for the completed payment
          try {
            const { createRadiusUserForPayment } = await import('@/lib/radius');
            const radiusUser = await createRadiusUserForPayment(existingPayment.mac_address, existingPayment.plan_name);

            // Create user session record
            await db.userSession.create({
              mac: existingPayment.mac_address,
              plan: existingPayment.plan_name,
              startTime: new Date(),
              expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours
            });

            addLog({ level: 'SUCCESS', source: 'Webhook', message: `RADIUS user created for payment ${invoiceId}`, reference: existingPayment.mac_address });

            // For offline payments, send voucher SMS if we have phone number
            if (invoiceId.startsWith('inv_') && existingPayment.mac_address) {
              try {
                const { sendVoucherSMS } = await import('@/lib/sms');
                const voucherCode = `AUTO-${invoiceId.substring(4, 12).toUpperCase()}`;

                // Create a voucher record for the payment
                await db.voucher.create({
                  code: voucherCode,
                  duration_minutes: 1440, // 24 hours
                  sms_recipient: undefined, // We don't have phone number in webhook
                });

                // Note: We can't send SMS here because we don't have the phone number
                // The voucher will be available for manual redemption
                addLog({ level: 'INFO', source: 'Webhook', message: `Voucher created for offline payment: ${voucherCode}`, reference: invoiceId });
              } catch (voucherError) {
                addLog({ level: 'ERROR', source: 'Webhook', message: 'Failed to create voucher for offline payment', reference: invoiceId });
              }
            }
          } catch (radiusError) {
            addLog({ level: 'ERROR', source: 'Webhook', message: 'Failed to create RADIUS user for payment', reference: invoiceId });
          }
        }
      } else {
        addLog({ level: 'WARN', source: 'Webhook', message: `Webhook received for payment not initiated via our checkout: ${invoiceId}` });
        // You might create a new record here if your flow allows it.
      }
    } else if (state === 'FAILED' && invoiceId) {
      addLog({ level: 'WARN', source: 'Webhook', message: `Payment failed for invoice ID: ${invoiceId}`, reference: provider });

      const existingPayment = await db.payment.findUnique({ transaction_id: invoiceId });
      if (existingPayment && existingPayment.status === 'Pending') {
        // Mark as failed/cancelled
        await db.payment.update(existingPayment.id, { status: 'Failed' });
        addLog({ level: 'WARN', source: 'Webhook', message: `Marked payment ${invoiceId} as failed.` });
      }
    }

    addLog({ level: 'INFO', source: 'Webhook', message: `Webhook received with state: ${state} for invoice: ${invoiceId || 'unknown'}` });

    return NextResponse.json({ received: true });

  } catch (error: any) {
    addLog({ level: 'ERROR', source: 'Webhook', message: 'Error processing IntaSend webhook: ' + error.message, reference: 'POST /api/webhook' });
    return NextResponse.json({ error: 'Failed to process webhook.' }, { status: 500 });
  }
}
