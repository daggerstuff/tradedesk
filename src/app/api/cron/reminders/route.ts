import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sent: string[] = [];
  const errors: string[] = [];

  try {
    const pendingInvoices = await query<any>(`
      SELECT 
        i.id AS invoice_id,
        i.invoice_number,
        i.due_date,
        i.total,
        i.currency,
        i.user_id,
        i.customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        c.company_name AS customer_company,
        u.email AS user_email,
        u.name AS user_name
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      JOIN users u ON u.id = i.user_id
      WHERE i.status IN ('sent', 'viewed', 'overdue')
        AND i.due_date IS NOT NULL
        AND c.email IS NOT NULL
      ORDER BY i.due_date ASC
      LIMIT 100
    `);

    if (!pendingInvoices || pendingInvoices.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No pending invoices' });
    }

    for (const inv of pendingInvoices) {
      const dueDate = new Date(inv.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);

      const templates = await query<any>(`
        SELECT * FROM reminder_template 
        WHERE user_id = $1 AND is_active = true
        ORDER BY days_before_due ASC
      `, [inv.user_id]);

      if (!templates || templates.length === 0) continue;

      for (const tmpl of templates) {
        const existing = await query<any>(`
          SELECT id FROM reminders 
          WHERE invoice_id = $1 AND template_id = $2
          LIMIT 1
        `, [inv.invoice_id, tmpl.id]);

        if (existing && existing.length > 0) continue;

        const shouldSend = daysUntilDue <= tmpl.days_before_due && daysUntilDue > -30;
        if (!shouldSend) continue;

        const replacements = {
          '{{invoice_number}}': inv.invoice_number,
          '{{customer_name}}': inv.customer_name,
          '{{amount}}': `$${inv.total}`,
          '{{due_date}}': dueDate.toLocaleDateString(),
          '{{business_name}}': inv.user_name || 'our company',
        };

        let subject = tmpl.subject || `Reminder: Invoice ${inv.invoice_number}`;
        let body = tmpl.body || `Hi ${inv.customer_name},\n\nThis is a friendly reminder that invoice ${inv.invoice_number} for $${inv.total} is due on ${dueDate.toLocaleDateString()}.\n\nThank you!`;

        for (const [key, val] of Object.entries(replacements)) {
          subject = subject.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), val);
          body = body.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), val);
        }

        try {
          await sendEmail({
            to: inv.customer_email,
            subject,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <p style="white-space: pre-line;">${body}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #666; font-size: 12px;">Invoice ${inv.invoice_number} • $${inv.total} • Due ${dueDate.toLocaleDateString()}</p>
            </div>`,
          });

          await query(`
            INSERT INTO reminders (user_id, invoice_id, template_id, type, subject, body, status)
            VALUES ($1, $2, $3, 'due_reminder', $4, $5, 'sent')
          `, [inv.user_id, inv.invoice_id, tmpl.id, subject, body]);

          sent.push(inv.invoice_number);
        } catch (err) {
          errors.push(`${inv.invoice_number}: ${err instanceof Error ? err.message : 'unknown'}`);
        }
      }
    }

    return NextResponse.json({
      processed: pendingInvoices.length,
      sent: sent.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
