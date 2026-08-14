import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { unauthorized, apiError } from '@/lib/api-errors';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { userId, role } = await req.json();
  if (!userId || !role) return apiError('User ID and role required');

  if (!['member', 'admin'].includes(role)) return apiError('Invalid role');

  await query(
    'UPDATE team_members SET role = $1 WHERE owner_id = $2 AND user_id = $3',
    [role, session.userId, userId]
  );

  return NextResponse.json({ ok: true });
}
