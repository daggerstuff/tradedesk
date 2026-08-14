import { getSession } from "@/lib/session"
import { queryOne, queryMany } from "@/lib/db"
import Link from "next/link"
import OnboardingGate from "./onboarding-gate"
import QuickAddFAB from "./quick-add-fab"

export default async function DashboardOverview() {
  const session = await getSession()
  if (!session) return null

  const [
    customerCount, invoiceCount, outstandingAR, activeJobs,
    upcomingExpiries, monthlyRevenue, recentInvoices, recentJobs,
    , pendingQuotesValue, monthlyExpenses, avgInvoiceValue
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
    { label: "Customers", value: customerCount?.count || "0", href: "/dashboard/customers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "indigo" },
    { label: "Outstanding A/R", value: `$${parseFloat(outstandingAR?.total || "0").toFixed(0)}`, href: "/dashboard/invoices", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "amber" },
    { label: "Active Jobs", value: activeJobs?.count || "0", href: "/dashboard/field-service", icon: "M11 3.055A5.001 5.001 0 005.055 9c0 2.761 2.239 5 5 5M11 3.055A5.001 5.001 0 0116.945 9c0 2.761-2.239 5-5 5M11 3.055V3a2 2 0 012-2h2a2 2 0 012 2v.5", color: "emerald" },
    { label: "Expenses (MTD)", value: `$${parseFloat(monthlyExpenses?.total || "0").toFixed(0)}`, href: "/dashboard/expenses", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", color: "orange" },
  ]

  const secondaryStats = [
    { label: "Total Invoices", value: invoiceCount?.count || "0" },
    { label: "Pending Quotes", value: `$${parseFloat(pendingQuotesValue?.total || "0").toFixed(0)}` },
    { label: "Avg Invoice", value: `$${parseFloat(avgInvoiceValue?.avg || "0").toFixed(0)}` },
  ]

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-500",
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
  }

  const isNewUser = customerCount?.count === "0" && invoiceCount?.count === "0"
  const reversed = [...monthlyRevenue].reverse()
  const maxRevenue = Math.max(...reversed.map(r => parseFloat(r.revenue || "0")), 1)
  const totalRevenue = reversed.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0)

  return (
    <OnboardingGate>
      <QuickAddFAB />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Overview</h1>
          <p className="text-slate-500 mt-1">Your business at a glance.</p>
        </div>

        {/* Primary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, i) => (
            <Link
              key={stat.label}
              href={stat.href}
              className={`group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 hover-lift animate-fade-in-up opacity-0`}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
            >
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center
                  ${stat.color === "indigo" ? "bg-indigo-100" : ""}
                  ${stat.color === "amber" ? "bg-amber-100" : ""}
                  ${stat.color === "emerald" ? "bg-emerald-100" : ""}
                  ${stat.color === "orange" ? "bg-orange-100" : ""}
                `}>
                  <svg className={`h-5 w-5
                    ${stat.color === "indigo" ? "text-indigo-600" : ""}
                    ${stat.color === "amber" ? "text-amber-600" : ""}
                    ${stat.color === "emerald" ? "text-emerald-600" : ""}
                    ${stat.color === "orange" ? "text-orange-600" : ""}
                  `} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                  </svg>
                </div>
                <svg className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{stat.label}</p>
              {/* Decorative accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5
                ${stat.color === "indigo" ? "bg-indigo-500" : ""}
                ${stat.color === "amber" ? "bg-amber-500" : ""}
                ${stat.color === "emerald" ? "bg-emerald-500" : ""}
                ${stat.color === "orange" ? "bg-orange-500" : ""}
              `} />
            </Link>
          ))}
        </div>

        {/* Secondary stats row */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          {secondaryStats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-lg font-semibold text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Onboarding banner */}
        {isNewUser && (
          <div className="mt-6 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl flex-shrink-0">👋</div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Welcome to TradeDesk!</h2>
                <p className="text-sm text-slate-600 mt-1">Get rolling in 4 steps:</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { n: "1", label: "Add a customer", href: "/dashboard/customers/new", desc: "Set up records & contact info" },
                    { n: "2", label: "Create an invoice", href: "/dashboard/invoices/new", desc: "Send & get paid" },
                    { n: "3", label: "Write a quote", href: "/dashboard/quotes/new", desc: "Convert to invoice later" },
                    { n: "4", label: "Set up a job", href: "/dashboard/field-service/new", desc: "Track field work on your phone" },
                  ].map((step) => (
                    <Link key={step.n} href={step.href} className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-white p-3 hover:shadow-md transition-all hover:-translate-y-0.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold flex-shrink-0">{step.n}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{step.label}</p>
                        <p className="text-xs text-slate-500">{step.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 animate-fade-in-up opacity-0" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Revenue</h2>
                <p className="text-sm text-slate-500">Last 6 months</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-slate-500">total paid</p>
              </div>
            </div>
            
            {reversed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">No paid invoices yet</p>
                <p className="text-sm text-slate-400 mt-1">Revenue will appear here once you get paid</p>
              </div>
            ) : (
              <svg viewBox={`0 0 ${reversed.length * 60} 160`} className="w-full h-48" preserveAspectRatio="none">
                {[0, 25, 50, 75, 100].map(pct => (
                  <line key={pct}
                    x1="0" y1={160 - (pct / 100) * 140}
                    x2={reversed.length * 60} y2={160 - (pct / 100) * 140}
                    stroke="#f1f5f9" strokeWidth="1"
                  />
                ))}
                {reversed.map((r, i) => {
                  const h = (parseFloat(r.revenue || "0") / maxRevenue) * 140
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
            )}
          </div>

          {/* Expiring compliance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 animate-fade-in-up opacity-0" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Expiring Soon</h2>
              {upcomingExpiries.length > 0 && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                  {upcomingExpiries.length} alert{upcomingExpiries.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {upcomingExpiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">Nothing expiring in 30 days</p>
                <p className="text-xs text-slate-400 mt-1">You&apos;re all caught up 🎉</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingExpiries.map((doc) => {
                  const days = Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / 86400000)
                  const urgent = days <= 7
                  return (
                    <li key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.doc_name}</p>
                        <p className="text-xs text-slate-500">{doc.customer_name || "No customer"}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ml-3 ${urgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {days <= 0 ? "Expired" : `${days}d left`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
            <Link href="/dashboard/compliance" className="block mt-4 text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
              View all compliance →
            </Link>
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
          {/* Recent invoices */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 animate-fade-in-up opacity-0" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
              <Link href="/dashboard/invoices" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors">View all →</Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">No invoices yet</p>
                <Link href="/dashboard/invoices/new" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Create your first invoice →
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentInvoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 min-w-0 truncate">
                      {inv.invoice_number}
                    </Link>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-sm text-slate-600 truncate max-w-24">{inv.customer_name}</span>
                      <span className="text-sm font-semibold text-slate-900">${parseFloat(inv.total).toFixed(0)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${statusColors[inv.status] || "bg-slate-100"}`}>
                        {inv.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent jobs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 animate-fade-in-up opacity-0" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Jobs</h2>
              <Link href="/dashboard/field-service" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors">View all →</Link>
            </div>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A5.001 5.001 0 005.055 9c0 2.761 2.239 5 5 5M11 3.055A5.001 5.001 0 0116.945 9c0 2.761-2.239 5-5 5M11 3.055V3a2 2 0 012-2h2a2 2 0 012 2v.5" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">No jobs yet</p>
                <Link href="/dashboard/field-service/new" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Create your first job →
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentJobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <Link href={`/dashboard/field-service/${job.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 min-w-0 truncate">
                      {job.title}
                    </Link>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-sm text-slate-600 truncate max-w-24">{job.customer_name || "—"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${statusColors[job.status] || "bg-slate-100"}`}>
                        {job.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </OnboardingGate>
  )
}
