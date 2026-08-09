'use client';

import { useState } from 'react';

interface InvoicePayClientProps {
  invoice: {
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
  };
  items: { description: string; quantity: number; unit_price: number; total: number }[];
  payments: { amount: number; method: string; date: string; reference: string | null }[];
  totalPaid: number;
  balance: number;
  shareToken: string;
  justPaid: boolean;
  bankDetails?: {
    bankName: string | null;
    accountName: string | null;
    routing: string | null;
    account: string | null;
    instructions: string | null;
  };
}

export default function InvoicePayClient({ invoice, items, payments, totalPaid, balance, shareToken, justPaid, bankDetails }: InvoicePayClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/invoice-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareToken }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start payment');
      }
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  const isPaid = invoice.status === 'paid' || balance <= 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {justPaid && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-green-800 font-medium">Payment received! Thank you.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="rounded-t-lg bg-slate-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">TradeDesk</h1>
              <p className="text-sm text-slate-400">Invoice #{invoice.invoice_number}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              isPaid ? 'bg-green-500/20 text-green-300' :
              invoice.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
              'bg-yellow-500/20 text-yellow-300'
            }`}>
              {isPaid ? 'PAID' : invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Invoice body */}
        <div className="rounded-b-lg bg-white border border-t-0 border-gray-200 p-6">
          {/* Bill To */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bill To</p>
            <p className="mt-1 text-lg font-medium text-gray-900">{invoice.customer_name || 'Customer'}</p>
            {invoice.customer_email && <p className="text-sm text-gray-600">{invoice.customer_email}</p>}
            {invoice.customer_address && <p className="text-sm text-gray-600">{invoice.customer_address}</p>}
          </div>

          {/* Dates */}
          <div className="flex gap-8 mb-6 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Issue Date</p>
              <p className="mt-1 text-gray-900">{new Date(invoice.issue_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Due Date</p>
              <p className="mt-1 text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 text-sm text-gray-900">{item.description}</td>
                  <td className="py-2 text-right text-sm text-gray-700">{item.quantity}</td>
                  <td className="py-2 text-right text-sm text-gray-700">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-2 text-right text-sm font-medium text-gray-900">${Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto max-w-xs space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.tax_rate) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                <span className="text-gray-900">${Number(invoice.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">${Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment summary */}
          {payments.length > 0 && (
            <div className="mb-6 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Payment History</h3>
              {payments.map((p, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{new Date(p.date).toLocaleDateString()} — {p.method}</span>
                  <span className="text-green-600 font-medium">${Number(p.amount).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t mt-2 pt-2 text-sm font-medium">
                <span className="text-gray-700">Total Paid</span>
                <span className="text-green-600">${totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700">Balance Due</span>
                <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>${balance.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6 border-t pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
              <p className="mt-1 text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {/* Pay button */}
          {!isPaid ? (
            <div className="space-y-3">
              {/* Payment method tabs */}
              <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    paymentMethod === 'card'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pay by Card
                </button>
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    paymentMethod === 'bank'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bank Transfer
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Redirecting to payment...' : `Pay $${balance.toFixed(2)} with Card`}
                </button>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Bank Transfer Details</h3>
                  {bankDetails?.bankName ? (
                    <div className="space-y-2 text-sm">
                      {bankDetails.bankName && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bank</span>
                          <span className="text-gray-900 font-medium">{bankDetails.bankName}</span>
                        </div>
                      )}
                      {bankDetails.accountName && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account Name</span>
                          <span className="text-gray-900 font-medium">{bankDetails.accountName}</span>
                        </div>
                      )}
                      {bankDetails.routing && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Routing Number</span>
                          <span className="text-gray-900 font-medium">{bankDetails.routing}</span>
                        </div>
                      )}
                      {bankDetails.account && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account Number</span>
                          <span className="text-gray-900 font-medium">{bankDetails.account}</span>
                        </div>
                      )}
                      {bankDetails.instructions && (
                        <p className="mt-3 text-xs text-gray-600 border-t pt-3">{bankDetails.instructions}</p>
                      )}
                      <p className="mt-3 text-xs text-gray-500">
                        Please include invoice #{invoice.invoice_number} as reference. Your invoice will be marked as paid once the transfer is confirmed.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Bank transfer details are not available. Please pay by card or contact the invoice sender.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-green-800 font-medium">This invoice has been paid in full. Thank you!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by <span className="font-medium text-gray-600">TradeDesk</span> · Secure payment via Stripe
        </p>
      </div>
    </div>
  );
}
