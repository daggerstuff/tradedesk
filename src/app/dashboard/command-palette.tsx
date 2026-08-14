"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

interface Command {
  id: string
  label: string
  icon: string
  action: () => void
  section: string
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: Command[] = [
    { id: "new-invoice", label: "New Invoice", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", action: () => router.push("/dashboard/invoices/new"), section: "Create" },
    { id: "new-quote", label: "New Quote", icon: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4", action: () => router.push("/dashboard/quotes/new"), section: "Create" },
    { id: "new-customer", label: "New Customer", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", action: () => router.push("/dashboard/customers/new"), section: "Create" },
    { id: "new-job", label: "New Job", icon: "M12 4v16m8-8H4", action: () => router.push("/dashboard/field-service/new"), section: "Create" },
    { id: "new-expense", label: "Log Expense", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", action: () => router.push("/dashboard/expenses/new"), section: "Create" },
    { id: "overview", label: "Go to Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", action: () => router.push("/dashboard"), section: "Navigate" },
    { id: "invoices", label: "Go to Invoices", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", action: () => router.push("/dashboard/invoices"), section: "Navigate" },
    { id: "quotes", label: "Go to Quotes", icon: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4", action: () => router.push("/dashboard/quotes"), section: "Navigate" },
    { id: "customers", label: "Go to Customers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", action: () => router.push("/dashboard/customers"), section: "Navigate" },
    { id: "field-service", label: "Go to Field Service", icon: "M11 3.055A5.001 5.001 0 005.055 9c0 2.761 2.239 5 5 5M11 3.055A5.001 5.001 0 0116.945 9c0 2.761-2.239 5-5 5M11 3.055V3a2 2 0 012-2h2a2 2 0 012 2v.5", action: () => router.push("/dashboard/field-service"), section: "Navigate" },
    { id: "expenses", label: "Go to Expenses", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", action: () => router.push("/dashboard/expenses"), section: "Navigate" },
    { id: "compliance", label: "Go to Compliance", icon: "M9 12l2 2 4-4m5.618-4.016A11.903 11.903 0 0112 20c-4.477 0-8.265-2.629-9.893-6.382a.999.999 0 010-.764C3.735 8.629 7.523 6 12 6c4.477 0 8.265 2.629 9.893 6.382a.999.999 0 010 .764A11.903 11.903 0 0112 20z", action: () => router.push("/dashboard/compliance"), section: "Navigate" },
    { id: "analytics", label: "Go to Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", action: () => router.push("/dashboard/reports"), section: "Navigate" },
    { id: "team", label: "Go to Team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", action: () => router.push("/dashboard/team"), section: "Navigate" },
    { id: "settings", label: "Go to Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.99.608 2.296.07 2.572-1.065z", action: () => router.push("/dashboard/settings"), section: "Navigate" },
  ]

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.section]) acc[cmd.section] = []
    acc[cmd.section].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      setOpen(prev => !prev)
      setQuery("")
      setSelected(0)
    }
    if (e.key === "Escape") {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("open-command-palette", () => setOpen(true))
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("open-command-palette", () => setOpen(true))
    }
  }, [handleKeyDown])

  useEffect(() => {
    if (open) {
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelected(0)
  }, [query])

  const handleArrowKeys = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelected(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelected(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && filtered[selected]) {
      e.preventDefault()
      filtered[selected].action()
      setOpen(false)
      setQuery("")
    }
  }, [filtered, selected])

  if (!open) return null

  let flatIndex = -1

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      
      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <svg className="h-5 w-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleArrowKeys}
            placeholder="Type a command or search..."
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500">No results found</p>
            </div>
          ) : (
            Object.entries(grouped).map(([section, cmds]) => (
              <div key={section}>
                <div className="px-4 py-1.5">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{section}</span>
                </div>
                {cmds.map((cmd) => {
                  flatIndex++
                  const idx = flatIndex
                  const isSelected = idx === selected
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => { cmd.action(); setOpen(false); setQuery("") }}
                      onMouseEnter={() => setSelected(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${isSelected ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}
                      `}
                    >
                      <svg className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-indigo-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cmd.icon} />
                      </svg>
                      <span className="text-sm font-medium">{cmd.label}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  )
}
