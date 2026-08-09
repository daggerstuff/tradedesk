import { queryOne, queryMany } from '@/lib/db';
import CustomerPortalClient from './CustomerPortalClient';

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
  share_token: string;
}

interface CustomerData {
  id: string;
  name: string;
  email: string | null;
  company_name: string | null;
}

export default async function CustomerPortalPage({ params }: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const customer = await queryOne<CustomerData>(
    'SELECT id, name, email, company_name FROM customers WHERE portal_token = $1',
    [token]
  );

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Portal Not Found</h1>
          <p className="mt-2 text-slate-600">This portal link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  const invoices = await queryMany<InvoiceData>(`
    SELECT i.id, i.invoice_number, i.issue_date, i.due_date, i.subtotal, i.tax_rate, i.tax_amount, i.total, i.status, i.notes, i.share_token
    FROM invoices i
    WHERE i.customer_id = $1
    ORDER BY i.issue_date DESC
  `, [customer.id]);

  const totalOwed = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <CustomerPortalClient
      customer={customer}
      invoices={invoices}
      totalOwed={totalOwed}
      totalPaid={totalPaid}
    />
  );
}
