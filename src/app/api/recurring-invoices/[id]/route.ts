import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { createId } from '@paralleldrive/cuid2';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const rows = await query(
    `SELECT ri.*, c.name as customer_name,
            (SELECT json_agg(json_build_object('id', rii.id, 'description', rii.description, 'quantity', rii.quantity, 'unit_price', rii.unit_price))
             FROM recurring_invoice_items rii WHERE rii.recurring_invoice_id = ri.id) as items
     FROM recurring_invoices ri
     JOIN customers c ON ri.customer_id = c.id
     WHERE ri.id = $1 AND ri.user_id = $2`,
    [id, session.userId]
  );

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ recurring: rows[0] });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { customerId, invoiceNumberPrefix, frequency, dayOfMonth, startDate, endDate, taxRate, notes, isActive, items } = body;

  await query(
    `UPDATE recurring_invoices
     SET customer_id = COALESCE($2, customer_id),
         invoice_number_prefix = COALESCE($3, invoice_number_prefix),
         frequency = COALESCE($4, frequency),
         day_of_month = COALESCE($5, day_of_month),
         start_date = COALESCE($6, start_date),
         end_date = $7,
         tax_rate = COALESCE($8, tax_rate),
         notes = $9,
         is_active = COALESCE($10, is_active),
         updated_at = NOW()
     WHERE id = $1 AND user_id = $11`,
    [id, customerId, invoiceNumberPrefix, frequency, dayOfMonth, startDate, endDate || null, taxRate, notes, isActive, session.userId]
  );

  if (items) {
    await query('DELETE FROM recurring_invoice_items WHERE recurring_invoice_id = $1', [id]);
    for (const item of items) {
      await query(
        `INSERT INTO recurring_invoice_items (id, recurring_invoice_id, description, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [createId(), id, item.description, item.quantity || 1, item.unitPrice || 0]
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query('DELETE FROM recurring_invoices WHERE id = $1 AND user_id = $2', [id, session.userId]);
  return NextResponse.json({ success: true });
}
