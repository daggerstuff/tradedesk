import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get the team context: either the user's own data or the owner's team context
  const membership = await query(
    'SELECT owner_id, role FROM team_members WHERE user_id = $1',
    [session.userId]
  ).then(rows => rows[0]);

  // If user is a team member, return owner's subscription plan
  if (membership) {
    return NextResponse.json({
      ownerId: membership.owner_id,
      role: membership.role,
    });
  }

  // User is the owner — return their own plan
  const user = await query(
    'SELECT plan FROM users WHERE id = $1',
    [session.userId]
  ).then(rows => rows[0]);

  return NextResponse.json({
    ownerId: session.userId,
    role: 'owner',
    plan: user?.plan || 'free',
  });
}
