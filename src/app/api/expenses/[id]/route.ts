import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query(`DELETE FROM expenses WHERE id = $1 AND user_id = $2`, [id, session.userId]);

  return NextResponse.json({ success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { category, vendor, amount, date, description, jobId } = body;

  await query(
    `UPDATE expenses SET category=$1, vendor=$2, amount=$3, date=$4, description=$5, job_id=$6
     WHERE id=$7 AND user_id=$8`,
    [category, vendor || null, amount, date, description || null, jobId || null, id, session.userId]
  );

  return NextResponse.json({ success: true });
}
