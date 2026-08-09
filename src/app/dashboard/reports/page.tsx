import { getSession } from "@/lib/session"
import { queryMany, queryOne } from "@/lib/db"

export default async function ReportsPage() {
  const session = await getSession()
  if (!session) return null

  const [
    monthlyRevenue, monthlyExpenses, outstandingByStatus,
    topCustomers, expenseBreakdown, jobProfitability, complianceSummary,
    yearlyRevenue, yearlyExpenses
  ] = await Promise.all([
    queryMany<{ month: string; revenue: string }>(
      `SELECT TO_CHAR(d, 'Mon') as month, COALESCE(SUM(i.total), 0) as revenue
       FROM generate_series(date_trunc('month', NOW()) - INTERVAL '5 months', date_trunc('month', NOW()), '1 month') d
       LEFT JOIN invoices i ON date_trunc('month', i.issue_date) = d AND i.user_id = $1 AND i.status = 'paid'
       GROUP BY 1, d ORDER BY d`,
      [session.userId]
    ),
    queryMany<{ month: string; expenses: string }>(
      `SELECT TO_CHAR(d, 'Mon') as month, COALESCE(SUM(e.amount), 0) as expenses
       FROM generate_series(date_trunc('month', NOW()) - INTERVAL '5 months', date_trunc('month', NOW()), '1 month') d
       LEFT JOIN expenses e ON date_trunc('month', e.date) = d AND e.user_id = $1
       GROUP BY 1, d ORDER BY d`,
      [session.userId]
    ),
    queryMany<{ status: string; count: string; total: string }>(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(total), 0) as total
       FROM invoices WHERE user_id = $1 GROUP BY status ORDER BY total DESC`,
      [session.userId]
    ),
    queryMany<{ name: string; total: string; count: string }>(
      `SELECT c.name, COALESCE(SUM(i.total), 0) as total, COUNT(i.id) as count
       FROM customers c JOIN invoices i ON c.id = i.customer_id
       WHERE c.user_id = $1 AND i.status = 'paid'
       GROUP BY c.name ORDER BY total DESC LIMIT 5`,
      [session.userId]
    ),
    queryMany<{ category: string; total: string }>(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM expenses WHERE user_id = $1
       GROUP BY category ORDER BY total DESC`,
      [session.userId]
    ),
    queryMany<{ title: string; customer_name: string; estimate_amount: string; final_amount: string; expenses: string }>(
      `SELECT j.title, c.name as customer_name,
       COALESCE(j.estimate_amount, 0) as estimate_amount,
       COALESCE(j.final_amount, 0) as final_amount,
       COALESCE((SELECT SUM(amount) FROM expenses WHERE job_id = j.id), 0) as expenses
       FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id
       WHERE j.user_id = $1 AND j.status = 'completed'
       ORDER BY j.created_at DESC LIMIT 10`,
      [session.userId]
    ),
    queryMany<{ status: string; count: string }>(
      `SELECT
       CASE
         WHEN expiry_date < NOW() THEN 'expired'
         WHEN expiry_date <= NOW() + INTERVAL '30 days' THEN 'expiring'
         ELSE 'valid'
       END as status,
       COUNT(*) as count
       FROM compliance_docs WHERE user_id = $1 GROUP BY 1`,
      [session.userId]
    ),
    queryMany<{ year: string; revenue: string }>(
      `SELECT EXTRACT(YEAR FROM issue_date)::text as year, COALESCE(SUM(total), 0) as revenue
       FROM invoices WHERE user_id = $1 AND status = 'paid'
       GROUP BY year ORDER BY year`,
      [session.userId]
    ),
    queryMany<{ year: string; expenses: string }>(
      `SELECT EXTRACT(YEAR FROM date)::text as year, COALESCE(SUM(amount), 0) as expenses
       FROM expenses WHERE user_id = $1
       GROUP BY year ORDER BY year`,
      [session.userId]
    ),
  ])

  const totalRevenue = monthlyRevenue.reduce((sum, r) => sum + parseFloat(r.revenue || "0"), 0)
  const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.expenses || "0"), 0)
  const netProfit = totalRevenue - totalExpenses
  const maxBar = Math.max(
    ...monthlyRevenue.map(r => parseFloat(r.revenue || "0")),
    ...monthlyExpenses.map(e => parseFloat(e.expenses || "0")),
    1
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <p className="text-gray-600 mt-1">Financial overview and business insights.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Revenue (6mo)</p>
          <p className="text-2xl font-bold text-green-600 mt-2">${totalRevenue.toFixed(0)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Expenses (6mo)</p>
          <p className="text-2xl font-bold text-red-600 mt-2">${totalExpenses.toFixed(0)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Net Profit</p>
          <p className={`text-2xl font-bold mt-2 ${netProfit >= 0 ? "text-gray-900" : "text-red-600"}`}>
            ${netProfit.toFixed(0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Margin</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(0)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Revenue vs Expenses chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h2>
        <div className="flex items-end gap-6 h-56 mt-8">
          {monthlyRevenue.map((rev, idx) => {
            const exp = monthlyExpenses[idx]
            const revH = (parseFloat(rev.revenue || "0") / maxBar) * 100
            const expH = (parseFloat(exp?.expenses || "0") / maxBar) * 100
            return (
              <div key={rev.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex items-end gap-1 h-44">
                <div className="w-8 bg-green-500 rounded-t" style={{ height: `${revH}%` }} title={`Revenue: $${parseFloat(rev.revenue || "0").toFixed(0)}`} />
                <div className="w-8 bg-red-400 rounded-t" style={{ height: `${expH}%` }} title={`Expenses: $${parseFloat(exp?.expenses || "0").toFixed(0)}`} />
                </div>
                <span className="text-xs text-gray-500">{rev.month}</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500" /><span className="text-sm text-gray-600">Revenue</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-400" /><span className="text-sm text-gray-600">Expenses</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Outstanding A/R by status */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Invoice Status Breakdown</h2>
          {outstandingByStatus.length === 0 ? (
            <p className="text-gray-400 text-sm mt-4">No invoices.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {outstandingByStatus.map(s => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{s.status}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{s.count} invoices</span>
                    <span className="text-sm font-medium text-gray-900">${parseFloat(s.total).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top customers */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Top Customers (by paid revenue)</h2>
          {topCustomers.length === 0 ? (
            <p className="text-gray-400 text-sm mt-4">No paid invoices yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topCustomers.map((c, idx) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-5">{idx + 1}.</span>
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{c.count} invoices</span>
                    <span className="text-sm font-medium text-gray-900">${parseFloat(c.total).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Expense Breakdown</h2>
          {expenseBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm mt-4">No expenses recorded.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {expenseBreakdown.map(e => {
                const pct = totalExpenses > 0 ? (parseFloat(e.total) / totalExpenses) * 100 : 0
                return (
                  <div key={e.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{e.category}</span>
                      <span className="text-sm text-gray-900">${parseFloat(e.total).toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 rounded-full h-2" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Job profitability */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Job Profitability</h2>
          {jobProfitability.length === 0 ? (
            <p className="text-gray-400 text-sm mt-4">No completed jobs.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {jobProfitability.map(j => {
                const revenue = parseFloat(j.final_amount || j.estimate_amount || "0")
                const costs = parseFloat(j.expenses || "0")
                const profit = revenue - costs
                return (
                  <div key={j.title} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{j.title}</p>
                      <p className="text-xs text-gray-500">{j.customer_name || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${revenue.toFixed(0)}</p>
                      <p className={`text-xs ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {profit >= 0 ? "+" : ""}${profit.toFixed(0)} profit
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* P&L Statement by Year */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Profit & Loss Statement</h2>
        <p className="text-sm text-gray-500 mt-1">Annual summary for tax preparation.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Year</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
                <th className="pb-3 font-medium text-right">Expenses</th>
                <th className="pb-3 font-medium text-right">Net Income</th>
                <th className="pb-3 font-medium text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const years = new Set([...yearlyRevenue.map(r => r.year), ...yearlyExpenses.map(e => e.year)])
                const sorted = Array.from(years).sort((a, b) => b.localeCompare(a))
                if (sorted.length === 0) return (
                  <tr><td colSpan={5} className="py-4 text-gray-400">No data yet.</td></tr>
                )
                return sorted.map(year => {
                  const rev = yearlyRevenue.find(r => r.year === year)
                  const exp = yearlyExpenses.find(e => e.year === year)
                  const revenue = parseFloat(rev?.revenue || "0")
                  const expenses = parseFloat(exp?.expenses || "0")
                  const net = revenue - expenses
                  const margin = revenue > 0 ? ((net / revenue) * 100).toFixed(0) : "—"
                  return (
                    <tr key={year} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{year}</td>
                      <td className="py-3 text-right text-green-600">${revenue.toFixed(2)}</td>
                      <td className="py-3 text-right text-red-600">${expenses.toFixed(2)}</td>
                      <td className={`py-3 text-right font-medium ${net >= 0 ? "text-gray-900" : "text-red-600"}`}>${net.toFixed(2)}</td>
                      <td className="py-3 text-right text-gray-500">{margin}{margin !== "—" ? "%" : ""}</td>
                    </tr>
                  )
                })
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Prep Export */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Tax Prep Export</h2>
        <p className="text-sm text-gray-500 mt-1">Download income and expense data for your accountant or tax software.</p>
        <div className="flex flex-wrap gap-3 mt-4">
          {(() => {
            const currentYear = new Date().getFullYear()
            const years = [currentYear, currentYear - 1, currentYear - 2]
            return years.map(year => (
              <a
                key={year}
                href={`/api/reports/tax-export?year=${year}`}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {year} Export (CSV)
              </a>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
