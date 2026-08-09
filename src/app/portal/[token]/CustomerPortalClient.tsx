"use client";

import Link from "next/link";

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

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CustomerPortalClient({
  customer,
  invoices,
  totalOwed,
  totalPaid,
}: {
  customer: CustomerData;
  invoices: InvoiceData[];
  totalOwed: number;
  totalPaid: number;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Customer Portal</h1>
          <p className="text-slate-600 mt-1">
            Welcome, {customer.name}
            {customer.company_name && ` (${customer.company_name})`}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-sm text-slate-500 font-medium">Outstanding Balance</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalOwed)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-sm text-slate-500 font-medium">Total Paid</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {formatCurrency(totalPaid)}
            </p>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Your Invoices</h2>
          </div>

          {invoices.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-500">
              No invoices yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        #{invoice.invoice_number}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          STATUS_STYLES[invoice.status] || STATUS_STYLES.draft
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Issued {formatDate(invoice.issue_date)}
                      {invoice.due_date && ` · Due ${formatDate(invoice.due_date)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(Number(invoice.total))}
                    </span>
                    <Link
                      href={`/pay/${invoice.share_token}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                      {invoice.status === "paid" ? "View" : "Pay"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-400">
        Powered by TradeDesk
      </footer>
    </div>
  );
}
