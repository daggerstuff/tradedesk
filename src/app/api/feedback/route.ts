import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, message, page } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  await query(
    'INSERT INTO feedback (user_id, type, message, page, created_at) VALUES ($1, $2, $3, $4, NOW())',
    [session.userId, type || 'general', message, page || null]
  );

  // Forward to admin email
  if (process.env.ADMIN_EMAIL) {
    sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `[TradeDesk Feedback] ${type || 'general'}`,
      html: `<p><strong>From:</strong> ${session.email}</p><p><strong>Page:</strong> ${page || 'unknown'}</p><p>${message}</p>`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
