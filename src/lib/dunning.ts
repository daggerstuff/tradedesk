import { query, queryOne } from './db';
import { sendEmail } from './resend';
import { sendPushNotification } from './push';

// ---- Types ----
export interface DunningSettings {
  id: string;
  user_id: string;
  late_fee_enabled: boolean;
  late_fee_amount: number;
  late_fee_type: 'fixed' | 'percent';
  grace_period_days: number;
  auto_charge_late_fee: boolean;
  dunning_enabled: boolean;
  max_dunning_attempts: number;
}

export interface OverdueInvoice {
  id: string;
  user_id: string;
  customer_id: string;
  invoice_number: string;
  total: number;
  due_date: string;
  status: string;
  dunning_status: string;
  dunning_attempts: number;
  late_fee_charged: number;
  last_dunning_sent_at: string | null;
  customer_name: string;
  customer_email: string;
  user_name: string;
  user_email: string;
  user_company: string;
}

export type DunningAction = 'reminder_email' | 'late_fee_charged' | 'payment_plan_offered' | 'final_notice' | 'escalation';

const DUNNING_THRESHOLDS = [3, 7, 14, 30] as const;

// ---- Settings ----

export async function getDunningSettings(userId: string): Promise<DunningSettings> {
  const row = await queryOne<DunningSettings>(
    `SELECT * FROM dunning_settings WHERE user_id = $1`,
    [userId]
  );
  if (row) return row;

  // Return defaults
  return {
    id: '',
    user_id: userId,
    late_fee_enabled: false,
    late_fee_amount: 0,
    late_fee_type: 'fixed',
    grace_period_days: 1,
    auto_charge_late_fee: false,
    dunning_enabled: true,
    max_dunning_attempts: 4,
  };
}

export async function upsertDunningSettings(
  userId: string,
  settings: Partial<Omit<DunningSettings, 'id' | 'user_id'>>
): Promise<void> {
  await query(
    `INSERT INTO dunning_settings (user_id, late_fee_enabled, late_fee_amount, late_fee_type, grace_period_days, auto_charge_late_fee, dunning_enabled, max_dunning_attempts, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       late_fee_enabled = EXCLUDED.late_fee_enabled,
       late_fee_amount = EXCLUDED.late_fee_amount,
       late_fee_type = EXCLUDED.late_fee_type,
       grace_period_days = EXCLUDED.grace_period_days,
       auto_charge_late_fee = EXCLUDED.auto_charge_late_fee,
       dunning_enabled = EXCLUDED.dunning_enabled,
       max_dunning_attempts = EXCLUDED.max_dunning_attempts,
       updated_at = NOW()`,
    [
      userId,
      settings.late_fee_enabled ?? false,
      settings.late_fee_amount ?? 0,
      settings.late_fee_type ?? 'fixed',
      settings.grace_period_days ?? 1,
      settings.auto_charge_late_fee ?? false,
      settings.dunning_enabled ?? true,
      settings.max_dunning_attempts ?? 4,
    ]
  );
}

// ---- Overdue invoice discovery ----

export async function getOverdueInvoices(userId: string): Promise<OverdueInvoice[]> {
  const rows = await query<OverdueInvoice>(
    `SELECT i.id, i.user_id, i.customer_id, i.invoice_number, i.total, i.due_date,
            i.status, i.dunning_status, i.dunning_attempts, i.late_fee_charged,
            i.last_dunning_sent_at,
            c.name AS customer_name, c.email AS customer_email,
            u.name AS user_name, u.email AS user_email, u.company AS user_company
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN users u ON u.id = i.user_id
     WHERE i.user_id = $1
       AND i.status = 'sent'
       AND i.due_date < CURRENT_DATE
     ORDER BY i.due_date ASC`,
    [userId]
  );
  return rows;
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function getDunningThreshold(daysOverdue: number): number | null {
  for (const t of DUNNING_THRESHOLDS) {
    if (daysOverdue >= t) return t;
  }
  return null;
}

// ---- Action determination ----

export function determineDunningAction(
  daysOverdue: number,
  attempts: number,
  maxAttempts: number
): DunningAction | null {
  if (attempts >= maxAttempts) return null;

  if (daysOverdue >= 30) return 'final_notice';
  if (daysOverdue >= 14) return attempts >= 2 ? 'payment_plan_offered' : 'reminder_email';
  if (daysOverdue >= 7) return 'reminder_email';
  if (daysOverdue >= 3) return 'reminder_email';
  return null;
}

// ---- Late fee calculation ----

export function calculateLateFee(
  invoiceTotal: number,
  settings: Pick<DunningSettings, 'late_fee_enabled' | 'late_fee_amount' | 'late_fee_type'>
): number {
  if (!settings.late_fee_enabled || settings.late_fee_amount <= 0) return 0;
  if (settings.late_fee_type === 'percent') {
    return Math.round((invoiceTotal * settings.late_fee_amount / 100) * 100) / 100;
  }
  return settings.late_fee_amount;
}

// ---- Email templates ----

export function dunningEmailHtml(
  action: DunningAction,
  invoice: OverdueInvoice,
  daysOverdue: number,
  lateFee?: number
): { subject: string; html: string } {
  const companyName = invoice.user_company || invoice.user_name || 'TradeDesk';
  const customerName = invoice.customer_name;
  const invoiceNumber = invoice.invoice_number;
  const total = (invoice.total + (lateFee || 0)).toFixed(2);
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  switch (action) {
    case 'reminder_email':
      return {
        subject: `Friendly reminder: Invoice ${invoiceNumber} is past due`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
            <p>Hi ${customerName},</p>
            <p>Just a quick heads up — invoice <strong>${invoiceNumber}</strong> for <strong>$${total}</strong> was due on <strong>${dueDate}</strong> (${daysOverdue} days ago).</p>
            <p>If you've already sent payment, disregard this. If not, we'd appreciate you taking care of it when you get a chance.</p>
            <p>Questions? Just reply to this email.</p>
            <p>Thanks,<br>${companyName}</p>
          </div>
        `,
      };

    case 'late_fee_charged':
      return {
        subject: `Late fee applied to Invoice ${invoiceNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
            <p>Hi ${customerName},</p>
            <p>A late fee of <strong>$${lateFee?.toFixed(2)}</strong> has been applied to invoice <strong>${invoiceNumber}</strong> for <strong>$${invoice.total.toFixed(2)}</strong>, now ${daysOverdue} days past due.</p>
            <p><strong>New balance: $${total}</strong></p>
            <p>If you need to discuss payment options, let us know.</p>
            <p>${companyName}</p>
          </div>
        `,
      };

    case 'payment_plan_offered':
      return {
        subject: `Let's work something out — Invoice ${invoiceNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
            <p>Hi ${customerName},</p>
            <p>We know things get tight. Invoice <strong>${invoiceNumber}</strong> ($${total}) is now ${daysOverdue} days past due.</p>
            <p>We can split this into <strong>2 or 3 easy installments</strong> — no hassle, no judgment. Just reply and we'll set it up.</p>
            <p>${companyName}</p>
          </div>
        `,
      };

    case 'final_notice':
      return {
        subject: `FINAL NOTICE: Invoice ${invoiceNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 2px solid #dc2626; border-radius: 8px;">
            <h2 style="color: #dc2626; margin-top: 0;">FINAL NOTICE</h2>
            <p>Hi ${customerName},</p>
            <p>Invoice <strong>${invoiceNumber}</strong> for <strong>$${total}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>
            <p>This is our final notice before this matter is escalated. Please arrange payment within 7 days to avoid further action.</p>
            <p>If you're experiencing hardship, reach out — we're reasonable people.</p>
            <p>${companyName}</p>
          </div>
        `,
      };

    case 'escalation':
      return {
        subject: `URGENT: Invoice ${invoiceNumber} requires immediate attention`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 2px solid #dc2626; border-radius: 8px;">
            <h2 style="color: #dc2626; margin-top: 0;">URGENT — Immediate Payment Required</h2>
            <p>Hi ${customerName},</p>
            <p>Invoice <strong>${invoiceNumber}</strong> for <strong>$${total}</strong> is <strong>${daysOverdue} days past due</strong>.</p>
            <p>Contact us within 48 hours to resolve this matter.</p>
            <p>${companyName}</p>
          </div>
        `,
      };
  }
}

// ---- Send dunning communication ----

export async function sendDunningCommunication(
  invoice: OverdueInvoice,
  action: DunningAction
): Promise<boolean> {
  const daysOverdue = getDaysOverdue(invoice.due_date);
  const { subject, html } = dunningEmailHtml(action, invoice, daysOverdue);

  // Send email to customer
  let emailSent = false;
  if (invoice.customer_email) {
    try {
      await sendEmail({
        to: invoice.customer_email,
        subject,
        html,
      });
      emailSent = true;
    } catch {
      // log but continue
    }
  }

  // Send push notification to user (looks up token internally)
  try {
    await sendPushNotification(
      invoice.user_id,
      `Collection: ${invoice.invoice_number}`,
      `${action.replace('_', ' ')} — ${invoice.customer_name} (${daysOverdue}d overdue)`
    );
  } catch {
    // continue
  }

  return emailSent;
}

// ---- Log dunning action ----

export async function logDunningAction(
  userId: string,
  invoiceId: string,
  attempt: number,
  action: DunningAction,
  channel: 'email' | 'push' | 'sms',
  amountCharged?: number
): Promise<void> {
  await query(
    `INSERT INTO dunning_logs (user_id, invoice_id, attempt, action, channel, amount_charged)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, invoiceId, attempt, action, channel, amountCharged ?? null]
  );
}

// ---- Update invoice dunning status ----

export async function updateInvoiceDunningStatus(
  invoiceId: string,
  daysOverdue: number,
  newAttempt: number
): Promise<void> {
  let dunningStatus = 'current';
  if (daysOverdue >= 30) dunningStatus = 'overdue_30';
  else if (daysOverdue >= 14) dunningStatus = 'overdue_14';
  else if (daysOverdue >= 7) dunningStatus = 'overdue_7';
  else if (daysOverdue >= 3) dunningStatus = 'overdue_3';

  await query(
    `UPDATE invoices SET dunning_status = $1, dunning_attempts = $2, last_dunning_sent_at = NOW() WHERE id = $3`,
    [dunningStatus, newAttempt, invoiceId]
  );
}

// ---- Collections stats ----

export async function getCollectionsStats(userId: string): Promise<{
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  overdueByBucket: { bucket: string; count: number; amount: number }[];
  avgDaysOverdue: number;
}> {
  const rows = await query<{ bucket: string; count: string; amount: string }>(
    `SELECT
       CASE
         WHEN due_date < CURRENT_DATE - INTERVAL '30 days' THEN '30+'
         WHEN due_date < CURRENT_DATE - INTERVAL '14 days' THEN '14-30'
         WHEN due_date < CURRENT_DATE - INTERVAL '7 days' THEN '7-14'
         WHEN due_date < CURRENT_DATE - INTERVAL '3 days' THEN '3-7'
         ELSE 'current'
       END AS bucket,
       COUNT(*)::text AS count,
       COALESCE(SUM(total), 0)::text AS amount
     FROM invoices
     WHERE user_id = $1 AND status = 'sent' AND due_date < CURRENT_DATE
     GROUP BY 1
     ORDER BY 1`,
    [userId]
  );

  const totalOverdueRow = await queryOne<{ total: string; count: string }>(
    `SELECT COALESCE(SUM(total), 0)::text AS total, COUNT(*)::text AS count
     FROM invoices WHERE user_id = $1 AND status = 'sent' AND due_date < CURRENT_DATE`,
    [userId]
  );

  const avgRow = await queryOne<{ avg: string }>(
    `SELECT COALESCE(AVG(CURRENT_DATE - due_date), 0)::text AS avg
     FROM invoices WHERE user_id = $1 AND status = 'sent' AND due_date < CURRENT_DATE`,
    [userId]
  );

  const overdueByBucket = rows.filter(r => r.bucket !== 'current').map(r => ({
    bucket: r.bucket,
    count: parseInt(r.count, 10),
    amount: parseFloat(r.amount),
  }));

  return {
    totalOutstanding: parseFloat(totalOverdueRow?.total || '0'),
    totalOverdue: parseFloat(totalOverdueRow?.total || '0'),
    overdueCount: parseInt(totalOverdueRow?.count || '0', 10),
    overdueByBucket,
    avgDaysOverdue: parseFloat(avgRow?.avg || '0'),
  };
}

// ---- Dunning logs retrieval ----

export async function getDunningLogs(userId: string, limit = 50): Promise<{
  id: string;
  invoice_number: string;
  customer_name: string;
  attempt: number;
  action: string;
  channel: string;
  amount_charged: number | null;
  sent_at: string;
}[]> {
  return query(
    `SELECT dl.id, i.invoice_number, c.name AS customer_name, dl.attempt, dl.action, dl.channel, dl.amount_charged, dl.sent_at
     FROM dunning_logs dl
     JOIN invoices i ON i.id = dl.invoice_id
     JOIN customers c ON c.id = i.customer_id
     WHERE dl.user_id = $1
     ORDER BY dl.sent_at DESC
     LIMIT $2`,
    [userId, limit]
  );
}
