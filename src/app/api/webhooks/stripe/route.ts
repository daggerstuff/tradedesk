import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    await handleWebhookEvent(body, signature);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
