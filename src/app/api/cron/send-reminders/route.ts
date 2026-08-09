import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/resend';

interface ReminderRow {
  invoice_id: string;
  invoice_number: string;
  total: string;
  due_date: string;
  issue_date: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  template_id: string;
  subject: string;
  body: string;
  template_name: string;
  user_email: string;
  user_company: string | null;
  share_token: string | null;
  days_past_due: number;
}

function renderReminderHtml(r: ReminderRow, isOverdue: boolean): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const payLink = r.share_token && appUrl ? `${appUrl}/pay/${r.share_token}` : null;
  const company = r.user_company || 'TradeDesk';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px;">
    <tr><td style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
      <p style="margin:0 0 20px;font-size:13px;color:#64748b;">${company}</p>
      <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${isOverdue ? 'Invoice Overdue' : 'Payment Reminder'}</h2>
      <p style="margin:0 0 8px;font-size:14px;color:#334155;">Hi ${r.customer_name},</p>
      <div style="margin:16px 0;font-size:14px;color:#334155;line-height:1.6;">${r.body.replace(/\n/g, '<br>')}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f8fafc;border-radius:8px;padding:16px;">
        <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Invoice #:</td><td style="padding:4px 0;font-size:13px;color:#0f172a;text-align:right;font-weight:600;">${r.invoice_number}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Due Date:</td><td style="padding:4px 0;font-size:13px;color:#0f172a;text-align:right;">${r.due_date?.split('T')[0]}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Amount Due:</td><td style="padding:4px 0;font-size:16px;color:#0f172a;text-align:right;font-weight:700;">$${Number(r.total).toFixed(2)}</td></tr>
      </table>
      ${payLink ? `<a href="${payLink}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Pay Now</a>` : ''}
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">Sent via TradeDesk</p>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find invoices needing reminders: match days_before_due OR overdue by same interval
  const reminders = await query<ReminderRow>(
    `SELECT i.id as invoice_id, i.invoice_number, i.total, i.due_date, i.issue_date,
            i.user_id, c.name as customer_name, c.email as customer_email,
            t.id as template_id, t.subject, t.body, t.name as template_name,
            u.email as user_email, u.company as user_company,
            i.share_token,
            (CURRENT_DATE - i.due_date::date) as days_past_due
     FROM invoices i
     JOIN customers c ON i.customer_id = c.id
     JOIN users u ON i.user_id = u.id
     JOIN reminder_template t ON t.user_id = i.user_id
     WHERE t.is_active = true
       AND i.status IN ('sent', 'viewed')
       AND NOT EXISTS (
         SELECT 1 FROM reminders r
         WHERE r.invoice_id = i.id AND r.template_id = t.id
           AND r.created_at::date = CURRENT_DATE
       )
       AND (
         -- Before due: days_before_due is positive and matches
         (t.days_before_due >= 0 AND i.due_date::date = (CURRENT_DATE + t.days_before_due)::date)
         OR
         -- Overdue: days_before_due is negative (e.g., -3 = 3 days after due)
         (t.days_before_due < 0 AND i.due_date::date = (CURRENT_DATE + t.days_before_due)::date)
       )`
  );

  let sent = 0;
  const errors: string[] = [];

  for (const r of reminders) {
    const isOverdue = r.days_past_due > 0;
    const subject = r.subject
      .replace('{invoice_number}', r.invoice_number)
      .replace('{customer_name}', r.customer_name)
      .replace('{total}', `$${Number(r.total).toFixed(2)}`)
      .replace('{due_date}', r.due_date?.split('T')[0] || '');

    const html = renderReminderHtml(r, isOverdue);

    try {
      await sendEmail({
        to: r.customer_email,
        subject,
        html,
        from: `${r.user_company || 'TradeDesk'} <noreply@timewarper.me>`,
      });

      await query(
        `INSERT INTO reminders (user_id, invoice_id, template_id, type, subject, body, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'sent')`,
        [r.user_id, r.invoice_id, r.template_id, isOverdue ? 'overdue' : 'before_due', subject, r.body]
      );

      sent++;
    } catch (err) {
      await query(
        `INSERT INTO reminders (user_id, invoice_id, template_id, type, subject, body, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'failed')`,
        [r.user_id, r.invoice_id, r.template_id, isOverdue ? 'overdue' : 'before_due', subject, r.body]
      );
      errors.push(`${r.invoice_number}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  return NextResponse.json({ sent, total: reminders.length, errors: errors.length ? errors : undefined });
}
