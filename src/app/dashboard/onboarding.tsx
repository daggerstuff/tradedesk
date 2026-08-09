'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface OnboardingData {
  company: string;
  name: string;
  phone: string;
  setupCustomers: boolean;
  createInvoice: boolean;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome to TradeDesk!' },
  { id: 'company', title: 'Your Business' },
  { id: 'setup', title: 'Quick Setup' },
  { id: 'done', title: "You're Ready!" },
];

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    company: '',
    name: '',
    phone: '',
    setupCustomers: true,
    createInvoice: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSkip = async () => {
    await fetch('/api/settings/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, skipOnboarding: true }),
    });
    onComplete();
  };

  const handleFinish = async () => {
    setSaving(true);
    const res = await fetch('/api/settings/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success('Setup complete!');
      onComplete();
    } else {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="text-5xl">🚀</div>
              <h2 className="text-2xl font-bold text-gray-900">{STEPS[0].title}</h2>
              <p className="text-gray-600">
                TradeDesk helps contractors and small service businesses manage invoices, customers, and payments — all in one place.
              </p>
              <p className="text-sm text-gray-500">Let&apos;s set things up in 30 seconds.</p>
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Get Started
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">{STEPS[1].title}</h2>
              <p className="text-sm text-gray-600">This info appears on your invoices and emails.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={e => setData({ ...data, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={data.company}
                  onChange={e => setData({ ...data, company: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="Smith Plumbing LLC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={e => setData({ ...data, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)} className="px-4 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50">Back</button>
                <button onClick={() => setStep(2)} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Next</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">{STEPS[2].title}</h2>
              <p className="text-sm text-gray-600">What would you like to do first?</p>
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={data.setupCustomers}
                  onChange={e => setData({ ...data, setupCustomers: e.target.checked })}
                  className="mt-1 rounded border-gray-300"
                />
                <div>
                  <p className="font-medium text-gray-900">Add my customers</p>
                  <p className="text-sm text-gray-500">Import or add your customer list to get started quickly.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={data.createInvoice}
                  onChange={e => setData({ ...data, createInvoice: e.target.checked })}
                  className="mt-1 rounded border-gray-300"
                />
                <div>
                  <p className="font-medium text-gray-900">Create my first invoice</p>
                  <p className="text-sm text-gray-500">Send a professional invoice in under a minute.</p>
                </div>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900">{STEPS[3].title}</h2>
              <p className="text-gray-600">
                {data.createInvoice
                  ? 'Click below to create your first invoice!'
                  : 'Head to Customers to start building your list.'}
              </p>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : data.createInvoice ? 'Create First Invoice' : 'Go to Dashboard'}
              </button>
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="px-8 pb-4 text-center">
            <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-600">
              Skip setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
