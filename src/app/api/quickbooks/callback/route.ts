import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { exchangeQBCode } from '@/lib/quickbooks';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const realmId = searchParams.get('realmId');

  if (!code || !state || !realmId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?qb=error`);
  }

  // Verify state and get user
  const user = await query<{ id: string }>(
    'SELECT id FROM users WHERE qb_state = $1',
    [state]
  ).then(rows => rows[0]);

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?qb=error`);
  }

  try {
    const tokens = await exchangeQBCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await query(
      `UPDATE users SET
        qb_access_token = $1,
        qb_refresh_token = $2,
        qb_realm_id = $3,
        qb_connected_at = NOW(),
        qb_token_expires_at = $4,
        qb_state = NULL
      WHERE id = $5`,
      [tokens.access_token, tokens.refresh_token, realmId, expiresAt, user.id]
    );
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?qb=connected`);
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?qb=error`);
  }
}
