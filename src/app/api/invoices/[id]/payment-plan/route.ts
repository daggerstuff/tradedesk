import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import stripe from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    return payload?.userId ?? null;
  }
  const session = await getSession();
  return session?.userId ?? null;
}

// Create a payment plan for an invoice
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: invoiceId } = await params;
  const body = await req.json();
  const installmentCount = Math.min(Math.max(body.installments || 2, 2), 4);

  // Fetch invoice
  const invoice = await queryOne<{
    id: string; user_id: string; invoice_number: string; total: number;
    customer_id: string; status: string;
  }>(
    `SELECT id, user_id, invoice_number, total, customer_id, status FROM invoices WHERE id = $1 AND user_id = $2`,
    [invoiceId, userId]
  );

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.total <= 0) {
    return NextResponse.json({ error: 'Invoice amount must be greater than 0' }, { status: 400 });
  }

  // Fetch customer
  const customer = await queryOne<{ name: string; email: string }>(
    `SELECT name, email FROM customers WHERE id = $1`,
    [invoice.customer_id]
  );

  // Calculate installments
  const baseAmount = Math.floor((invoice.total / installmentCount) * 100) / 100;
  const remainder = Math.round((invoice.total - baseAmount * (installmentCount - 1)) * 100) / 100;

  const installments: { amount: number; dueOffsetDays: number }[] = [];
  for (let i = 0; i < installmentCount; i++) {
    installments.push({
      amount: i === installmentCount - 1 ? remainder : baseAmount,
      dueOffsetDays: i * 30,
    });
  }

  // Create payment plan record
  const planId = crypto.randomUUID();
  await query(
    `INSERT INTO payment_plans (id, user_id, invoice_id, total_amount, installment_count, installments, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
    [planId, userId, invoiceId, invoice.total, installmentCount, JSON.stringify(installments)]
  );

  // Create Stripe payment intent for first installment
  const firstInstallment = installments[0];
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(firstInstallment.amount * 100),
    currency: 'usd',
    customer: customer?.email ? undefined : undefined,
    receipt_email: customer?.email,
    metadata: {
      invoiceId,
      planId,
      installment: '1',
      totalInstallments: String(installmentCount),
      type: 'payment_plan',
    },
  });

  await query(
    `UPDATE payment_plans SET stripe_payment_intent_id = $1 WHERE id = $2`,
    [paymentIntent.id, planId]
  );

  await query(
    `UPDATE invoices SET payment_plan_id = $1, dunning_status = 'resolved' WHERE id = $2`,
    [planId, invoiceId]
  );

  return NextResponse.json({
    planId,
    installmentCount,
    installments,
    clientSecret: paymentIntent.client_secret,
  });
}

// Get payment plan status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: invoiceId } = await params;

  const plan = await queryOne<{
    id: string; total_amount: number; installment_count: number;
    installments: string; status: string; stripe_payment_intent_id: string;
  }>(
    `SELECT id, total_amount, installment_count, installments, status, stripe_payment_intent_id
     FROM payment_plans WHERE invoice_id = $1 AND user_id = $2`,
    [invoiceId, userId]
  );

  if (!plan) {
    return NextResponse.json({ error: 'No payment plan found' }, { status: 404 });
  }

  return NextResponse.json({
    planId: plan.id,
    totalAmount: plan.total_amount,
    installmentCount: plan.installment_count,
    installments: plan.installments,
    status: plan.status,
  });
}

// Cancel a payment plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: invoiceId } = await params;

  const plan = await queryOne<{ id: string; stripe_payment_intent_id: string }>(
    `SELECT id, stripe_payment_intent_id FROM payment_plans WHERE invoice_id = $1 AND user_id = $2`,
    [invoiceId, userId]
  );

  if (!plan) {
    return NextResponse.json({ error: 'No payment plan found' }, { status: 404 });
  }

  // Cancel Stripe payment intent if exists
  if (plan.stripe_payment_intent_id) {
    try {
      await stripe.paymentIntents.cancel(plan.stripe_payment_intent_id);
    } catch {
      // already cancelled or completed
    }
  }

  await query(
    `UPDATE payment_plans SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [plan.id]
  );

  await query(
    `UPDATE invoices SET payment_plan_id = NULL, dunning_status = 'overdue_14' WHERE id = $1`,
    [invoiceId]
  );

  return NextResponse.json({ success: true });
}
