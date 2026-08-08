import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Auth: cookie session (web) or Bearer token (mobile)
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

  const photos = await query(
    `SELECT id, job_id, caption, created_at, 
     LEFT(photo_data, 100) as photo_preview,
     LENGTH(photo_data) as photo_size
     FROM job_photos WHERE job_id = $1 ORDER BY created_at DESC`,
    [id]
  );

  return NextResponse.json({ photos });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const body = await req.json();
  const { photoData, caption } = body;

  if (!photoData) return NextResponse.json({ error: 'No photo data' }, { status: 400 });

  // Limit to ~5MB base64
  if (photoData.length > 7_000_000) {
    return NextResponse.json({ error: 'Photo too large (max 5MB)' }, { status: 413 });
  }

  const result = await query(
    `INSERT INTO job_photos (job_id, uploaded_by, photo_data, caption)
     VALUES ($1, $2, $3, $4) RETURNING id, job_id, caption, created_at`,
    [id, userId, photoData, caption || null]
  );

  return NextResponse.json({ photo: result[0] }, { status: 201 });
}
