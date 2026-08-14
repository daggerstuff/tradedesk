import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { unauthorized } from '@/lib/api-errors';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const rows = await query(
    `SELECT qb_connected_at, qb_token_expires_at,
     CASE WHEN qb_access_token IS NOT NULL AND qb_token_expires_at > NOW() - INTERVAL '30 days'
          THEN true ELSE false END as connected
     FROM users WHERE id = $1`,
    [session.userId]
  );

  const status = rows[0] as { connected: boolean; qb_connected_at: string } | undefined;

  return NextResponse.json({
    connected: status?.connected ?? false,
    connectedAt: status?.qb_connected_at ?? null,
  });
}
