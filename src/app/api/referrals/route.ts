import { NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await queryOne<{ referral_code: string }>(
    'SELECT referral_code FROM users WHERE id = $1',
    [session.userId]
  );

  const referrals = await queryMany<{ id: string; name: string; email: string; status: string; created_at: string }>(
    `SELECT u.id, u.name, u.email, r.status, r.created_at
     FROM referrals r
     JOIN users u ON r.referred_id = u.id
     WHERE r.referrer_id = $1
     ORDER BY r.created_at DESC`,
    [session.userId]
  );

  return NextResponse.json({
    referralCode: user?.referral_code,
    count: referrals.length,
    referrals,
  });
}
