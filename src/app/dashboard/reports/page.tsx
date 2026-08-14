'use client';

import { useState, useEffect } from 'react';

interface Data {
  range: string;
  cashFlow: { month: string; revenue: string; expenses: string }[];
  outstanding: { status: string; count: string; total: string }[];
  topCustomers: { name: string; total: string; count: string }[];
  expenseBreakdown: { category: string; total: string }[];
  metrics: {
    total_revenue: string;
    total_expenses: string;
    invoice_count: string;
    avg_invoice: string;
    paid_count: string;
    outstanding_total: string;
    outstanding_count: string;
    unique_customers: string;
  };
  yoy: { year: string; revenue: string; expenses: string }[];
}

const RANGES = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '6m', label: '6 Months' },
  { value: '12m', label: '12 Months' },
  { value: 'ytd', label: 'YTD' },
  { value: 'all', label: 'All Time' },
];

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function fmtFull(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// SVG Line Chart
function LineChart({ data, width = 600, height = 200 }: { data: { label: string; value: number }[]; width?: number; height?: number }) {
  if (data.length === 0) return <p className="text-gray-400 text-sm">No data</p>;

  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  const points = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padY + chartH - (d.value / maxVal) * chartH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <g key={pct}>
          <line x1={padX} y1={padY + chartH * (1 - pct)} x2={width - padX} y2={padY + chartH * (1 - pct)} stroke="#f3f4f6" strokeWidth={1} />
          <text x={padX - 4} y={padY + chartH * (1 - pct) + 4} textAnchor="end" className="text-[10px] fill-gray-400">
            {fmt(maxVal * pct)}
          </text>
        </g>
      ))}
      {/* Line */}
      <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Area under */}
      <path d={`${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`} fill="url(#lineGrad)" opacity={0.15} />
      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#4f46e5" stroke="#fff" strokeWidth={2} />
          <text x={p.x} y={height - 4} textAnchor="middle" className="text-[10px] fill-gray-500">
            {data[i].label}
          </text>
        </g>
      ))}
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Horizontal bar for top customers
function HBar({ label, value, max, color = '#4f46e5' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-28 truncate">{label}</span>
      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
        <div className="h-full rounded transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-medium text-gray-900 w-16 text-right">{fmt(value)}</span>
    </div>
  );
}

// Donut chart for expense breakdown
function Donut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-gray-400 text-sm">No expenses</p>;

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 55;
  const stroke = 28;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all"
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy} textAnchor="middle" className="text-sm font-semibold fill-gray-900">
          {fmt(total)}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-gray-700">{d.label}</span>
            <span className="text-gray-400 ml-auto">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const EXPENSE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function AnalyticsPage() {
  const [range, setRange] = useState('6m');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?range=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [range]);

  if (loading || !data) return <div className="p-8 text-gray-500">Loading analytics...</div>;

  const m = data.metrics;
  const revenue = parseFloat(m.total_revenue || '0');
  const expenses = parseFloat(m.total_expenses || '0');
  const net = revenue - expenses;
  const margin = revenue > 0 ? (net / revenue) * 100 : 0;

  const cashFlowData = data.cashFlow.map(d => ({
    label: d.month.split(' ')[0],
    value: parseFloat(d.revenue || '0') - parseFloat(d.expenses || '0'),
  }));

  const revenueData = data.cashFlow.map(d => ({
    label: d.month.split(' ')[0],
    value: parseFloat(d.revenue || '0'),
  }));

  const topCustMax = Math.max(...data.topCustomers.map(c => parseFloat(c.total || '0')), 1);

  const expenseData = data.expenseBreakdown.map((d, i) => ({
    label: d.category,
    value: parseFloat(d.total || '0'),
    color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Know where your money comes from and where it goes</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                range === r.value ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmtFull(revenue)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Expenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmtFull(expenses)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Net Profit</p>
          <p className={`text-2xl font-bold mt-1 ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtFull(net)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Margin</p>
          <p className={`text-2xl font-bold mt-1 ${margin >= 30 ? 'text-green-600' : margin >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {margin.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Outstanding alert */}
      {parseFloat(m.outstanding_total || '0') > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">
              {m.outstanding_count} outstanding invoice{m.outstanding_count !== '1' ? 's' : ''}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">You're owed money. Time to chase.</p>
          </div>
          <p className="text-lg font-bold text-amber-800">{fmtFull(parseFloat(m.outstanding_total))}</p>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Revenue trend */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <LineChart data={revenueData} />
        </div>

        {/* Cash flow */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Net Cash Flow</h2>
          <LineChart data={cashFlowData} />
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Top customers */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Customers</h2>
          {data.topCustomers.length === 0 ? (
            <p className="text-sm text-gray-400">No revenue data yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.topCustomers.map((c, i) => (
                <HBar key={i} label={c.name} value={parseFloat(c.total || '0')} max={topCustMax} />
              ))}
            </div>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Expenses by Category</h2>
          <Donut data={expenseData} />
        </div>

        {/* Business stats */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Business Stats</h2>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Avg Invoice</span>
              <span className="text-sm font-semibold text-gray-900">{fmtFull(parseFloat(m.avg_invoice || '0'))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Invoices Paid</span>
              <span className="text-sm font-semibold text-gray-900">{m.paid_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Active Customers</span>
              <span className="text-sm font-semibold text-gray-900">{m.unique_customers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Collection Rate</span>
              <span className="text-sm font-semibold text-gray-900">
                {parseFloat(m.invoice_count || '0') > 0
                  ? `${((parseFloat(m.paid_count || '0') / parseFloat(m.invoice_count)) * 100).toFixed(0)}%`
                  : '—'}
              </span>
            </div>
            {data.yoy.length > 1 && (
              <>
                <hr className="border-gray-100" />
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Year over Year</p>
                {data.yoy.map((y, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{y.year}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {fmt(parseFloat(y.revenue || '0'))} / {fmt(parseFloat(y.expenses || '0'))}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
