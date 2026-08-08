import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateId } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify invoice belongs to user
  const invoice = await queryOne(
    `SELECT id, total FROM invoices WHERE id = $1 AND user_id = $2`,
    [id, session.userId]
  );
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const payments = await query(
    `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY date DESC`,
    [id]
  );

  const totalPaid = payments.reduce((sum: number, p: { amount: string | number }) =>
    sum + parseFloat(String(p.amount)), 0);

  return NextResponse.json({ payments, totalPaid, invoiceTotal: invoice.total });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { amount, method, date, reference } = body;

  if (!amount || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const invoice = await queryOne<{ total: string; status: string }>(
    `SELECT total, status FROM invoices WHERE id = $1 AND user_id = $2`,
    [id, session.userId]
  );
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const paymentId = generateId('pay');
  await query(
    `INSERT INTO payments (id, invoice_id, amount, method, date, reference)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [paymentId, id, amount, method || 'cash', date, reference || null]
  );

  // Check if invoice is now fully paid
  const payments = await query(`SELECT amount FROM payments WHERE invoice_id = $1`, [id]);
  const totalPaid = payments.reduce((sum: number, p: { amount: string }) =>
    sum + parseFloat(p.amount), 0);

  if (parseFloat(totalPaid.toString()) >= parseFloat(invoice.total)) {
    await query(`UPDATE invoices SET status = 'paid' WHERE id = $1`, [id]);
  } else if (invoice.status === 'draft') {
    await query(`UPDATE invoices SET status = 'sent' WHERE id = $1`, [id]);
  }

  return NextResponse.json({ payment: { id: paymentId }, totalPaid }, { status: 201 });
}
