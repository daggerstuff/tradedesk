import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reminders = await query<any>(`
    SELECT 
      r.id,
      r.subject,
      r.sent_at,
      r.status,
      i.invoice_number,
      c.name AS customer_name,
      c.email AS customer_email,
      t.name AS template_name
    FROM reminders r
    LEFT JOIN invoices i ON i.id = r.invoice_id
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN reminder_template t ON t.id = r.template_id
    WHERE r.user_id = $1
    ORDER BY r.sent_at DESC
    LIMIT 100
  `, [session.userId]);

  return NextResponse.json({ reminders: reminders || [] });
}
