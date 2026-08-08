import { getSession } from "@/lib/session"
import { queryOne, queryMany } from "@/lib/db"
import Link from "next/link"

export default async function DashboardOverview() {
  const session = await getSession()
  if (!session) return null

  // Get subscription
  const subscription = await queryOne<{ plan: string; status: string }>(
    "SELECT plan, status FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
    [session.userId]
  )

  // Get stats
  const [customerCount, invoiceCount, pendingReminders] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM customers WHERE user_id = $1", [session.userId]),
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM invoices WHERE user_id = $1", [session.userId]),
    queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM reminders r JOIN invoices i ON r.invoice_id = i.id WHERE i.user_id = $1 AND r.status IN ('pending', 'sent')",
      [session.userId]
    ),
  ])

  const stats = [
    { label: "Customers", value: customerCount?.count || "0", href: "/dashboard/customers", color: "bg-blue-50 text-blue-700" },
    { label: "Invoices", value: invoiceCount?.count || "0", href: "/dashboard/invoices", color: "bg-green-50 text-green-700" },
    { label: "Pending Reminders", value: pendingReminders?.count || "0", href: "/dashboard/reminders", color: "bg-amber-50 text-amber-700" },
    { label: "Plan", value: subscription?.plan || "free", href: "/dashboard/settings", color: "bg-purple-50 text-purple-700" },
  ]

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mb-8 text-gray-600">Welcome back. Here&apos;s your overview.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${stat.color}`}>
              {stat.label}
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/customers/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Customer
          </Link>
          <Link
            href="/dashboard/invoices/new"
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            + Create Invoice
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  )
}
