import { getSession } from "@/lib/session"
import { queryMany } from "@/lib/db"
import Link from "next/link"

export default async function CustomersPage() {
  const session = await getSession()
  if (!session) return null

  const customers = await queryMany<{
    id: string
    name: string
    email: string
    phone: string
    company_name: string
  }>(
    `SELECT id, name, email, phone, company_name FROM customers WHERE user_id = $1 ORDER BY created_at DESC`,
    [session.userId]
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link
          href="/dashboard/customers/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add Customer
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No customers yet. Add your first customer to get started.</p>
          <Link
            href="/dashboard/customers/new"
            className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Customer
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Company</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/dashboard/customers/${c.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{c.email || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{c.phone || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{c.company_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
