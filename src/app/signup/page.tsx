"use client"

import { useState } from "react"
import Link from "next/link"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [trade, setTrade] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, company, trade }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to sign up")
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const trades = [
    { value: "electrician", label: "Electrician" },
    { value: "plumber", label: "Plumber" },
    { value: "hvac", label: "HVAC" },
    { value: "landscaper", label: "Landscaper" },
    { value: "handyman", label: "Handyman" },
    { value: "gc", label: "General Contractor" },
    { value: "painter", label: "Painter" },
    { value: "roofer", label: "Roofer" },
    { value: "other", label: "Other" },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-black text-zinc-900">
            TD
          </span>
          <span className="text-base font-bold text-zinc-100 tracking-tight">TradeDesk</span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-400 hover:text-amber-400 transition-colors"
        >
          Already have an account? <span className="text-amber-400">Log in →</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {sent ? (
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-zinc-100">You&apos;re set.</h1>
              <p className="text-zinc-400 leading-relaxed">
                Check <span className="text-zinc-200 font-medium">{email}</span> for your login link. 
                Once you&apos;re in, you can start invoicing today.
              </p>
              <div className="mt-6 rounded-lg bg-zinc-900 border border-zinc-800 p-4">
                <p className="text-sm text-zinc-400">
                  <span className="text-amber-400 font-medium">Install the app</span> on your phone — works offline in the truck, on the roof, or in the basement.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-100 leading-[1.15]">
                  Stop chasing payments.
                </h1>
                <p className="mt-3 text-zinc-500 text-[15px]">
                  Invoicing, reminders, compliance — built for people who actually do the work.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-400">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-3 text-zinc-100 text-[15px] placeholder:text-zinc-600 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    placeholder="Mike Rodriguez"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-zinc-400">
                    Company name <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-3 text-zinc-100 text-[15px] placeholder:text-zinc-600 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    placeholder="Rodriguez Electrical"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-400">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-3 text-zinc-100 text-[15px] placeholder:text-zinc-600 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    placeholder="mike@company.com"
                  />
                </div>
                <div>
                  <label htmlFor="trade" className="mb-1.5 block text-sm font-medium text-zinc-400">
                    Your trade
                  </label>
                  <select
                    id="trade"
                    required
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-3 text-zinc-100 text-[15px] transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none"
                  >
                    <option value="" disabled>Select your trade</option>
                    {trades.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-amber-500 py-3.5 font-bold text-zinc-900 text-[15px] transition-all hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Setting up..." : "Create free account"}
                </button>
              </form>

              <p className="mt-5 text-xs text-zinc-600">
                Free forever for 1 user. No credit card required.
              </p>

              <div className="mt-8 pt-6 border-t border-zinc-800/60">
                <p className="text-xs text-zinc-600">
                  Been here before? <Link href="/login" className="text-amber-500/80 hover:text-amber-400 transition-colors">Log in instead</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-700">© 2026 TradeDesk</p>
      </footer>
    </div>
  )
}
