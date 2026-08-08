import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { query, queryOne } from '@/lib/db';

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
        const session = event.data.object as { customer?: string; client_reference_id?: string; metadata?: { plan?: string } };
        const plan = session.metadata?.plan || 'free';
        const customerId = session.customer || '';
        const userId = session.client_reference_id || '';

        if (userId) {
          await queryOne(
            `UPDATE subscriptions SET plan = $1, status = 'active', stripe_customer_id = $2, updated_at = NOW() WHERE user_id = $3`,
            [plan, customerId, userId]
          );
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
