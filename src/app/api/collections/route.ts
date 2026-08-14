import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { getCollectionsStats, getDunningLogs, getDunningSettings, upsertDunningSettings } from '@/lib/dunning';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    return payload?.userId ?? null;
  }
  const session = await getSession();
  return session?.userId ?? null;
}

// GET: collections stats + overdue invoices + dunning settings
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [stats, settings, overdueInvoices, logs] = await Promise.all([
    getCollectionsStats(userId),
    getDunningSettings(userId),
    query<any>(`
      SELECT i.id, i.invoice_number, i.total, i.due_date, i.dunning_status,
             i.dunning_attempts, i.late_fee_charged, i.last_dunning_sent_at,
             c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.user_id = $1 AND i.status = 'sent' AND i.due_date < CURRENT_DATE
      ORDER BY i.due_date ASC
      LIMIT 50
    `, [userId]),
    getDunningLogs(userId, 20),
  ]);

  return NextResponse.json({ stats, settings, overdueInvoices, logs });
}

// PUT: update dunning settings
export async function PUT(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  await upsertDunningSettings(userId, {
    late_fee_enabled: body.late_fee_enabled,
    late_fee_amount: body.late_fee_amount,
    late_fee_type: body.late_fee_type,
    grace_period_days: body.grace_period_days,
    auto_charge_late_fee: body.auto_charge_late_fee,
    dunning_enabled: body.dunning_enabled,
    max_dunning_attempts: body.max_dunning_attempts,
  });

  return NextResponse.json({ success: true });
}
