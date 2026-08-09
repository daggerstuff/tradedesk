"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"

interface ComplianceDoc {
  id: string
  doc_name: string
  doc_type: string
  customer_name: string | null
  expiry_date: string
  status: string
  notes: string | null
}

export default function CompliancePage() {
  const [docs, setDocs] = useState<ComplianceDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/compliance-docs")
      .then((r) => r.json())
      .then((data) => {
        if (data.docs) setDocs(data.docs)
        else if (data.error) toast.error(data.error)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this compliance document?")) return
    const res = await fetch(`/api/compliance-docs/${id}`, { method: "DELETE" })
    if (res.ok) {
      setDocs(docs.filter((d) => d.id !== id))
      toast.success("Document deleted")
    } else {
      toast.error("Failed to delete")
    }
  }

  function statusBadge(expiry: string) {
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
    if (days < 0) return { label: "Expired", cls: "bg-red-100 text-red-700" }
    if (days <= 30) return { label: `Expires in ${days}d`, cls: "bg-yellow-100 text-yellow-700" }
    return { label: "Valid", cls: "bg-green-100 text-green-700" }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compliance Tracking</h1>
        <Link href="/dashboard/compliance/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Upload Document
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Document</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Expiry</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {docs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-12 py-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-4 text-sm font-medium text-gray-900">No compliance documents yet</p>
                    <p className="mt-1 text-sm text-gray-500">Upload your first document to start tracking expiry dates.</p>
                    <Link href="/dashboard/compliance/new" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      Upload Document
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              docs.map((doc) => {
                const badge = statusBadge(doc.expiry_date)
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{doc.doc_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.doc_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.customer_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(doc.expiry_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${badge.cls}`}>{badge.label}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
