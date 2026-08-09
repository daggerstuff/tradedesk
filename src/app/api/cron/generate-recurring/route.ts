import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createId } from '@paralleldrive/cuid2';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfMonth = today.getDate();

  // Find all active recurring invoices due today
  const dueTemplates = await query<{
    id: string;
    user_id: string;
    customer_id: string;
    invoice_number_prefix: string;
    day_of_month: number;
    start_date: string;
    end_date: string | null;
    tax_rate: string | number;
    notes: string | null;
    last_generated: string | null;
  }>(
    `SELECT * FROM recurring_invoices
     WHERE is_active = true
       AND day_of_month = $1
       AND start_date <= $2
       AND (end_date IS NULL OR end_date >= $2)
       AND (last_generated IS NULL OR last_generated < $2)`,
    [dayOfMonth, todayStr]
  );

  let generated = 0;

  for (const template of dueTemplates) {
    // Get items
    const items = await query<{
      description: string;
      quantity: string | number;
      unit_price: string | number;
    }>(
      'SELECT description, quantity, unit_price FROM recurring_invoice_items WHERE recurring_invoice_id = $1',
      [template.id]
    );

    if (!items.length) continue;

    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
    const taxAmount = subtotal * Number(template.tax_rate) / 100;
    const total = subtotal + taxAmount;

    // Generate invoice number
    const countResult = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE $1",
      [`${template.invoice_number_prefix}%`]
    );
    const nextNumber = (Number(countResult[0]?.count) || 0) + 1;
    const invoiceNumber = `${template.invoice_number_prefix}-${String(nextNumber).padStart(4, '0')}`;

    const invoiceId = createId();
    await query(
      `INSERT INTO invoices (id, user_id, customer_id, invoice_number, issue_date, due_date, subtotal, tax_rate, tax_amount, total, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'sent', $11)`,
      [invoiceId, template.user_id, template.customer_id, invoiceNumber, todayStr, todayStr, subtotal, Number(template.tax_rate), taxAmount, total, template.notes]
    );

    for (const item of items) {
      await query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, item.description, Number(item.quantity), Number(item.unit_price), Number(item.quantity) * Number(item.unit_price)]
      );
    }

    // Update last_generated
    await query('UPDATE recurring_invoices SET last_generated = $1 WHERE id = $2', [todayStr, template.id]);
    generated++;
  }

  return NextResponse.json({ generated, checked: dueTemplates.length });
}
