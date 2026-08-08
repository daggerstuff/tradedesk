import { queryOne, queryMany } from '@/lib/db';
import InvoicePayClient from './InvoicePayClient';

interface InvoiceData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  notes: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_address: string | null;
}

interface InvoiceItemData {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PaymentData {
  amount: number;
  method: string;
  date: string;
  reference: string | null;
}

export default async function InvoicePayPage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { token } = await params;
  const { paid } = await searchParams;

  const invoice = await queryOne<InvoiceData>(`
    SELECT i.id, i.invoice_number, i.issue_date, i.due_date, i.subtotal, i.tax_rate, i.tax_amount, i.total, i.status, i.notes,
           c.name as customer_name, c.email as customer_email, c.address as customer_address
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.share_token = $1
  `, [token]);

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Invoice Not Found</h1>
          <p className="mt-2 text-slate-600">This invoice link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  const items = await queryMany<InvoiceItemData>(
    'SELECT description, quantity, unit_price, total FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at',
    [invoice.id]
  );

  const payments = await queryMany<PaymentData>(
    'SELECT amount, method, date, reference FROM payments WHERE invoice_id = $1 ORDER BY date DESC',
    [invoice.id]
  );

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Number(invoice.total) - totalPaid;

  return (
    <InvoicePayClient
      invoice={invoice}
      items={items}
      payments={payments}
      totalPaid={totalPaid}
      balance={balance}
      shareToken={token}
      justPaid={paid === '1'}
    />
  );
}
