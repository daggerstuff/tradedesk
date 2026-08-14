import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendInvoicePaidPush } from "@/lib/push";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { amount, method, date, reference } = body;

  if (!amount || !method || !date) {
    return NextResponse.json({ error: "Amount, method, and date are required" }, { status: 400 });
  }

  const invoices = await query(
    `SELECT id, total, status FROM invoices WHERE id = $1 AND user_id = $2`,
    [id, session.userId]
  );
  if (!invoices.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoice = invoices[0] as { id: string; total: string; status: string };

  const paymentResult = await query(
    `INSERT INTO payments (invoice_id, amount, method, date, reference) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, amount, method, date, reference || null]
  );

  const payments = await query(
    `SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1`,
    [id]
  );
  const totalPaid = parseFloat((payments[0] as { total_paid: string }).total_paid || "0");

  let invoiceStatus = invoice.status;
  if (totalPaid >= parseFloat(invoice.total)) {
    await query(`UPDATE invoices SET status = 'paid', updated_at = NOW() WHERE id = $1`, [id]);
    invoiceStatus = "paid";
    // Notify invoice owner
    const inv = await query<{ user_id: string; invoice_number: string; total: string }>(
      'SELECT user_id, invoice_number, total FROM invoices WHERE id = $1', [id]
    );
    if (inv[0]) {
      sendInvoicePaidPush(inv[0].user_id, inv[0].invoice_number, parseFloat(inv[0].total)).catch(() => {});
    }
  } else if (totalPaid > 0) {
    await query(`UPDATE invoices SET status = 'partial', updated_at = NOW() WHERE id = $1`, [id]);
    invoiceStatus = "partial";
  }

  return NextResponse.json({ payment: paymentResult[0], totalPaid, invoiceStatus }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoices = await query(
    `SELECT id FROM invoices WHERE id = $1 AND user_id = $2`,
    [id, session.userId]
  );
  if (!invoices.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payments = await query(
    `SELECT id, amount, method, date, reference, created_at FROM payments WHERE invoice_id = $1 ORDER BY date DESC`,
    [id]
  );

  return NextResponse.json({ payments });
}
