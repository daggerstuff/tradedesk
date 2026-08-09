import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/resend";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoices = await query(
    `SELECT i.*, c.name as customer_name, c.email as customer_email, c.portal_token, u.company as user_company, u.name as user_name
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tradedesk.app";
  const payUrl = invoice.share_token ? `${appUrl}/pay/${invoice.share_token}` : `${appUrl}/pay/${id}`;
  const portalUrl = invoice.portal_token ? `${appUrl}/portal/${invoice.portal_token}` : null;
  const senderName = invoice.user_company || invoice.user_name || "TradeDesk";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
    <body style="margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1e293b; font-size: 28px; margin: 0;">Invoice ${invoice.invoice_number}</h1>
          <p style="color: #64748b; margin: 8px 0 0;">from ${senderName}</p>
        </div>

        <!-- Main Card -->
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="color: #334155; font-size: 16px; margin: 0 0 8px;">Hi ${invoice.customer_name},</p>
          <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">Here's your invoice for <strong style="color: #1e293b;">$${invoice.total}</strong>, due <strong style="color: #1e293b;">${invoice.due_date}</strong>.</p>

          <!-- Line Items -->
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="text-align: left; padding: 12px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                <th style="text-align: center; padding: 12px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                <th style="text-align: right; padding: 12px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Rate</th>
                <th style="text-align: right; padding: 12px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <!-- Totals -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: right;">
            <p style="margin: 4px 0; color: #64748b; font-size: 14px;">Subtotal: <span style="color: #1e293b;">$${invoice.subtotal}</span></p>
            <p style="margin: 4px 0; color: #64748b; font-size: 14px;">Tax (${invoice.tax_rate}%): <span style="color: #1e293b;">$${invoice.tax_amount}</span></p>
            <p style="margin: 8px 0 0; font-size: 20px; font-weight: 700; color: #1e293b;">Total: $${invoice.total}</p>
          </div>

          ${invoice.notes ? `<p style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; color: #64748b; font-size: 14px;"><strong>Note:</strong> ${invoice.notes}</p>` : ""}

          <!-- CTA -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${payUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Pay Now</a>
          </div>
        </div>

        <!-- Portal Link -->
        ${portalUrl ? `<p style="text-align: center; margin-top: 24px; font-size: 14px; color: #64748b;"><a href="${portalUrl}" style="color: #4f46e5;">View all your invoices in your customer portal</a></p>` : ""}

        <!-- Footer -->
        <p style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 32px;">Thank you for your business!</p>
      </div>
    </body>
    </html>
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
