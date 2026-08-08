'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Customer { id: string; name: string; }
interface Invoice {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  notes: string | null;
}
interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
  reference: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setInvoice(data.invoice);
        setItems(data.items?.map((i: LineItem) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          total: i.total,
        })) || []);
      });
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => setCustomers(data.customers || []));
    fetch(`/api/invoices/${params.id}/payments`)
      .then(r => r.json())
      .then(data => {
        setPayments(data.payments || []);
        setTotalPaid(data.totalPaid || 0);
      });
  }, [params.id]);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch(`/api/invoices/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: invoice?.customer_id,
        invoiceNumber: invoice?.invoice_number,
        issueDate: invoice?.issue_date,
        dueDate: invoice?.due_date,
        items,
        notes: invoice?.notes,
        taxRate: invoice?.tax_rate,
        status: invoice?.status,
      }),
    });
    if (res.ok) {
      toast.success('Invoice updated');
      setEditing(false);
    } else {
      toast.error('Failed to update');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this invoice?')) return;
    const res = await fetch(`/api/invoices/${params.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Invoice deleted');
      router.push('/dashboard/invoices');
    }
  };

  if (!invoice) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const balance = (invoice.total || 0) - totalPaid;

  const handleRecordPayment = async () => {
    setPayLoading(true);
    const res = await fetch(`/api/invoices/${params.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(payAmount), method: payMethod, date: payDate, reference: payRef }),
    });
    if (res.ok) {
      const data = await res.json();
      setTotalPaid(data.totalPaid || (totalPaid + parseFloat(payAmount)));
      setPayments([{ id: data.payment?.id || 'new', amount: parseFloat(payAmount), method: payMethod, date: payDate, reference: payRef }, ...payments]);
      setPayAmount('');
      setPayRef('');
      setShowPaymentForm(false);
      window.location.reload();
    } else {
      alert('Failed to record payment');
    }
    setPayLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.status] || 'bg-gray-100'}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/invoices" className="text-gray-600 hover:text-gray-900">← Back</Link>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Edit</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Customer</label>
            {editing ? (
              <select
                value={invoice.customer_id}
                onChange={e => setInvoice({ ...invoice, customer_id: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 mt-1"
              >
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <p className="text-gray-900">{invoice.customer_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Invoice #</label>
            {editing ? (
              <input type="text" value={invoice.invoice_number}
                onChange={e => setInvoice({ ...invoice, invoice_number: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 mt-1" />
            ) : (
              <p className="text-gray-900">{invoice.invoice_number}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Issue Date</label>
            {editing ? (
              <input type="date" value={invoice.issue_date?.split('T')[0]}
                onChange={e => setInvoice({ ...invoice, issue_date: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 mt-1" />
            ) : (
              <p className="text-gray-900">{invoice.issue_date?.split('T')[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Due Date</label>
            {editing ? (
              <input type="date" value={invoice.due_date?.split('T')[0]}
                onChange={e => setInvoice({ ...invoice, due_date: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 mt-1" />
            ) : (
              <p className="text-gray-900">{invoice.due_date?.split('T')[0]}</p>
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
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">${item.unit_price?.toFixed(2)}</td>
                  <td className="py-2 text-right">${(item.quantity * item.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${invoice.subtotal?.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax ({invoice.tax_rate}%)</span><span>${invoice.tax_amount?.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>${invoice.total?.toFixed(2)}</span></div>
          </div>
        </div>

        {invoice.notes && (
          <div>
            <label className="block text-sm font-medium text-gray-500">Notes</label>
            <p className="text-gray-900 mt-1">{invoice.notes}</p>
          </div>
        )}

        {/* Payments section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Payments</h3>
            <button onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="text-sm text-indigo-600 hover:text-indigo-500">
              {showPaymentForm ? 'Cancel' : '+ Record Payment'}
            </button>
          </div>

          {/* Balance summary */}
          <div className="flex gap-6 mb-4 text-sm">
            <div><span className="text-gray-500">Invoice Total: </span><span className="font-medium text-gray-900">${invoice.total?.toFixed(2)}</span></div>
            <div><span className="text-gray-500">Paid: </span><span className="font-medium text-green-600">${totalPaid.toFixed(2)}</span></div>
            <div><span className="text-gray-500">Balance: </span><span className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>${balance.toFixed(2)}</span></div>
          </div>

          {/* Payment form */}
          {showPaymentForm && (
            <div className="rounded-lg border border-gray-200 p-4 mb-3 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="number" step="0.01" placeholder="Amount" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="stripe">Stripe</option>
                </select>
                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input type="text" placeholder="Reference (optional)" value={payRef} onChange={e => setPayRef(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <button onClick={handleRecordPayment} disabled={payLoading || !payAmount}
                className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                {payLoading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          )}

          {/* Payment history */}
          {payments.length > 0 && (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Reference</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2 text-sm text-gray-700">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-2 text-sm text-gray-700 capitalize">{p.method}</td>
                    <td className="py-2 text-sm text-gray-500">{p.reference || '—'}</td>
                    <td className="py-2 text-right text-sm font-medium text-green-600">${Number(p.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
