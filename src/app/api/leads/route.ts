import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { sendEmail, leadWelcomeEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const { email, name, source } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const existing = await queryOne('SELECT id FROM leads WHERE email = $1', [email.toLowerCase()]);
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  await queryOne(
    'INSERT INTO leads (email, name, source, drip_stage) VALUES ($1, $2, $3, 0)',
    [email.toLowerCase(), name || null, source || 'landing']
  );

  sendEmail({ to: email, subject: 'Welcome to TradeDesk — here\'s what to do next', html: leadWelcomeEmail(name || 'there') }).catch(() => {});

  return NextResponse.json({ ok: true });
}
