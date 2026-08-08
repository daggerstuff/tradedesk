'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ReminderTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  days_before_due: number;
  is_active: boolean;
}

export default function ReminderTemplatesPage() {
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    days_before_due: 3,
  });

  const fetchTemplates = () => {
    fetch('/api/reminder-templates')
      .then(r => r.json())
      .then(data => {
        setTemplates(data.templates || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchTemplates(); }, []);

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
      fetchTemplates();
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
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/reminder-templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reminder Templates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="3 days before due" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input type="text" required value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Reminder: Invoice {invoice_number} due soon" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
            <textarea required rows={5} value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder={'Hi {customer_name},\n\nThis is a reminder that invoice {invoice_number} for ${'total'} is due on {due_date}.\n\nThank you!'} />
            <p className="text-xs text-gray-500 mt-1">
              Variables: {'{customer_name}, {invoice_number}, {total}, {due_date}, {issue_date}'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days Before Due *</label>
            <input type="number" min="0" required value={form.days_before_due}
              onChange={e => setForm({ ...form, days_before_due: parseInt(e.target.value) })}
              className="w-32 rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Create Template
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No reminder templates yet. Create one to start sending automatic reminders.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm text-gray-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Days Before</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.days_before_due}</td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{t.subject}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(t.id, t.is_active)}
                      className={`px-2 py-1 rounded-full text-xs ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
