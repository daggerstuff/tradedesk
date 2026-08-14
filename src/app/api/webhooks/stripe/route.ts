import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { query, queryOne } from '@/lib/db';
import { sendPushNotification } from '@/lib/push';
import { checkAndProcessReferralRewards } from '@/lib/referral-rewards';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    const event = constructWebhookEvent(Buffer.from(body), signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { customer?: string; client_reference_id?: string; metadata?: { plan?: string; invoiceId?: string; type?: string } };
        const metadata = session.metadata || {};

        if (metadata.type === 'invoice_payment' && metadata.invoiceId) {
          const amountTotal = (event.data.object as { amount_total?: number }).amount_total || 0;
          const amountReceived = amountTotal / 100;
          const paymentMethod = 'stripe';

          await queryOne(
            `INSERT INTO payments (id, invoice_id, amount, method, date, reference)
             VALUES (gen_random_uuid(), $1, $2, $3, NOW(), $4)
             ON CONFLICT DO NOTHING`,
            [metadata.invoiceId, amountReceived, paymentMethod, (session as { id?: string }).id || 'stripe']
          );

          const totalPaidResult = await queryOne(
            `SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1`,
            [metadata.invoiceId]
          );
          const totalPaid = totalPaidResult?.total_paid || 0;

          const invoice = await queryOne<{ total: string; user_id: string; invoice_number: string }>(
            'SELECT total, user_id, invoice_number FROM invoices WHERE id = $1',
            [metadata.invoiceId]
          );
          if (invoice && totalPaid >= invoice.total) {
            await queryOne('UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2', ['paid', metadata.invoiceId]);
          }

          if (invoice?.user_id) {
            await sendPushNotification(
              invoice.user_id,
              'Stripe Payment Received',
              `$${amountReceived.toFixed(2)} for Invoice #${invoice.invoice_number}`,
              { type: 'stripe_payment', invoiceId: metadata.invoiceId }
            );
          }

          break;
        }

        const plan = metadata.plan || 'free';
        const customerId = session.customer || '';
        const userId = session.client_reference_id || '';

        if (userId) {
          await queryOne(
            `UPDATE subscriptions SET plan = $1, status = 'active', stripe_customer_id = $2, updated_at = NOW() WHERE user_id = $3`,
            [plan, customerId, userId]
          );
          
          // Process referral rewards when user subscribes to paid plan
          if (plan !== 'free') {
            await checkAndProcessReferralRewards(userId);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as { customer?: string };
        const customerId = subscription.customer || '';
        await query(
          `UPDATE subscriptions SET plan = 'free', status = 'canceled', updated_at = NOW() WHERE stripe_customer_id = $1`,
          [customerId]
        );
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as { customer?: string };
        const customerId = invoice.customer || '';
        await query(
          `UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE stripe_customer_id = $1`,
          [customerId]
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
