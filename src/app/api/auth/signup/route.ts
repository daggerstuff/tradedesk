import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { signToken, generateId } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { name, email, password, company } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 });
  }
  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 10);
  const id = generateId();
  await queryOne(
    'INSERT INTO users (id, email, name, company, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name',
    [id, email, name, company || null, hashed]
  );
  const token = signToken({ userId: id, email });
  return NextResponse.json({ token, user: { id, email, name } });
}
