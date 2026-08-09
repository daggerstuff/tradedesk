"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

export function CsvImportButton() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/customers/import", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        router.refresh()
      } else {
        setResult({ imported: 0, errors: [data.error || "Import failed"] })
      }
    } catch {
      setResult({ imported: 0, errors: ["Network error"] })
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Import Customers from CSV</h3>
            <p className="mt-2 text-sm text-gray-600">
              CSV must have a <code className="rounded bg-gray-100 px-1 text-xs">name</code> column.
              Optional columns: <code className="rounded bg-gray-100 px-1 text-xs">email</code>,{" "}
              <code className="rounded bg-gray-100 px-1 text-xs">phone</code>,{" "}
              <code className="rounded bg-gray-100 px-1 text-xs">company</code>.
            </p>

            <div className="mt-4">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleUpload}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
              />
            </div>

            {loading && <p className="mt-3 text-sm text-gray-500">Importing...</p>}

            {result && (
              <div className="mt-3">
                <p className="text-sm font-medium text-green-600">
                  Imported {result.imported} customer{result.imported !== 1 ? "s" : ""}
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-1 text-xs text-red-600 list-disc pl-4">
                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => { setOpen(false); setResult(null) }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
