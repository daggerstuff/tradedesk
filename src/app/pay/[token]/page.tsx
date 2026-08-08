import { queryOne, queryMany } from '@/lib/db';
import InvoicePayClient from './InvoicePayClient';

export default async function InvoicePayPage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { token } = await params;
  const { paid } = await searchParams;

  const invoice = await queryOne(`
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

  const items = await queryMany(
    'SELECT description, quantity, unit_price, total FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at',
    [invoice.id]
  );

  const payments = await queryMany(
    'SELECT amount, method, date, reference FROM payments WHERE invoice_id = $1 ORDER BY date DESC',
    [invoice.id]
  );

  const totalPaid = payments.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
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
