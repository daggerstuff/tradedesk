import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const invoices = await query(
    `SELECT i.*, c.name as customer_name, c.email as customer_email
     FROM invoices i
     LEFT JOIN customers c ON i.customer_id = c.id
     WHERE i.id = $1 AND i.user_id = $2`,
    [id, session.userId]
  );

  if (!invoices.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await query(
    `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at`,
    [id]
  );

  return NextResponse.json({ invoice: invoices[0], items });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { customerId, invoiceNumber, issueDate, dueDate, items, notes, taxRate, status } = body;

  const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
    sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate || 0) / 100;
  const total = subtotal + taxAmount;

  const result = await query(
    `UPDATE invoices
     SET customer_id = $1, invoice_number = $2, issue_date = $3, due_date = $4,
         subtotal = $5, tax_rate = $6, tax_amount = $7, total = $8, status = $9, notes = $10,
         updated_at = NOW()
     WHERE id = $11 AND user_id = $12
     RETURNING *`,
    [customerId, invoiceNumber, issueDate, dueDate, subtotal, taxRate || 0, taxAmount, total, status, notes || null, id, session.userId]
  );

  if (!result.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
  for (const item of items) {
    await query(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, item.description, item.quantity, item.unitPrice, item.quantity * item.unitPrice]
    );
  }

  return NextResponse.json({ invoice: result[0] });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
  const result = await query(
    'DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, session.userId]
  );

  if (!result.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
