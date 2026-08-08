import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/lib/db';
import { createInvoiceCheckoutSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const { shareToken } = await req.json();

  if (!shareToken) return NextResponse.json({ error: 'Share token required' }, { status: 400 });

  const invoice = await queryOne(`
    SELECT i.id, i.invoice_number, i.total, i.status, i.share_token,
           c.name as customer_name, c.email as customer_email
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.share_token = $1
  `, [shareToken]);

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (invoice.status === 'paid') return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tradedesk-mu-khaki.vercel.app';
  const successUrl = `${appUrl}/pay/${shareToken}?paid=1`;
  const cancelUrl = `${appUrl}/pay/${shareToken}`;

  try {
    const checkoutSession = await createInvoiceCheckoutSession(
      String(invoice.id),
      Number(invoice.total),
      String(invoice.customer_email || ''),
      String(invoice.customer_name || ''),
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('Invoice checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
