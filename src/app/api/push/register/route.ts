import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// Get userId from either cookie session (web) or Bearer token (mobile)
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  // Try Bearer token first (mobile)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    return payload?.userId ?? null;
  }
  // Fall back to cookie session (web)
  const session = await getSession();
  return session?.userId ?? null;
}

// POST: register push token
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  await query(
    'UPDATE users SET push_token = $1, push_enabled = true WHERE id = $2',
    [token, userId]
  );

  return NextResponse.json({ success: true });
}

// DELETE: clear push token
export async function DELETE(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await query(
    'UPDATE users SET push_token = NULL WHERE id = $1',
    [userId]
  );

  return NextResponse.json({ success: true });
}

// PATCH: toggle push_enabled
export async function PATCH(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { enabled } = await req.json();
  await query(
    'UPDATE users SET push_enabled = $1 WHERE id = $2',
    [!!enabled, userId]
  );

  return NextResponse.json({ success: true });
}
