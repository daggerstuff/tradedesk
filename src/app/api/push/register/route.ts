import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { unauthorized } from '@/lib/api-errors';

/**
 * Register or update the user's Expo push token.
 * Body: { token: string }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  // Validate Expo push token format
  if (!token.startsWith('ExponentPushToken[')) {
    return NextResponse.json({ error: 'Invalid push token format' }, { status: 400 });
  }

  await query(
    'UPDATE users SET push_token = $1, push_enabled = true WHERE id = $2',
    [token, session.userId]
  );

  return NextResponse.json({ ok: true });
}

/**
 * Toggle push notifications on/off.
 * Body: { enabled: boolean }
 */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { enabled } = await req.json();
  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled (boolean) required' }, { status: 400 });
  }

  await query(
    'UPDATE users SET push_enabled = $1 WHERE id = $2',
    [enabled, session.userId]
  );

  return NextResponse.json({ ok: true, enabled });
}

/**
 * Remove push token (opt-out completely).
 */
export async function DELETE() {
  const session = await getSession();
  if (!session) return unauthorized();

  await query(
    'UPDATE users SET push_token = NULL, push_enabled = false WHERE id = $1',
    [session.userId]
  );

  return NextResponse.json({ ok: true });
}

/**
 * Get current push notification status.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const user = await query<{ push_enabled: boolean; has_token: boolean }>(
    'SELECT push_enabled, push_token IS NOT NULL as has_token FROM users WHERE id = $1',
    [session.userId]
  );

  if (!user[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    enabled: user[0].push_enabled,
    hasToken: user[0].has_token,
  });
}
