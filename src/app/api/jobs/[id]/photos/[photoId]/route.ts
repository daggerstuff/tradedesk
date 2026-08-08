import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;
  let userId: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    userId = payload?.userId ?? null;
  } else {
    const session = await getSession();
    userId = session?.userId ?? null;
  }
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const photo = await queryOne(
    `SELECT id, job_id, photo_data, caption, created_at
     FROM job_photos WHERE id = $1 AND job_id = $2`,
    [photoId, id]
  );

  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ photo });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;
  let userId: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    userId = payload?.userId ?? null;
  } else {
    const session = await getSession();
    userId = session?.userId ?? null;
  }
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const photo = await queryOne(
    `DELETE FROM job_photos WHERE id = $1 AND job_id = $2 AND uploaded_by = $3 RETURNING id`,
    [photoId, id, userId]
  );

  if (!photo) return NextResponse.json({ error: 'Not found or not owner' }, { status: 404 });

  return NextResponse.json({ success: true });
}
