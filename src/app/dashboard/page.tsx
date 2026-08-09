import { getSession } from "@/lib/session"
import { queryOne, queryMany } from "@/lib/db"
import Link from "next/link"
import OnboardingGate from "./onboarding-gate"
import QuickAddFAB from "./quick-add-fab"

export default async function DashboardOverview() {
  const session = await getSession()
  if (!session) return null

  // Parallel fetch all stats
  const [
    customerCount, invoiceCount, outstandingAR, activeJobs,
    upcomingExpiries, monthlyRevenue, recentInvoices, recentJobs,
    quoteCount, pendingQuotesValue, monthlyExpenses, avgInvoiceValue
  ] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM customers WHERE user_id = $1", [session.userId]),
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM invoices WHERE user_id = $1", [session.userId]),
    queryOne<{ total: string | null }>(
      `SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE user_id = $1 AND status IN ('sent', 'overdue')`,
      [session.userId]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM jobs WHERE user_id = $1 AND status IN ('scheduled', 'in_progress')`,
      [session.userId]
    ),
    queryMany<{ id: string; doc_name: string; expiry_date: string; customer_name: string }>(
      `SELECT cd.id, cd.doc_name, cd.expiry_date::text, c.name as customer_name
       FROM compliance_docs cd LEFT JOIN customers c ON cd.customer_id = c.id
       WHERE cd.user_id = $1 AND cd.expiry_date <= NOW() + INTERVAL '30 days'
       ORDER BY cd.expiry_date ASC LIMIT 5`,
      [session.userId]
    ),
    queryMany<{ month: string; revenue: string }>(
      `SELECT TO_CHAR(issue_date, 'Mon') as month, SUM(total) as revenue
       FROM invoices WHERE user_id = $1 AND status = 'paid'
       AND issue_date >= date_trunc('month', NOW()) - INTERVAL '5 months'
       GROUP BY 1, date_trunc('month', issue_date)
       ORDER BY date_trunc('month', issue_date) DESC LIMIT 6`,
      [session.userId]
    ),
    queryMany<{ id: string; invoice_number: string; customer_name: string; total: string; status: string }>(
      `SELECT i.id, i.invoice_number, c.name as customer_name, i.total::text, i.status
       FROM invoices i JOIN customers c ON i.customer_id = c.id
       WHERE i.user_id = $1 ORDER BY i.created_at DESC LIMIT 5`,
      [session.userId]
    ),
    queryMany<{ id: string; title: string; customer_name: string; status: string; scheduled_date: string }>(
      `SELECT j.id, j.title, c.name as customer_name, j.status, j.scheduled_date::text
       FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id
       WHERE j.user_id = $1 ORDER BY j.created_at DESC LIMIT 5`,
      [session.userId]
    ),
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM quotes WHERE user_id = $1", [session.userId]),
    queryOne<{ total: string | null }>(
      `SELECT COALESCE(SUM(total), 0) as total FROM quotes WHERE user_id = $1 AND status = 'sent'`,
      [session.userId]
    ),
    queryOne<{ total: string | null }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1 AND date >= date_trunc('month', NOW())`,
      [session.userId]
    ),
    queryOne<{ avg: string | null }>(
      `SELECT COALESCE(AVG(total), 0) as avg FROM invoices WHERE user_id = $1 AND status = 'paid'`,
      [session.userId]
    ),
  ])

  const stats = [
    { label: "Customers", value: customerCount?.count || "0", href: "/dashboard/customers" },
    { label: "Invoices", value: invoiceCount?.count || "0", href: "/dashboard/invoices" },
    { label: "Outstanding A/R", value: `$${parseFloat(outstandingAR?.total || "0").toFixed(0)}`, href: "/dashboard/invoices" },
    { label: "Active Jobs", value: activeJobs?.count || "0", href: "/dashboard/field-service" },
    { label: "Quotes", value: quoteCount?.count || "0", href: "/dashboard/quotes" },
    { label: "Pending Quotes", value: `$${parseFloat(pendingQuotesValue?.total || "0").toFixed(0)}`, href: "/dashboard/quotes" },
    { label: "Expenses (MTD)", value: `$${parseFloat(monthlyExpenses?.total || "0").toFixed(0)}`, href: "/dashboard/expenses" },
    { label: "Avg Invoice", value: `$${parseFloat(avgInvoiceValue?.avg || "0").toFixed(0)}`, href: "/dashboard/reports" },
  ]

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
  }

  return (
    <OnboardingGate>
    <QuickAddFAB />
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
      <p className="text-gray-600 mt-1">Your business at a glance.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/dashboard/invoices/new" className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">New Invoice</p>
              <p className="text-xs text-gray-500">Create & send</p>
            </div>
          </Link>
          <Link href="/dashboard/quotes/new" className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">New Quote</p>
              <p className="text-xs text-gray-500">Send estimate</p>
            </div>
          </Link>
          <Link href="/dashboard/customers/new" className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-green-300 hover:bg-green-50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Add Customer</p>
              <p className="text-xs text-gray-500">New client</p>
            </div>
          </Link>
          <Link href="/dashboard/expenses/new" className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Log Expense</p>
              <p className="text-xs text-gray-500">Track spending</p>
            </div>
          </Link>
        </div>
      </div>

        {/* Onboarding banner for new users */}
        {customerCount && customerCount.count === "0" && invoiceCount && invoiceCount.count === "0" && (
          <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-6">
            <h2 className="text-lg font-semibold text-indigo-900">Welcome to TradeDesk! 👋</h2>
            <p className="text-sm text-indigo-700 mt-1">Get started with these quick steps:</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/dashboard/customers/new" className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-white p-3 hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-lg">1</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Add your first customer</p>
                  <p className="text-xs text-gray-500">Set up customer records and contact info</p>
                </div>
              </Link>
              <Link href="/dashboard/invoices/new" className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-white p-3 hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-lg">2</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Create an invoice</p>
                  <p className="text-xs text-gray-500">Send professional invoices and get paid</p>
                </div>
              </Link>
              <Link href="/dashboard/quotes/new" className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-white p-3 hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-lg">3</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Write a quote</p>
                  <p className="text-xs text-gray-500">Send estimates and convert them to invoices</p>
                </div>
              </Link>
              <Link href="/dashboard/field-service/new" className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-white p-3 hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-lg">4</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Set up a job</p>
                  <p className="text-xs text-gray-500">Track field work from your phone</p>
                </div>
              </Link>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenue</h2>
            <span className="text-xs text-gray-500">Last 6 months</span>
          </div>
          {monthlyRevenue.length === 0 ? (
            <p className="text-gray-400 text-sm">No paid invoices yet.</p>
          ) : (() => {
            const reversed = [...monthlyRevenue].reverse();
            const max = Math.max(...reversed.map(r => parseFloat(r.revenue || "0")), 1);
            const total = reversed.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0);
            return (
              <>
                <p className="text-2xl font-bold text-gray-900 mb-1">${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                <p className="text-sm text-gray-500 mb-4">total paid</p>
                <svg viewBox={`0 0 ${reversed.length * 60} 160`} className="w-full h-48" preserveAspectRatio="none">
                  {[0, 25, 50, 75, 100].map(pct => (
                    <line key={pct} x1="0" y1={160 - pct * 1.6} x2={reversed.length * 60} y2={160 - pct * 1.6} stroke="#f3f4f6" strokeWidth="1" />
                  ))}
                  {reversed.map((r, i) => {
                    const h = (parseFloat(r.revenue || "0") / max) * 140;
                    return (
                      <g key={r.month}>
                        <rect x={i * 60 + 8} y={160 - h} width="44" height={h} rx="4" fill="url(#revGrad)" />
                        <text x={i * 60 + 30} y="158" textAnchor="middle" className="text-[10px]" fill="#9ca3af">{r.month}</text>
                      </g>
                    );
                  })}
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
              </>
            );
          })()}
        </div>

        {/* Upcoming compliance expiries */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Expiring Soon</h2>
          {upcomingExpiries.length === 0 ? (
            <p className="text-gray-400 text-sm mt-4">Nothing expiring in 30 days.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcomingExpiries.map((doc) => {
                const days = Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / 86400000)
                const urgent = days <= 7
                return (
                  <li key={doc.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.doc_name}</p>
                      <p className="text-xs text-gray-500">{doc.customer_name || "—"}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${urgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {days <= 0 ? "Expired" : `${days}d`}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <Link href="/dashboard/compliance" className="block mt-4 text-sm text-indigo-600 hover:text-indigo-500">
            View all compliance →
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent invoices */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <Link href="/dashboard/invoices" className="text-sm text-indigo-600 hover:text-indigo-500">View all →</Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">No invoices yet.</p>
              <Link href="/dashboard/invoices/new" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Create your first invoice →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentInvoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    {inv.invoice_number}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{inv.customer_name}</span>
                    <span className="text-sm font-medium text-gray-900">${parseFloat(inv.total).toFixed(0)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[inv.status] || "bg-gray-100"}`}>
                      {inv.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent jobs */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
            <Link href="/dashboard/field-service" className="text-sm text-indigo-600 hover:text-indigo-500">View all →</Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">No jobs yet.</p>
              <Link href="/dashboard/field-service/new" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Create your first job →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentJobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between">
                  <Link href={`/dashboard/field-service/${job.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    {job.title}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{job.customer_name || "—"}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{job.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/dashboard/invoices/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
          + New Invoice
        </Link>
        <Link href="/dashboard/quotes/new" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          + New Quote
        </Link>
        <Link href="/dashboard/expenses/new" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          + Add Expense
        </Link>
        <Link href="/dashboard/field-service/new" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          + New Job
        </Link>
        <Link href="/dashboard/compliance/new" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          + Upload Compliance Doc
        </Link>
      </div>
    </div>
    </OnboardingGate>
  )
}
