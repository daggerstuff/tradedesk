import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  getDunningSettings,
  getOverdueInvoices,
  getDaysOverdue,
  determineDunningAction,
  calculateLateFee,
  sendDunningCommunication,
  logDunningAction,
  updateInvoiceDunningStatus,
} from '@/lib/dunning';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    processed: 0,
    emailsSent: 0,
    lateFeesCharged: 0,
    errors: [] as string[],
  };

  try {
    // Get all users who have sent invoices
    const users = await query<{ id: string }>(
      `SELECT DISTINCT user_id AS id FROM invoices WHERE status = 'sent' AND due_date < CURRENT_DATE`
    );

    for (const user of users) {
      const settings = await getDunningSettings(user.id);
      if (!settings.dunning_enabled) continue;

      const overdueInvoices = await getOverdueInvoices(user.id);

      for (const invoice of overdueInvoices) {
        results.processed++;
        const daysOverdue = getDaysOverdue(invoice.due_date);

        // Skip if within grace period
        if (daysOverdue < settings.grace_period_days) continue;

        // Determine what action to take
        const action = determineDunningAction(
          daysOverdue,
          invoice.dunning_attempts,
          settings.max_dunning_attempts
        );

        if (!action) continue;

        // Check if we already sent at this threshold level
        const threshold = daysOverdue >= 30 ? 'overdue_30' :
                          daysOverdue >= 14 ? 'overdue_14' :
                          daysOverdue >= 7 ? 'overdue_7' : 'overdue_3';

        if (invoice.dunning_status === threshold && invoice.last_dunning_sent_at) {
          const lastSent = new Date(invoice.last_dunning_sent_at);
          const hoursSinceLast = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLast < 72) continue; // Don't send more than every 3 days
        }

        // Apply late fee if applicable
        let lateFeeAmount = 0;
        if (settings.late_fee_enabled && settings.auto_charge_late_fee && invoice.late_fee_charged === 0) {
          lateFeeAmount = calculateLateFee(invoice.total, settings);
          if (lateFeeAmount > 0) {
            try {
              await query(
                `UPDATE invoices SET late_fee_charged = $1, total = total + $1 WHERE id = $2`,
                [lateFeeAmount, invoice.id]
              );
              results.lateFeesCharged++;
            } catch (err) {
              results.errors.push(`Late fee failed for ${invoice.invoice_number}: ${err instanceof Error ? err.message : 'unknown'}`);
            }
          }
        }

        // Send the dunning communication
        try {
          const sent = await sendDunningCommunication(invoice, action);
          if (sent) results.emailsSent++;

          // Log the action
          await logDunningAction(user.id, invoice.id, invoice.dunning_attempts + 1, action, 'email', lateFeeAmount || undefined);

          // Update invoice status
          await updateInvoiceDunningStatus(invoice.id, daysOverdue, invoice.dunning_attempts + 1);
        } catch (err) {
          results.errors.push(`Send failed for ${invoice.invoice_number}: ${err instanceof Error ? err.message : 'unknown'}`);
        }
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error', ...results },
      { status: 500 }
    );
  }
}
