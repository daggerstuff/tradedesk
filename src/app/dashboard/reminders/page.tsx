'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ReminderTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  days_before_due: number;
  is_active: boolean;
}

interface SentReminder {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  sent_at: string;
  status: string;
  template_name: string | null;
}

export default function RemindersPage() {
  const [tab, setTab] = useState<'templates' | 'sent'>('templates');
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [sentLog, setSentLog] = useState<SentReminder[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, activeTemplates: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    days_before_due: 3,
  });

  const fetchData = async () => {
    try {
      const [templatesRes, sentRes, statsRes] = await Promise.all([
        fetch('/api/reminder-templates'),
        fetch('/api/reminders/sent'),
        fetch('/api/reminders/stats'),
      ]);
      const templatesData = await templatesRes.json();
      const sentData = await sentRes.json();
      const statsData = await statsRes.json();
      setTemplates(templatesData.templates || []);
      setSentLog(sentData.reminders || []);
      setStats(statsData);
    } catch {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/reminder-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success('Template created');
      setShowForm(false);
      setForm({ name: '', subject: '', body: '', days_before_due: 3 });
      fetchData();
    } else {
      toast.error('Failed to create template');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/reminder-templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/reminder-templates/${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Reminders</h1>
          <p className="text-sm text-gray-500 mt-1">Automated payment reminders for your customers</p>
        </div>
        {tab === 'templates' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {showForm ? 'Cancel' : '+ New Template'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Reminders Sent</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Templates</p>
          <p className="text-2xl font-bold text-green-600">{stats.activeTemplates}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('templates')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'templates' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'sent' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Sent Log
        </button>
      </div>

      {/* Templates Tab */}
      {tab === 'templates' && (
        <>
          {showForm && (
            <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                  <input type="text" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. 3 days before due" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Before Due *</label>
                  <input type="number" min="0" required value={form.days_before_due}
                    onChange={e => setForm({ ...form, days_before_due: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line *</label>
                <input type="text" required value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Reminder: Invoice {{invoice_number}} due soon" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Body *</label>
                <textarea required rows={5} value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={'Hi {{customer_name}},\n\nThis is a reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.\n\nThank you!'} />
                <p className="text-xs text-gray-500 mt-1">
                  Variables: {'{{customer_name}}'}, {'{{invoice_number}}'}, {'{{amount}}'}, {'{{due_date}}'}, {'{{business_name}}'}
                </p>
              </div>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Create Template
              </button>
            </form>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {templates.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">&#128225;</div>
                <p className="text-gray-500 mb-2">No reminder templates yet</p>
                <p className="text-sm text-gray-400">Create one to start sending automatic payment reminders when invoices are due.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {templates.map(t => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{t.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {t.days_before_due === 0 ? 'On due date' : `${t.days_before_due} days before`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">{t.subject}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={() => toggleActive(t.id, t.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${t.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {t.is_active ? 'Active' : 'Paused'}
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-500 transition-colors text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Sent Log Tab */}
      {tab === 'sent' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {sentLog.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">&#128203;</div>
              <p className="text-gray-500 mb-2">No reminders sent yet</p>
              <p className="text-sm text-gray-400">Reminders will appear here automatically when they're sent.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Template</th>
                  <th className="px-4 py-3">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sentLog.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-sm">{r.invoice_number}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{r.customer_name}</div>
                      <div className="text-xs text-gray-400">{r.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">{r.subject}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.template_name || 'Manual'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.sent_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
