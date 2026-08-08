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
    },
    {
      name: "Compliance Tracking",
      price: "$49/mo",
      description: "Upload compliance documents, automatically extract expiry dates, and get reminded before they lapse.",
      features: ["PDF document upload", "AI-powered expiry extraction", "Expiry reminders", "Compliance dashboard"],
      href: "/signup",
      cta: "Start free trial",
    },
    {
      name: "Field Service",
      price: "$15/mo",
      description: "Create estimates and invoices from the field. Track customer history and manage jobs from your phone.",
      features: ["Mobile-first PWA", "Estimate creation", "Invoice management", "Customer history"],
      href: "/signup",
      cta: "Start free trial",
    },
  ]

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Business tools that work as hard as you do
            </h1>
            <p className="mt-6 text-lg text-gray-600 sm:text-xl">
              Invoice reminders, compliance tracking, and field service management — all in one place.
              Built for small businesses and trades.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-md bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">Simple, powerful tools</h2>
          <p className="mt-4 text-gray-600">
            Pick the tools you need. Each module works standalone or together.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{feature.name}</h3>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                  {feature.price}
                </span>
              </div>
              <p className="mt-4 text-gray-600">{feature.description}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {feature.features.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-none text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={feature.href}
                className="mt-8 w-full rounded-md bg-indigo-600 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
              >
                {feature.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
            <p className="mt-4 text-lg text-indigo-100">
              Sign up in seconds. No credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-md bg-white px-8 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50"
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
              <Link href="/login" className="hover:text-gray-700">Sign in</Link>
              <Link href="/signup" className="hover:text-gray-700">Sign up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
