"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface Job {
  id: string; title: string; description: string; customer_id: string; customer_name: string;
  status: string; scheduled_date: string; completed_date: string | null; location: string;
  estimate_amount: string | null; final_amount: string | null; notes: string;
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/jobs/${params.id}`).then((r) => r.json()).then((data) => {
      if (data.job) setJob(data.job)
    })
  }, [params.id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/jobs/${params.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    })
    if (res.ok) toast.success("Saved")
    else toast.error("Failed to save")
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm("Delete this job?")) return
    const res = await fetch(`/api/jobs/${params.id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Deleted"); router.push("/dashboard/field-service") }
  }

  async function handleCreateInvoice() {
    const res = await fetch(`/api/jobs/${params.id}/invoice`, { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      toast.success("Invoice created")
      router.push(`/dashboard/invoices/${data.invoice_id}`)
    } else {
      toast.error("Failed to create invoice")
    }
  }

  if (!job) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
        <button onClick={handleCreateInvoice} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">Create Invoice</button>
      </div>
      <form onSubmit={handleSave} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" required value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={job.description || ""} onChange={(e) => setJob({ ...job, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer: {job.customer_name}</label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={job.status} onChange={(e) => setJob({ ...job, status: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
            <input type="date" value={job.scheduled_date ? job.scheduled_date.split("T")[0] : ""} onChange={(e) => setJob({ ...job, scheduled_date: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input type="text" value={job.location || ""} onChange={(e) => setJob({ ...job, location: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimate Amount</label>
            <input type="number" step="0.01" value={job.estimate_amount || ""} onChange={(e) => setJob({ ...job, estimate_amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Final Amount</label>
            <input type="number" step="0.01" value={job.final_amount || ""} onChange={(e) => setJob({ ...job, final_amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={job.notes || ""} onChange={(e) => setJob({ ...job, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => router.push("/dashboard/field-service")} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Back</button>
          <button type="button" onClick={handleDelete} className="text-red-600 px-4 py-2">Delete</button>
        </div>
      </form>
    </div>
  )
}
