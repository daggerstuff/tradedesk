import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const recurring = await query(
    `SELECT ri.*, c.name as customer_name,
            (SELECT json_agg(json_build_object('id', rii.id, 'description', rii.description, 'quantity', rii.quantity, 'unit_price', rii.unit_price))
             FROM recurring_invoice_items rii WHERE rii.recurring_invoice_id = ri.id) as items
     FROM recurring_invoices ri
     JOIN customers c ON ri.customer_id = c.id
     WHERE ri.user_id = $1
     ORDER BY ri.created_at DESC`,
    [session.userId]
  );

  return NextResponse.json({ recurring });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { customerId, invoiceNumberPrefix, frequency, dayOfMonth, startDate, endDate, taxRate, notes, items } = body;

  if (!customerId || !startDate || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const id = createId();
  await query(
    `INSERT INTO recurring_invoices (id, user_id, customer_id, invoice_number_prefix, frequency, day_of_month, start_date, end_date, tax_rate, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, session.userId, customerId, invoiceNumberPrefix || 'INV', frequency || 'monthly', dayOfMonth || 1, startDate, endDate || null, taxRate || 0, notes || null]
  );

  for (const item of items) {
    await query(
      `INSERT INTO recurring_invoice_items (id, recurring_invoice_id, description, quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [createId(), id, item.description, item.quantity || 1, item.unitPrice || 0]
    );
  }

  return NextResponse.json({ id }, { status: 201 });
}
