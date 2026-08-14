import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { sendEmail, inviteEmail } from '@/lib/resend';
import { generateId } from '@/lib/auth';
import { unauthorized, apiError } from '@/lib/api-errors';

// List team members
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const members = await query(
    `SELECT u.id, u.name, u.email, m.role, m.created_at
     FROM team_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.owner_id = $1
     ORDER BY m.created_at DESC`,
    [session.userId]
  );

  return NextResponse.json({ members });
}

// Invite a team member
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { email, role } = await req.json();
  if (!email) return apiError('Email required');

  // Check if user exists
  const existing = await query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  ).then(rows => rows[0]);

  if (existing) {
    // Check if already a team member
    const existingMember = await query(
      'SELECT id FROM team_members WHERE owner_id = $1 AND user_id = $2',
      [session.userId, existing.id]
    ).then(rows => rows[0]);

    if (existingMember) return apiError('Already a team member');

    await query(
      'INSERT INTO team_members (id, owner_id, user_id, role) VALUES ($1, $2, $3, $4)',
      [generateId('tm'), session.userId, existing.id, role || 'member']
    );

    return NextResponse.json({ ok: true, userId: existing.id });
  }

  // Generate invite token
  const inviteToken = generateId('inv');
  await query(
    `INSERT INTO team_invites (id, owner_id, email, role, token, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [generateId('ti'), session.userId, email, role || 'member', inviteToken]
  );

  // Send invite email
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?invite=${inviteToken}`;
  sendEmail({
    to: email,
    subject: `You've been invited to join a team on TradeDesk`,
    html: inviteEmail(inviteLink),
  }).catch(() => {});

  return NextResponse.json({ ok: true, invited: true });
}

// Remove a team member
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { userId } = await req.json();
  if (!userId) return apiError('User ID required');

  // Only owner can remove members
  await query(
    'DELETE FROM team_members WHERE owner_id = $1 AND user_id = $2',
    [session.userId, userId]
  );

  return NextResponse.json({ ok: true });
}
