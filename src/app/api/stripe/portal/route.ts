import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createBillingPortalSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscription } = await req.json();

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
  }

  try {
    const portalUrl = await createBillingPortalSession(
      subscription.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
    );

    return NextResponse.json({ url: portalUrl });
  } catch (err) {
    console.error('Portal error:', err);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
