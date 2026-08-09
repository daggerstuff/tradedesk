import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdf from "@/lib/pdf/invoice";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  total: string | number;
  notes: string | null;
  company_name: string | null;
  user_company: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_address: string | null;
}

interface ItemRow {
  description: string;
  quantity: number;
  unit_price: number | string;
  total: number | string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invoices = await query<InvoiceRow>(
    `SELECT i.*, u.name as company_name, u.company as user_company,
            c.name as customer_name, c.email as customer_email, c.address as customer_address
     FROM invoices i
     JOIN users u ON i.user_id = u.id
     LEFT JOIN customers c ON i.customer_id = c.id
     WHERE i.share_token = $1`,
    [token]
  );

  if (!invoices.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoice = invoices[0];
  const items = await query<ItemRow>(
    "SELECT description, quantity, unit_price, total FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at",
    [invoice.id]
  );

  const pdf = await renderToBuffer(
    InvoicePdf({
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date?.split("T")[0] || "",
      dueDate: invoice.due_date?.split("T")[0] || "",
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.tax_rate),
      taxAmount: Number(invoice.tax_amount),
      total: Number(invoice.total),
      notes: invoice.notes,
      companyName: invoice.company_name || invoice.user_company,
      customerName: invoice.customer_name,
      customerEmail: invoice.customer_email,
      customerAddress: invoice.customer_address,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total: Number(item.total),
      })),
    })
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  });
}
