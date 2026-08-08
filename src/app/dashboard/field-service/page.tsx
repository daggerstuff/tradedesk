"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"

interface Job {
  id: string
  title: string
  customer_name: string
  status: string
  scheduled_date: string | null
  estimate_amount: string | null
  final_amount: string | null
}

export default function FieldServicePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/jobs").then((r) => r.json()).then((data) => {
      if (data.jobs) setJobs(data.jobs)
    }).finally(() => setLoading(false))
  }, [])

  const active = jobs.filter((j) => j.status === "scheduled" || j.status === "in_progress").length
  const completed = jobs.filter((j) => j.status === "completed").length
  const revenue = jobs.filter((j) => j.final_amount).reduce((s, j) => s + parseFloat(j.final_amount!), 0)
  const pendingEstimates = jobs.filter((j) => j.estimate_amount && !j.final_amount).length

  const statusCls: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Field Service</h1>
        <Link href="/dashboard/field-service/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">New Job</Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Jobs</p>
          <p className="text-2xl font-bold text-gray-900">{active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-gray-900">{completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Estimates</p>
          <p className="text-2xl font-bold text-gray-900">{pendingEstimates}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Job</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Scheduled</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estimate</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Final</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No jobs yet</td></tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/dashboard/field-service/${job.id}`}>
                  <td className="px-4 py-3 text-sm text-gray-900">{job.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{job.customer_name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${statusCls[job.status] || ""}`}>{job.status}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{job.estimate_amount ? `$${parseFloat(job.estimate_amount).toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{job.final_amount ? `$${parseFloat(job.final_amount).toFixed(2)}` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
