"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface Customer { id: string; name: string }

export default function NewJobPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: "", description: "", customer_id: "", status: "scheduled",
    scheduled_date: "", location: "", estimate_amount: "", final_amount: "", notes: "",
  })

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then((data) => {
      if (data.customers) setCustomers(data.customers)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title, description: form.description || null, customer_id: form.customer_id,
        status: form.status, scheduled_date: form.scheduled_date || null, location: form.location || null,
        estimate_amount: form.estimate_amount || null, final_amount: form.final_amount || null, notes: form.notes || null,
      }),
    })
    if (res.ok) { toast.success("Job created"); router.push("/dashboard/field-service") }
    else { const d = await res.json(); toast.error(d.error || "Failed") }
    setSubmitting(false)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Field Service Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
          <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            className="w-full border rounded-lg px-3 py-2">
            <option value="">Select customer...</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border rounded-lg px-3 py-2">
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
            <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimate Amount</label>
            <input type="number" step="0.01" value={form.estimate_amount} onChange={(e) => setForm({ ...form, estimate_amount: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Final Amount</label>
            <input type="number" step="0.01" value={form.final_amount} onChange={(e) => setForm({ ...form, final_amount: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2" rows={2} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? "Saving..." : "Create Job"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard/field-service")} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  )
}
