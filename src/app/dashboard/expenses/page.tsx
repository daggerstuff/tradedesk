import { getSession } from "@/lib/session"
import { queryMany } from "@/lib/db"
import Link from "next/link"

const CATEGORIES = ["all", "materials", "labor", "travel", "equipment", "software", "rent", "utilities", "marketing", "other"]

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const session = await getSession()
  if (!session) return null

  const { category } = await searchParams

  let sql = `SELECT * FROM expenses WHERE user_id = $1`
  const params: (string | number)[] = [session.userId]

  if (category && category !== "all") {
    sql += ` AND category = $2`
    params.push(category)
  }
  sql += ` ORDER BY date DESC, created_at DESC`

  const expenses = await queryMany<{
    id: string
    category: string
    vendor: string | null
    amount: string
    date: string
    description: string | null
    job_id: string | null
  }>(sql, params)

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Total: ${totalSpent.toFixed(2)}</p>
        </div>
        <Link href="/dashboard/expenses/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
          + Add Expense
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map(cat => {
          const active = (category || "all") === cat
          return (
            <Link
              key={cat}
              href={cat === "all" ? "/dashboard/expenses" : `/dashboard/expenses?category=${cat}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-indigo-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Link>
          )
        })}
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No expenses recorded. Add your first expense to track costs.</p>
          <Link href="/dashboard/expenses/new" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            + Add Expense
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{exp.vendor || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{exp.description || "—"}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">${parseFloat(exp.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
