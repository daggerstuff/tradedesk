'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {subscription?.plan || 'free'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {subscription?.status || 'inactive'}
          </span>
        </div>

        {subscription?.current_period_end && (
          <p className="text-sm text-gray-600 mb-4">
            Current period ends: {subscription.current_period_end.split('T')[0]}
          </p>
        )}

        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => handleUpgrade('invoice_reminders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Upgrade to Invoice Reminders ($19/mo)
            </button>
            <button
              onClick={() => handleUpgrade('compliance')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Compliance ($49/mo)
            </button>
            <button
              onClick={() => handleUpgrade('field_service')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Field Service ($15/mo)
            </button>
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
    </div>
  );
}
