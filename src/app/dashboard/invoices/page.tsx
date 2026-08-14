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
  share_token?: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  viewed: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-400', dot: 'bg-slate-300' },
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

  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailToast, setEmailToast] = useState<{ id: string; type: 'success' | 'error' } | null>(null);

  const handleSendEmail = async (invoiceId: string) => {
    setSendingEmail(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setEmailToast({ id: invoiceId, type: 'success' });
      } else {
        setEmailToast({ id: invoiceId, type: 'error' });
      }
    } catch {
      setEmailToast({ id: invoiceId, type: 'error' });
    }
    setSendingEmail(null);
    setTimeout(() => setEmailToast(null), 3000);
  };

  const copyShareLink = async (shareToken: string | undefined) => {
    if (!shareToken) return;
    const url = `${window.location.origin}/pay/${shareToken}`;
    await navigator.clipboard.writeText(url);
  };

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
  const paidAmount = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total), 0);
  const overdueCount = filtered.filter(i => i.status === 'overdue').length;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-1">
            {filtered.length} invoice{filtered.length !== 1 ? 's' : ''} · ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
          </p>
        </div>
        <Link href="/dashboard/invoices/new" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-[0.98]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">${totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Collected</p>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">${paidAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Overdue</p>
          <p className={`text-lg font-bold mt-0.5 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdueCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10">
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10">
          <option value="all">All Customers</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">
            {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your filters'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {invoices.length === 0 ? 'Create your first invoice to get started.' : 'Try adjusting your search or filters.'}
          </p>
          {invoices.length === 0 && (
            <Link href="/dashboard/invoices/new" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Invoice</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Due Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {/* Rows */}
          {filtered.map((inv, i) => {
            const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
            return (
              <div
                key={inv.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors animate-fade-in-up opacity-0"
                style={{ animationDelay: `${Math.min(i * 30, 200)}ms`, animationFillMode: "forwards" }}
              >
                <div className="sm:col-span-2 flex items-center">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">{inv.invoice_number}</Link>
                </div>
                <div className="sm:col-span-2 flex items-center">
                  <span className="text-sm text-slate-700">{inv.customer_name}</span>
                </div>
                <div className="sm:col-span-2 flex items-center sm:justify-end">
                  <span className="text-sm font-semibold text-slate-900">${parseFloat(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="sm:col-span-2 flex items-center">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${statusCfg.bg} ${statusCfg.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </div>
                <div className="sm:col-span-2 flex items-center sm:justify-end">
                  <span className="text-sm text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                </div>
                <div className="sm:col-span-2 flex items-center justify-end gap-1">
                  {inv.share_token && (
                    <button
                      onClick={(e) => { e.stopPropagation(); copyShareLink(inv.share_token); }}
                      title="Copy payment link"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSendEmail(inv.id); }}
                    disabled={sendingEmail === inv.id}
                    title="Send via email"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    {sendingEmail === inv.id ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  {emailToast?.id === inv.id && (
                    <span className={`text-xs font-medium ${emailToast.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {emailToast.type === 'success' ? 'Sent!' : 'Failed'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recurring section */}
      <div className="mt-8">
        <RecurringInvoices />
      </div>
    </div>
  );
}
