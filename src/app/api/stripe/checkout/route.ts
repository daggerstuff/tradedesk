import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createCheckoutSession, createStripeCustomer, PLANS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId, couponCode } = await req.json();
  const plan = PLANS[planId as keyof typeof PLANS];

  if (!plan || plan.priceId === null) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  try {
    const customer = await createStripeCustomer(session.email);
    const checkoutSession = await createCheckoutSession(
      customer.id,
      plan.priceId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?upgraded=1`,
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      couponCode // promotion codes enabled when provided
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
