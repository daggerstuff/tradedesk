'use client';

import { useState } from 'react';
import Link from 'next/link';

const QUICK_ACTIONS = [
  { href: '/dashboard/invoices/new', label: 'New Invoice', icon: '📄', color: 'bg-indigo-600' },
  { href: '/dashboard/quotes/new', label: 'New Quote', icon: '📝', color: 'bg-blue-600' },
  { href: '/dashboard/customers/new', label: 'Add Customer', icon: '👤', color: 'bg-green-600' },
  { href: '/dashboard/expenses/new', label: 'Add Expense', icon: '💰', color: 'bg-amber-600' },
  { href: '/dashboard/field-service/new', label: 'New Job', icon: '🔧', color: 'bg-purple-600' },
];

export default function QuickAddFAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 space-y-2 animate-in fade-in slide-in-from-bottom-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg bg-white shadow-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{action.label}</span>
            </Link>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform ${open ? 'rotate-45 bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
      >
        +
      </button>
    </div>
  );
}
