import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let sql = `SELECT * FROM expenses WHERE user_id = $1`;
  const params: (string | number)[] = [session.userId];

  if (category && category !== 'all') {
    sql += ` AND category = $2`;
    params.push(category);
  }
  sql += ` ORDER BY date DESC, created_at DESC`;

  const expenses = await query(sql, params);
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { category, vendor, amount, date, description, jobId } = body;

  if (!category || !amount || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const id = generateId('exp');
  await query(
    `INSERT INTO expenses (id, user_id, category, vendor, amount, date, description, job_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, session.userId, category, vendor || null, amount, date, description || null, jobId || null]
  );

  return NextResponse.json({ expense: { id } }, { status: 201 });
}
