import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateId } from '@/lib/auth';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const quote = await queryOne<{
    id: string; customer_id: string; quote_number: string; issue_date: string;
    due_date?: string; subtotal: number; tax_rate: number; tax_amount: number;
    total: number; notes: string | null;
  }>(
    `SELECT * FROM quotes WHERE id = $1 AND user_id = $2`,
    [id, session.userId]
  );

  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

  // Generate invoice from quote
  const invoiceId = generateId('inv');
  const issueDate = quote.issue_date || new Date().toISOString().split('T')[0];
  const dueDate = quote.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  await query(
    `INSERT INTO invoices (id, user_id, customer_id, invoice_number, issue_date, due_date,
      subtotal, tax_rate, tax_amount, total, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'sent', $11)`,
    [invoiceId, session.userId, quote.customer_id, invoiceNumber, issueDate, dueDate,
     quote.subtotal, quote.tax_rate, quote.tax_amount, quote.total, quote.notes]
  );

  // Copy quote items to invoice items
  const quoteItems = await query(
    `SELECT * FROM quote_items WHERE quote_id = $1`,
    [id]
  );

  for (const item of quoteItems) {
    const itemId = generateId('invitem');
    await query(
      `INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [itemId, invoiceId, item.description, item.quantity, item.unit_price, item.total]
    );
  }

  // Mark quote as invoiced
  await query(`UPDATE quotes SET status = 'invoiced', updated_at = NOW() WHERE id = $1`, [id]);

  return NextResponse.json({ invoiceId, invoiceNumber }, { status: 201 });
}
