import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { query, queryOne } from '@/lib/db';
import { sendDunningCommunication, logDunningAction, updateInvoiceDunningStatus, getDaysOverdue, type DunningAction } from '@/lib/dunning';

export const dynamic = 'force-dynamic';

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    return payload?.userId ?? null;
  }
  const session = await getSession();
  return session?.userId ?? null;
}

// POST: manually trigger a dunning action on an invoice
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;
  const body = await req.json();
  const action: DunningAction = body.action || 'reminder_email';

  // Verify invoice belongs to user
  const invoice = await queryOne<{
    id: string; user_id: string; invoice_number: string; due_date: string; total: number;
    status: string; dunning_attempts: number; dunning_status: string;
    late_fee_charged: number; customer_id: string; last_dunning_sent_at: string | null;
    customer_name: string; customer_email: string;
    user_name: string; user_email: string; user_company: string;
  }>(
    `SELECT i.id, i.user_id, i.invoice_number, i.due_date, i.total, i.status,
            i.dunning_attempts, i.dunning_status, i.late_fee_charged, i.customer_id,
            i.last_dunning_sent_at,
            c.name AS customer_name, c.email AS customer_email,
            u.name AS user_name, u.email AS user_email, u.company AS user_company
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN users u ON u.id = i.user_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [invoiceId, userId]
  );

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const sent = await sendDunningCommunication(invoice, action);
  await logDunningAction(userId, invoiceId, invoice.dunning_attempts + 1, action, 'email');

  const daysOverdue = getDaysOverdue(invoice.due_date);
  await updateInvoiceDunningStatus(invoiceId, daysOverdue, invoice.dunning_attempts + 1);

  return NextResponse.json({ success: true, sent });
}

// POST: mark invoice as resolved (paid externally, write-off, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;
  const body = await req.json();

  await query(
    `UPDATE invoices SET dunning_status = 'resolved', status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
    [body.status || 'paid', invoiceId, userId]
  );

  return NextResponse.json({ success: true });
}
