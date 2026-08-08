import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { queryOne } from '@/lib/db';
import { generateId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const invoice = await queryOne('SELECT id, share_token FROM invoices WHERE id = $1 AND user_id = $2', [id, session.userId]);

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  if (invoice.share_token) {
    return NextResponse.json({ token: invoice.share_token, url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.share_token}` });
  }

  const token = generateId();
  await queryOne('UPDATE invoices SET share_token = $1 WHERE id = $2', [token, id]);

  return NextResponse.json({ token, url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${token}` });
}
