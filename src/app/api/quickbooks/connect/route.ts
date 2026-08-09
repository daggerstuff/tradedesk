import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getQBAuthUrl, generateState } from '@/lib/quickbooks';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const state = generateState(session.userId);
  await query(
    'UPDATE users SET qb_state = $1 WHERE id = $2',
    [state, session.userId]
  );

  const authUrl = getQBAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
