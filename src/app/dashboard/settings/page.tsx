'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PLAN_INFO: Record<string, { name: string; price: string; limits: string }> = {
  free: { name: 'Free', price: '$0/mo', limits: '5 customers, 5 invoices/mo' },
  invoice_reminders: { name: 'Invoice Reminders', price: '$19/mo', limits: '50 customers, 50 invoices/mo, reminders' },
  field_service: { name: 'Field Service', price: '$15/mo', limits: '50 customers, 50 invoices/mo, 100 jobs' },
  compliance: { name: 'Compliance', price: '$49/mo', limits: 'Unlimited invoices, compliance tracking' },
};

interface Subscription {
  id: string;
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  current_period_end: string | null;
}
interface User {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        setUser(data.user);
        setSubscription(data.subscription);
        setLoading(false);
      });
  }, []);

  const handleUpgrade = async (planId: string) => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to start checkout');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to open billing portal');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const currentPlan = PLAN_INFO[subscription?.plan ?? 'free'] ?? PLAN_INFO.free;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="text-gray-900">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Company</label>
            <p className="text-gray-900">{user?.company || '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Company Settings</h2>
        <CompanySection />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Subscription</h2>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {currentPlan.name}
          </span>
          <span className="text-sm text-gray-500">{currentPlan.price}</span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {subscription?.status || 'inactive'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">{currentPlan.limits}</p>

        {subscription?.current_period_end && (
          <p className="text-sm text-gray-600 mb-4">
            Current period ends: {subscription.current_period_end.split('T')[0]}
          </p>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {(subscription?.plan ?? 'free') !== 'invoice_reminders' && (
              <button
                onClick={() => handleUpgrade('invoice_reminders')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Invoice Reminders ($19/mo)
              </button>
            )}
            {(subscription?.plan ?? 'free') !== 'compliance' && (
              <button
                onClick={() => handleUpgrade('compliance')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Compliance ($49/mo)
              </button>
            )}
            {(subscription?.plan ?? 'free') !== 'field_service' && (
              <button
                onClick={() => handleUpgrade('field_service')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Field Service ($15/mo)
              </button>
            )}
          </div>

          {subscription?.stripe_customer_id && (
            <button
              onClick={handleManageBilling}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">QuickBooks</h2>
        <QuickBooksSection />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Referrals</h2>
        <ReferralSection />
      </div>
    </div>
  );
}

function QuickBooksSection() {
  const [connected, setConnected] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const [importingExpenses, setImportingExpenses] = useState(false);
  const [importedExpenses, setImportedExpenses] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('qb') === 'connected') {
      setConnected(true);
      toast.success('QuickBooks connected!');
    }
  }, []);

  async function handleImport() {
    setImporting(true);
    const res = await fetch('/api/quickbooks/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'customers' }) });
    const data = await res.json();
    setImported(data.imported || 0);
    setImporting(false);
    toast.success(`Imported ${data.imported || 0} customers`);
  }

  async function handleImportExpenses() {
    setImportingExpenses(true);
    const res = await fetch('/api/quickbooks/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'expenses' }) });
    const data = await res.json();
    setImportedExpenses(data.imported || 0);
    setImportingExpenses(false);
    toast.success(`Imported ${data.imported || 0} expenses`);
  }

  if (!connected) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Connect your QuickBooks account to import customers and expenses.
        </p>
        <a
          href="/api/quickbooks/connect"
          className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
        >
          Connect QuickBooks
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Connected</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleImport}
          disabled={importing}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
        >
          {importing ? 'Importing...' : 'Import Customers'}
        </button>
        <button
          onClick={handleImportExpenses}
          disabled={importingExpenses}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
        >
          {importingExpenses ? 'Importing...' : 'Import Expenses'}
        </button>
      </div>
      {imported !== null && (
        <p className="text-sm text-green-600">{imported} customers imported.</p>
      )}
      {importedExpenses !== null && (
        <p className="text-sm text-indigo-600">{importedExpenses} expenses imported.</p>
      )}
    </div>
  );
}

function CompanySection() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    companyCountry: 'US',
    taxId: '',
    phone: '',
  });

  useEffect(() => {
    fetch('/api/settings/company').then(r => r.json()).then(data => {
      if (data.user) {
        setForm({
          name: data.user.name || '',
          company: data.user.company || '',
          companyAddress: data.user.company_address || '',
          companyCity: data.user.company_city || '',
          companyState: data.user.company_state || '',
          companyZip: data.user.company_zip || '',
          companyCountry: data.user.company_country || 'US',
          taxId: data.user.tax_id || '',
          phone: data.user.phone || '',
        });
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) toast.success('Company settings saved');
    else toast.error('Failed to save');
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / EIN</label>
          <input type="text" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="XX-XXXXXXX" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input type="text" value={form.companyAddress} onChange={e => setForm({ ...form, companyAddress: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="123 Main St" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input type="text" value={form.companyCity} onChange={e => setForm({ ...form, companyCity: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input type="text" value={form.companyState} onChange={e => setForm({ ...form, companyState: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
          <input type="text" value={form.companyZip} onChange={e => setForm({ ...form, companyZip: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select value={form.companyCountry} onChange={e => setForm({ ...form, companyCountry: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2">
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Company Settings'}
      </button>
    </div>
  );
}

function ReferralSection() {
  const [data, setData] = useState<{ referralCode: string; count: number } | null>(null);

  useEffect(() => {
    fetch('/api/referrals').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <p className="text-sm text-gray-500">Loading...</p>;

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/signup?ref=${data.referralCode}`;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">Your referral code</label>
        <div className="flex gap-2">
          <code className="px-3 py-2 bg-gray-100 rounded text-lg font-mono font-bold tracking-wider">{data.referralCode}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }}
            className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
          >
            Copy link
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        {data.count} friend{data.count !== 1 ? 's' : ''} referred. When they sign up, you both get a free month!
      </p>
    </div>
  );
}
