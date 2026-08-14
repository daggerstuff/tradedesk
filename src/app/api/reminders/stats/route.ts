import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [totalResult, monthResult, activeResult] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) as count FROM reminders WHERE user_id = $1`, [session.userId]),
    query<{ count: string }>(`
      SELECT COUNT(*) as count FROM reminders 
      WHERE user_id = $1 AND sent_at >= date_trunc('month', now())
    `, [session.userId]),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM reminder_template WHERE user_id = $1 AND is_active = true`, [session.userId]),
  ]);

  return NextResponse.json({
    total: parseInt(totalResult[0]?.count || '0', 10),
    thisMonth: parseInt(monthResult[0]?.count || '0', 10),
    activeTemplates: parseInt(activeResult[0]?.count || '0', 10),
  });
}
