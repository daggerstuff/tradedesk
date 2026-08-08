import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await query('SELECT id, name, email, company FROM users WHERE id = $1', [session.userId]);
  const subs = await query('SELECT * FROM subscriptions WHERE user_id = $1', [session.userId]);

  return NextResponse.json({
    user: users[0] || null,
    subscription: subs[0] || null,
  });
}
