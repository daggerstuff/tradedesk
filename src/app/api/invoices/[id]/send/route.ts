import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePdf from '@/lib/pdf/invoice';
import { sendEmailWithAttachments, invoiceEmailHtml } from '@/lib/invoice-email';

export const dynamic = 'force-dynamic';

interface InvoiceRow {
  id: string;
  user_id: string;
  customer_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  status: string;
  notes: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_company: string | null;
  customer_address: string | null;
  user_name: string | null;
  user_company: string | null;
}

interface InvoiceItemRow {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  let toOverride: string | null = null;
  try {
    const body = await req.json();
    toOverride = body?.to || null;
  } catch {
    // no body
  }

  const invoices = await query<InvoiceRow>(
    `SELECT i.*, c.name as customer_name, c.email as customer_email,
            c.company_name as customer_company, c.address as customer_address,
            u.name as user_name, u.company as user_company
     FROM invoices i
     LEFT JOIN customers c ON i.customer_id = c.id
     LEFT JOIN users u ON i.user_id = u.id
     WHERE i.id = $1 AND i.user_id = $2`,
    [id, session.userId]
  );

  if (!invoices.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const invoice = invoices[0];
  const recipientEmail = toOverride || invoice.customer_email;

  if (!recipientEmail) {
    return NextResponse.json({ error: 'Customer has no email address. Provide an email via the "to" field.' }, { status: 400 });
  }

  const items = await query<InvoiceItemRow>(
    'SELECT description, quantity, unit_price, total FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at',
    [id]
  );

  const pdfBuffer = await renderToBuffer(
    InvoicePdf({
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date?.split('T')[0] || '',
      dueDate: invoice.due_date?.split('T')[0] || '',
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.tax_rate),
      taxAmount: Number(invoice.tax_amount),
      total: Number(invoice.total),
      notes: invoice.notes,
      companyName: invoice.user_name || invoice.user_company || null,
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

  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(invoice.total));
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const result = await sendEmailWithAttachments({
    to: recipientEmail,
    subject: `Invoice ${invoice.invoice_number} — ${amount} due ${dueDate}`,
    html: invoiceEmailHtml(invoice.invoice_number, amount, dueDate, invoice.customer_name || ''),
    attachments: [
      {
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  });

  if (result.error) {
    return NextResponse.json({ error: 'Failed to send email', details: result.error }, { status: 500 });
  }

  if (invoice.status === 'draft') {
    await query("UPDATE invoices SET status = 'sent', updated_at = NOW() WHERE id = $1", [id]);
  }

  return NextResponse.json({ success: true, emailId: result.data?.id });
}
