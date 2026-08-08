import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const templates = await query(
    `SELECT * FROM reminder_template WHERE user_id = $1 ORDER BY days_before_due ASC`,
    [session.userId]
  );

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, subject, body: templateBody, days_before_due } = body;

  if (!name || !subject || !templateBody || days_before_due === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO reminder_template (user_id, name, subject, body, days_before_due, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING *`,
    [session.userId, name, subject, templateBody, days_before_due]
  );

  return NextResponse.json({ template: result[0] }, { status: 201 });
}
