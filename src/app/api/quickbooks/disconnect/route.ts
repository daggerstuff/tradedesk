import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { unauthorized } from '@/lib/api-errors';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  await query(
    `UPDATE users SET
      qb_access_token = NULL,
      qb_refresh_token = NULL,
      qb_realm_id = NULL,
      qb_connected_at = NULL,
      qb_token_expires_at = NULL
     WHERE id = $1`,
    [session.userId]
  );

  return NextResponse.json({ disconnected: true });
}
