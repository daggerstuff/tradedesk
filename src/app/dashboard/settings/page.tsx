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
