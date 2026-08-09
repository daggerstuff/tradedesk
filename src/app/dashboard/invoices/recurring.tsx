'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface RecurringItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface RecurringInvoice {
  id: string;
  customer_id: string;
  customer_name: string;
  invoice_number_prefix: string;
  frequency: string;
  day_of_month: number;
  start_date: string;
  end_date: string | null;
  tax_rate: number;
  notes: string | null;
  last_generated: string | null;
  is_active: boolean;
  items: RecurringItem[];
}

export default function RecurringInvoices() {
  const [recurring, setRecurring] = useState<RecurringInvoice[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringInvoice | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    invoiceNumberPrefix: 'INV',
    frequency: 'monthly',
    dayOfMonth: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    taxRate: 0,
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }] as { description: string; quantity: number; unitPrice: number }[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [rRes, cRes] = await Promise.all([
      fetch('/api/recurring-invoices'),
      fetch('/api/customers'),
    ]);
    const rData = await rRes.json();
    const cData = await cRes.json();
    setRecurring(rData.recurring || []);
    setCustomers(cData.customers || []);
  };

  const handleSubmit = async () => {
    if (!form.customerId || !form.startDate || !form.items.length) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    const url = editing ? `/api/recurring-invoices/${editing.id}` : '/api/recurring-invoices';
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: form.customerId,
        invoiceNumberPrefix: form.invoiceNumberPrefix,
        frequency: form.frequency,
        dayOfMonth: form.dayOfMonth,
        startDate: form.startDate,
        endDate: form.endDate || null,
        taxRate: form.taxRate,
        notes: form.notes,
        items: form.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
      }),
    });
    if (res.ok) {
      toast.success(editing ? 'Recurring invoice updated' : 'Recurring invoice created');
      setShowForm(false);
      setEditing(null);
      resetForm();
      fetchData();
    } else {
      toast.error('Failed to save');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring invoice?')) return;
    const res = await fetch(`/api/recurring-invoices/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Deleted');
      fetchData();
    }
  };

  const handleToggleActive = async (inv: RecurringInvoice) => {
    await fetch(`/api/recurring-invoices/${inv.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !inv.is_active }),
    });
    fetchData();
  };

  const handleEdit = (inv: RecurringInvoice) => {
    setEditing(inv);
    setForm({
      customerId: inv.customer_id,
      invoiceNumberPrefix: inv.invoice_number_prefix,
      frequency: inv.frequency,
      dayOfMonth: inv.day_of_month,
      startDate: inv.start_date?.split('T')[0] || '',
      endDate: inv.end_date?.split('T')[0] || '',
      taxRate: Number(inv.tax_rate),
      notes: inv.notes || '',
      items: inv.items?.map(i => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unit_price) })) || [{ description: '', quantity: 1, unitPrice: 0 }],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      customerId: '',
      invoiceNumberPrefix: 'INV',
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      taxRate: 0,
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0 }] });
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItem = (idx: number, field: string, value: string | number) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recurring Invoices</h2>
        <button
          onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add Recurring
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-md font-medium mb-4">{editing ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
              <input type="text" value={form.invoiceNumberPrefix} onChange={e => setForm({ ...form, invoiceNumberPrefix: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="INV" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month *</label>
              <input type="number" min={1} max={31} value={form.dayOfMonth} onChange={e => setForm({ ...form, dayOfMonth: parseInt(e.target.value) || 1 })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input type="number" step="0.01" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
            {form.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="flex-1 rounded-md border border-gray-300 px-3 py-2" />
                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-20 rounded-md border border-gray-300 px-3 py-2" />
                <input type="number" step="0.01" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-28 rounded-md border border-gray-300 px-3 py-2" />
                {form.items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="px-2 text-red-600 hover:text-red-800">✕</button>
                )}
              </div>
            ))}
            <button onClick={addItem} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add item</button>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {recurring.length === 0 ? (
        <p className="text-gray-500 text-sm">No recurring invoices set up yet.</p>
      ) : (
        <div className="space-y-3">
          {recurring.map(inv => (
            <div key={inv.id} className={`rounded-lg border p-4 ${inv.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{inv.customer_name}</p>
                  <p className="text-sm text-gray-500">
                    {inv.frequency} · Day {inv.day_of_month} · {inv.invoice_number_prefix}
                    {inv.items?.length ? ` · ${inv.items.length} item${inv.items.length > 1 ? 's' : ''}` : ''}
                  </p>
                  {inv.last_generated && (
                    <p className="text-xs text-gray-400 mt-1">Last generated: {new Date(inv.last_generated).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleActive(inv)} className={`px-2 py-1 text-xs rounded ${inv.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {inv.is_active ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => handleEdit(inv)} className="text-sm text-indigo-600 hover:text-indigo-800">Edit</button>
                  <button onClick={() => handleDelete(inv.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
