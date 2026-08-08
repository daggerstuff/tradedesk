'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer { id: string; name: string; }

export default function NewQuotePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [quoteNumber, setQuoteNumber] = useState(`QT-${Date.now().toString().slice(-6)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => setCustomers(data.customers || []));
  }, []);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: string | number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * taxRate / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, quoteNumber, issueDate, expiryDate, items, notes, taxRate }),
    });
    if (res.ok) {
      router.push('/dashboard/quotes');
    } else {
      alert('Failed to create quote');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/quotes" className="text-gray-600 hover:text-gray-900">← Back</Link>
        <h1 className="text-2xl font-bold text-gray-900">New Quote</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select required value={customerId} onChange={e => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote #</label>
              <input type="text" required value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input type="date" required value={issueDate} onChange={e => setIssueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Line Items</h2>
            <button type="button" onClick={addItem} className="text-sm text-indigo-600 hover:text-indigo-500">+ Add item</button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <input type="text" placeholder="Description" value={item.description}
                  onChange={e => updateItem(idx, 'description', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2" required />
                <input type="number" step="0.01" placeholder="Qty" value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-20 rounded-lg border border-gray-300 px-3 py-2" required />
                <input type="number" step="0.01" placeholder="Price" value={item.unitPrice}
                  onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2" required />
                <span className="w-24 text-right text-sm text-gray-700 pt-2">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)}
                    className="text-red-500 hover:text-red-700 pt-2">×</button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex items-center gap-2 text-gray-600">
                <span>Tax %</span>
                <input type="number" step="0.01" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm" />
                <span className="ml-auto">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Terms, payment info, etc." />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Quote'}
          </button>
          <Link href="/dashboard/quotes" className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
