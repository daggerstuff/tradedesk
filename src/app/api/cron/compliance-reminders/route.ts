import { query } from '@/lib/db';
import { sendComplianceExpiringPush } from '@/lib/push';

/**
 * Check for compliance documents expiring in 7, 3, or 1 day(s)
 * and send push notifications to users.
 * Run daily via cron.
 */
export async function GET() {
  // Find docs expiring in 1, 3, or 7 days that haven't been notified
  const expiring = await query<{
    id: string;
    user_id: string;
    doc_name: string;
    days_left: number;
  }>(
    `SELECT id, user_id, doc_name,
       (expiry_date - CURRENT_DATE)::int as days_left
     FROM compliance_docs
     WHERE status = 'active'
       AND expiry_date IS NOT NULL
       AND (expiry_date - CURRENT_DATE) IN (1, 3, 7)
     ORDER BY days_left ASC`
  );

  let sent = 0;
  for (const doc of expiring) {
    await sendComplianceExpiringPush(doc.user_id, doc.doc_name, doc.days_left);
    sent++;
  }

  return Response.json({ checked: expiring.length, notifications_sent: sent });
}
