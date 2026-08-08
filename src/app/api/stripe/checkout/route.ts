import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createCheckoutSession, PLANS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await req.json();
  const plan = PLANS[planId as keyof typeof PLANS];

  if (!plan || plan.priceId === null) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  try {
    const checkoutUrl = await createCheckoutSession(
      session.userId,
      session.email,
      plan.priceId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?upgraded=1`,
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
