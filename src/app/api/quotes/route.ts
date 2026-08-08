import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateId } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const quotes = await query(
    `SELECT q.*, c.name as customer_name
     FROM quotes q
     LEFT JOIN customers c ON q.customer_id = c.id
     WHERE q.user_id = $1
     ORDER BY q.created_at DESC`,
    [session.userId]
  );

  return NextResponse.json({ quotes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { customerId, quoteNumber, issueDate, expiryDate, items, notes, taxRate } = body;

  if (!customerId || !quoteNumber || !issueDate || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
    sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate || 0) / 100;
  const total = subtotal + taxAmount;
  const id = generateId('quote');

  const result = await query(
    `INSERT INTO quotes (id, user_id, customer_id, quote_number, status, issue_date, expiry_date, subtotal, tax_rate, tax_amount, total, notes)
     VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [id, session.userId, customerId, quoteNumber, issueDate, expiryDate || null, subtotal, taxRate || 0, taxAmount, total, notes || null]
  );

  const quote = result[0];

  for (const item of items) {
    const itemId = generateId('qi');
    await query(
      `INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [itemId, id, item.description, item.quantity, item.unitPrice, item.quantity * item.unitPrice]
    );
  }

  return NextResponse.json({ quote }, { status: 201 });
}
