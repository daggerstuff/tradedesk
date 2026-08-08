import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const quote = await queryOne(
    `SELECT q.*, c.name as customer_name, c.email as customer_email
     FROM quotes q
     LEFT JOIN customers c ON q.customer_id = c.id
     WHERE q.id = $1 AND q.user_id = $2`,
    [id, session.userId]
  );

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await query(
    `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY id`,
    [id]
  );

  return NextResponse.json({ quote, items });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { customerId, quoteNumber, issueDate, expiryDate, items, notes, taxRate, status } = body;

  const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
    sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate || 0) / 100;
  const total = subtotal + taxAmount;

  await query(
    `UPDATE quotes SET customer_id=$1, quote_number=$2, issue_date=$3, expiry_date=$4,
     subtotal=$5, tax_rate=$6, tax_amount=$7, total=$8, notes=$9, status=$10, updated_at=NOW()
     WHERE id=$11 AND user_id=$12`,
    [customerId, quoteNumber, issueDate, expiryDate || null, subtotal, taxRate || 0, taxAmount, total, notes || null, status || 'draft', id, session.userId]
  );

  await query(`DELETE FROM quote_items WHERE quote_id = $1`, [id]);

  for (const item of items) {
    const { generateId } = await import('@/lib/auth');
    const itemId = generateId('qi');
    await query(
      `INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [itemId, id, item.description, item.quantity, item.unitPrice, item.quantity * item.unitPrice]
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await query(`DELETE FROM quote_items WHERE quote_id = $1`, [id]);
  await query(`DELETE FROM quotes WHERE id = $1 AND user_id = $2`, [id, session.userId]);

  return NextResponse.json({ success: true });
}
