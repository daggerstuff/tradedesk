import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['viewed', 'paid', 'overdue', 'cancelled'],
  viewed: ['paid', 'overdue', 'cancelled'],
  overdue: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  // Get current status
  const rows = await query<{ status: string }>(
    'SELECT status FROM invoices WHERE id = $1 AND user_id = $2',
    [id, session.userId]
  );
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const currentStatus = rows[0].status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${currentStatus} to ${status}` }, { status: 400 });
  }

  await query('UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  return NextResponse.json({ success: true, status });
}
