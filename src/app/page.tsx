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
      accent: "from-indigo-500 to-blue-500",
    },
    {
      name: "Compliance Tracking",
      price: "$49/mo",
      description: "Upload compliance documents, automatically extract expiry dates, and get reminded before they lapse.",
      features: ["PDF document upload", "AI-powered expiry extraction", "Expiry reminders", "Compliance dashboard"],
      href: "/signup",
      cta: "Start free trial",
      accent: "from-purple-500 to-pink-500",
    },
    {
      name: "Field Service",
      price: "$15/mo",
      description: "Create estimates and invoices from the field. Track customer history and manage jobs from your phone.",
      features: ["Mobile-first PWA", "Estimate creation", "Invoice management", "Customer history"],
      href: "/signup",
      cta: "Start free trial",
      accent: "from-emerald-500 to-teal-500",
    },
  ]

  return (
    <div className="bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/60 px-4 py-1.5 text-sm font-medium text-indigo-700 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              Trusted by 500+ small businesses
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Business tools that <span className="gradient-text">work as hard</span> as you do
            </h1>
            <p className="mt-6 text-lg text-gray-600 sm:text-xl">
              Invoice reminders, compliance tracking, and field service management — all in one place.
              Built for small businesses and trades.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-0.5"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-gray-300 bg-white/80 px-8 py-3.5 text-base font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-white hover:border-gray-400 hover:-translate-y-0.5"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Simple, powerful tools</h2>
          <p className="mt-4 text-lg text-gray-600">
            Pick the tools you need. Each module works standalone or together.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={feature.name}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-1"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Gradient accent bar */}
              <div className={`mb-6 h-1.5 w-12 rounded-full bg-gradient-to-r ${feature.accent} group-hover:w-20 transition-all duration-300`} />

              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{feature.name}</h3>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                  {feature.price}
                </span>
              </div>
              <p className="mt-4 text-gray-600">{feature.description}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {feature.features.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className={`h-5 w-5 flex-none bg-gradient-to-br ${feature.accent} rounded-full p-0.5 text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={feature.href}
                className="mt-8 w-full rounded-xl bg-gray-900 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-gray-800 group-hover:bg-indigo-600"
              >
                {feature.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to get started?</h2>
            <p className="mt-4 text-lg text-indigo-100">
              Sign up in seconds. No credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl hover:-translate-y-0.5"
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
