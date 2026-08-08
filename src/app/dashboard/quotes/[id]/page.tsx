'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quote {
  id: string;
  customer_id: string;
  customer_name: string;
  quote_number: string;
  status: string;
  issue_date: string;
  expiry_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
}
interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}
interface Customer { id: string; name: string; }

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
  invoiced: 'bg-indigo-100 text-indigo-700',
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetch(`/api/quotes/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setQuote(data.quote);
        setItems(data.items || []);
      });
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => setCustomers(data.customers || []));
  }, [params.id]);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch(`/api/quotes/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: quote?.customer_id,
        quoteNumber: quote?.quote_number,
        issueDate: quote?.issue_date,
        expiryDate: quote?.expiry_date,
        items: items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unit_price })),
        notes: quote?.notes,
        taxRate: quote?.tax_rate,
        status: quote?.status,
      }),
    });
    if (res.ok) {
      setEditing(false);
      window.location.reload();
    } else {
      alert('Failed to update quote');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this quote?')) return;
    const res = await fetch(`/api/quotes/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/dashboard/quotes');
  };

  const handleConvert = async () => {
    if (!confirm('Convert this quote to an invoice?')) return;
    setConverting(true);
    const res = await fetch(`/api/quotes/${params.id}/convert`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      router.push(`/dashboard/invoices/${data.invoiceId}`);
    } else {
      alert('Failed to convert quote');
    }
    setConverting(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/quotes/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: quote?.customer_id,
        quoteNumber: quote?.quote_number,
        issueDate: quote?.issue_date,
        expiryDate: quote?.expiry_date,
        items: items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unit_price })),
        notes: quote?.notes,
        taxRate: quote?.tax_rate,
        status: newStatus,
      }),
    });
    if (res.ok) {
      setQuote({ ...quote!, status: newStatus });
    }
  };

  if (!quote) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/quotes" className="text-gray-600 hover:text-gray-900">← Back</Link>
            <h1 className="text-2xl font-bold text-gray-900">{quote.quote_number}</h1>
            <span className={`px-3 py-1 rounded text-xs font-medium ${STATUS_COLORS[quote.status] || 'bg-gray-100'}`}>
              {quote.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {quote.status !== 'invoiced' && (
            <button onClick={handleConvert} disabled={converting}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50">
              {converting ? 'Converting...' : 'Convert to Invoice'}
            </button>
          )}
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500">Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Status buttons */}
      {quote.status !== 'invoiced' && (
        <div className="flex gap-2 mb-6">
          {['draft', 'sent', 'accepted', 'rejected'].map(s => (
            <button key={s} onClick={() => handleStatusChange(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                quote.status === s ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Customer</label>
            {editing ? (
              <select value={quote.customer_id} onChange={e => setQuote({ ...quote, customer_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1">
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <p className="text-gray-900">{quote.customer_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Quote #</label>
            {editing ? (
              <input type="text" value={quote.quote_number} onChange={e => setQuote({ ...quote, quote_number: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1" />
            ) : (
              <p className="text-gray-900">{quote.quote_number}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Issue Date</label>
            {editing ? (
              <input type="date" value={quote.issue_date?.split('T')[0]} onChange={e => setQuote({ ...quote, issue_date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1" />
            ) : (
              <p className="text-gray-900">{quote.issue_date?.split('T')[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Expiry Date</label>
            {editing ? (
              <input type="date" value={quote.expiry_date?.split('T')[0]} onChange={e => setQuote({ ...quote, expiry_date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1" />
            ) : (
              <p className="text-gray-900">{quote.expiry_date?.split('T')[0] || "—"}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Line Items</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 text-sm text-gray-900">{item.description}</td>
                  <td className="py-2 text-right text-sm text-gray-700">{item.quantity}</td>
                  <td className="py-2 text-right text-sm text-gray-700">${item.unit_price?.toFixed(2)}</td>
                  <td className="py-2 text-right text-sm text-gray-700">${item.total?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${quote.subtotal?.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax ({quote.tax_rate}%)</span><span>${quote.tax_amount?.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>${quote.total?.toFixed(2)}</span></div>
          </div>
        </div>

        {quote.notes && (
          <div>
            <label className="block text-sm font-medium text-gray-500">Notes</label>
            <p className="text-gray-900 mt-1">{quote.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
