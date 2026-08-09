import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/resend";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoices = await query(
    `SELECT i.*, c.name as customer_name, c.email as customer_email, u.company as user_company
     FROM invoices i
     LEFT JOIN customers c ON i.customer_id = c.id
     LEFT JOIN users u ON u.id = i.user_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [id, session.userId]
  );
  if (!invoices.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoice = invoices[0] as Record<string, unknown>;
  const customerEmail = invoice.customer_email as string | null;

  if (!customerEmail) {
    return NextResponse.json({ error: "Customer has no email address" }, { status: 400 });
  }

  const items = await query(
    `SELECT description, quantity, unit_price, total FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at`,
    [id]
  );

  const itemsHtml = items.map((item: Record<string, unknown>) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">$${item.total}</td>
    </tr>
  `).join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #1a1a1a; font-size: 24px;">Invoice ${invoice.invoice_number}</h1>
      <p>Hi ${invoice.customer_name},</p>
      <p>Here's your invoice for <strong>$${invoice.total}</strong>, due on <strong>${invoice.due_date}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <thead>
          <tr style="border-bottom: 2px solid #333;">
            <th style="text-align: left; padding: 8px 0;">Description</th>
            <th style="text-align: center; padding: 8px 0;">Qty</th>
            <th style="text-align: right; padding: 8px 0;">Rate</th>
            <th style="text-align: right; padding: 8px 0;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="text-align: right; margin-top: 16px;">
        <p>Subtotal: <strong>$${invoice.subtotal}</strong></p>
        <p>Tax (${invoice.tax_rate}%): <strong>$${invoice.tax_amount}</strong></p>
        <p style="font-size: 18px;">Total: <strong>$${invoice.total}</strong></p>
      </div>
      ${invoice.notes ? `<p style="margin-top: 24px; color: #666; font-size: 14px;">Note: ${invoice.notes}</p>` : ""}
      <p style="margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pay/${id}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Pay Online</a>
      </p>
      <p style="color: #666; font-size: 14px; margin-top: 32px;">Thank you for your business!</p>
    </div>
  `;

  try {
    await sendEmail({
      to: customerEmail,
      subject: `Invoice ${invoice.invoice_number} from ${invoice.user_company || 'TradeDesk'}`,
      html,
    });

    // Update invoice status to sent if it was draft
    if (invoice.status === "draft") {
      await query(`UPDATE invoices SET status = 'sent', updated_at = NOW() WHERE id = $1`, [id]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
