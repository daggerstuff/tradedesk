"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface Customer { id: string; name: string }

export default function NewComplianceDocPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    doc_name: "",
    doc_type: "Insurance Certificate",
    customer_id: "",
    expiry_date: "",
    notes: "",
  })

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then((data) => {
      if (data.customers) setCustomers(data.customers)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch("/api/compliance-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_name: form.doc_name,
        doc_type: form.doc_type,
        customer_id: form.customer_id || null,
        expiry_date: form.expiry_date,
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      toast.success("Document added")
      router.push("/dashboard/compliance")
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to add document")
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Compliance Document</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
          <input type="text" required value={form.doc_name} onChange={(e) => setForm({ ...form, doc_name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Public Liability Insurance 2025" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
          <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
            className="w-full border rounded-lg px-3 py-2">
            <option>Insurance Certificate</option>
            <option>Business License</option>
            <option>Safety Certification</option>
            <option>Tax Document</option>
            <option>Contract</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer (optional)</label>
          <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            className="w-full border rounded-lg px-3 py-2">
            <option value="">— None —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
          <input type="date" required value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
            className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2" rows={3} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? "Saving..." : "Save Document"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard/compliance")} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
