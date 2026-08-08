import { getSession } from "@/lib/session"
import { queryMany } from "@/lib/db"
import Link from "next/link"

export default async function QuotesPage() {
  const session = await getSession()
  if (!session) return null

  const quotes = await queryMany<{
    id: string
    quote_number: string
    customer_name: string
    total: string
    status: string
    issue_date: string
    expiry_date: string
  }>(
    `SELECT q.id, q.quote_number, c.name as customer_name, q.total::text, q.status,
     q.issue_date::text, q.expiry_date::text
     FROM quotes q
     LEFT JOIN customers c ON q.customer_id = c.id
     WHERE q.user_id = $1
     ORDER BY q.created_at DESC`,
    [session.userId]
  )

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    expired: "bg-gray-100 text-gray-500",
    invoiced: "bg-indigo-100 text-indigo-700",
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        <Link href="/dashboard/quotes/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
          + Create Quote
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No quotes yet. Create a quote to send to your customers.</p>
          <Link href="/dashboard/quotes/new" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            + Create Quote
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Quote #</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/dashboard/quotes/${q.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                      {q.quote_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{q.customer_name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">${parseFloat(q.total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusColors[q.status] || "bg-gray-100"}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{q.expiry_date ? new Date(q.expiry_date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
