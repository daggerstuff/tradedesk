"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface HistoryData {
  customer: { id: string; name: string; email: string; phone: string }
  jobs: Array<{ id: string; title: string; status: string; scheduled_date: string; estimate_amount: string | null; final_amount: string | null }>
  invoices: Array<{ id: string; invoice_number: string; status: string; issue_date: string; total: string }>
}

export default function CustomerHistoryPage() {
  const params = useParams()
  const [data, setData] = useState<HistoryData | null>(null)

  useEffect(() => {
    fetch(`/api/customers/${params.customerId}/history`).then((r) => r.json()).then(setData)
  }, [params.customerId])

  if (!data) return <div className="p-8 text-gray-500">Loading...</div>

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700", in_progress: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-700", sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700",
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customer History</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{data.customer.name}</h2>
        <p className="text-sm text-gray-500">{data.customer.email} {data.customer.phone && `• ${data.customer.phone}`}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Jobs</h3>
          <div className="space-y-2">
            {data.jobs.length === 0 ? <p className="text-sm text-gray-400">No jobs</p> : data.jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">{job.title}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[job.status] || ""}`}>{job.status}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : "Unscheduled"} •
                  {job.final_amount ? ` $${parseFloat(job.final_amount).toFixed(2)}` : job.estimate_amount ? ` Est: $${parseFloat(job.estimate_amount).toFixed(2)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoices</h3>
          <div className="space-y-2">
            {data.invoices.length === 0 ? <p className="text-sm text-gray-400">No invoices</p> : data.invoices.map((inv) => (
              <div key={inv.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">{inv.invoice_number}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[inv.status] || ""}`}>{inv.status}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(inv.issue_date).toLocaleDateString()} • ${parseFloat(inv.total).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
