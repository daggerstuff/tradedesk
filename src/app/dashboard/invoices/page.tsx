'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import RecurringInvoices from './recurring';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_id: string;
  total: string;
  status: string;
  due_date: string;
  issue_date: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUSES = ['all', 'draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetch('/api/invoices')
      .then(r => r.json())
      .then(data => {
        setInvoices(data.invoices || []);
        setLoading(false);
      });
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, string>();
    invoices.forEach(inv => map.set(inv.customer_id, inv.customer_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (customerFilter !== 'all' && inv.customer_id !== customerFilter) return false;
      if (search && !inv.invoice_number.toLowerCase().includes(search.toLowerCase()) && !inv.customer_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom && inv.issue_date < dateFrom) return false;
      if (dateTo && inv.issue_date > dateTo) return false;
      return true;
    });
  }, [invoices, statusFilter, customerFilter, search, dateFrom, dateTo]);

  const totalAmount = filtered.reduce((s, inv) => s + parseFloat(inv.total), 0);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''} · ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} total</p>
        </div>
        <Link href="/dashboard/invoices/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          + Create Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search invoices..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm w-48"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="all">All Customers</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="From" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="To" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">{invoices.length === 0 ? 'No invoices yet. Create your first invoice to get started.' : 'No invoices match your filters.'}</p>
          {invoices.length === 0 && (
            <Link href="/dashboard/invoices/new" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              + Create Invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{inv.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">${parseFloat(inv.total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-700"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10">
        <RecurringInvoices />
      </div>
    </div>
  );
}
