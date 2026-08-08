import Link from "next/link"

export default function LandingPage() {
  const features = [
    {
      name: "Invoice Reminders",
      price: "$19/mo",
      description: "Automated email reminders for overdue invoices. Import customers, create invoices, and let our system follow up automatically.",
      features: ["Customer management", "Invoice tracking", "Automated email reminders", "Payment status dashboard"],
      href: "/signup",
      cta: "Start free trial",
      accentColor: "text-indigo-600",
      checkBg: "bg-indigo-600",
      btnHover: "group-hover:bg-indigo-600",
    },
    {
      name: "Compliance Tracking",
      price: "$49/mo",
      description: "Upload compliance documents, automatically extract expiry dates, and get reminded before they lapse.",
      features: ["PDF document upload", "AI-powered expiry extraction", "Expiry reminders", "Compliance dashboard"],
      href: "/signup",
      cta: "Start free trial",
      accentColor: "text-purple-600",
      checkBg: "bg-purple-600",
      btnHover: "group-hover:bg-purple-600",
    },
    {
      name: "Field Service",
      price: "$15/mo",
      description: "Create estimates and invoices from the field. Track customer history and manage jobs from your phone.",
      features: ["Mobile-first PWA", "Estimate creation", "Invoice management", "Customer history"],
      href: "/signup",
      cta: "Start free trial",
      accentColor: "text-emerald-600",
      checkBg: "bg-emerald-600",
      btnHover: "group-hover:bg-emerald-600",
    },
  ]

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-400">
              Built for trades & small business
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Business tools that work as hard as you do
            </h1>
            <p className="mt-6 text-lg text-slate-300 sm:text-xl">
              Invoice reminders, compliance tracking, and field service management — all in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-slate-600 px-8 py-3.5 text-base font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:text-white"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Simple, powerful tools</h2>
          <p className="mt-4 text-lg text-gray-600">
            Pick the tools you need. Each module works standalone or together.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-8 transition-all duration-200 hover:border-gray-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{feature.name}</h3>
                <span className={`text-lg font-bold ${feature.accentColor}`}>
                  {feature.price}
                </span>
              </div>
              <p className="mt-4 text-gray-600">{feature.description}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {feature.features.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <svg className={`h-4 w-4 flex-none ${feature.checkBg} rounded-full p-0.5 text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={feature.href}
                className={`mt-8 w-full rounded-lg bg-gray-900 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-800 ${feature.btnHover}`}
              >
                {feature.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to get started?</h2>
            <p className="mt-4 text-lg text-slate-400">
              Sign up in seconds. No credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Create your account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500">© 2026 TradeDesk. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/login" className="hover:text-gray-700 transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-gray-700 transition-colors">Sign up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
