import Link from "next/link"

export default function LandingPage() {
  const PH_LAUNCH = false; // flip to true on launch day
  const features = [
    {
      name: "Invoice Reminders",
      price: "$19/mo",
      tagline: "Get paid faster",
      description: "Stop chasing late payments. Import customers, send invoices, and let automated reminders follow up for you.",
      features: ["Customer management", "Invoice tracking", "Automated email & push reminders", "Payment status dashboard", "Stripe online payments"],
      href: "/signup",
      cta: "Start free trial",
      accentColor: "text-indigo-600",
      checkBg: "bg-indigo-600",
      btnHover: "group-hover:bg-indigo-600",
    },
    {
      name: "Compliance Tracking",
      price: "$49/mo",
      tagline: "Never miss a deadline",
      description: "Upload compliance documents and get reminded before certifications, licenses, and insurance policies expire.",
      features: ["Document upload", "AI-powered expiry extraction", "30-day expiry alerts", "Compliance dashboard", "Per-customer tracking"],
      href: "/signup",
      cta: "Start free trial",
      accentColor: "text-purple-600",
      checkBg: "bg-purple-600",
      btnHover: "group-hover:bg-purple-600",
    },
    {
      name: "Field Service",
      price: "$15/mo",
      tagline: "Run jobs from your phone",
      description: "Create quotes, convert to invoices, and track jobs — all from the field. Built for contractors on the go.",
      features: ["Mobile-first PWA", "Quote-to-invoice conversion", "Job scheduling & tracking", "Customer job history", "Photo documentation"],
      href: "/signup",
      cta: "Start free trial",
      accentColor: "text-emerald-600",
      checkBg: "bg-emerald-600",
      btnHover: "group-hover:bg-emerald-600",
    },
  ]

  const benefits = [
    {
      title: "Built for trades, not tech",
      description: "Designed for electricians, plumbers, HVAC, landscapers, and handymen. No jargon, no fluff — just tools that get the job done.",
    },
    {
      title: "Pay for what you use",
      description: "Don't pay $300/mo for a bloated all-in-one. Pick the modules you need and add more as you grow. Cancel anytime.",
    },
    {
      title: "Works on any device",
      description: "Installable PWA that works offline. Quote a job from the truck, send an invoice from the site — no app store needed.",
    },
    {
      title: "Your data stays yours",
      description: "Export everything anytime. No lock-in, no contracts, no hidden fees. Simple and honest pricing.",
    },
  ]

  return (
    <div className="bg-white">
      {/* Product Hunt launch banner */}
      {PH_LAUNCH && (
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center py-2 text-sm font-medium">
          🚀 We&apos;re live on Product Hunt! <a href="https://producthunt.com" target="_blank" rel="noopener noreferrer" className="underline">Support us →</a>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-400">
              For trades & field service businesses
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Run your business for{" "}
              <span className="text-indigo-400">$15/mo</span>
              {" "}not $300
            </h1>
            <p className="mt-6 text-lg text-slate-300 sm:text-xl">
              Invoicing, compliance tracking, and field service management — without the enterprise price tag.
              Pick what you need. Add more when you grow.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
            <p className="mt-4 text-sm text-slate-500">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.title}>
                <h3 className="text-sm font-bold text-gray-900">{benefit.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing/Modules */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Pick your tools. Skip the bloat.</h2>
          <p className="mt-4 text-lg text-gray-600">
            Each module works on its own or together. Start with one, add more anytime.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-8 transition-all duration-200 hover:border-gray-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.name}</h3>
                  <p className={`text-sm font-medium ${feature.accentColor}`}>{feature.tagline}</p>
                </div>
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

      {/* How it works */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Up and running in 5 minutes</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "Create your account", desc: "Sign up with your email. No credit card, no setup fee." },
              { step: "2", title: "Add your customers", desc: "Import or add customers manually. Start sending invoices right away." },
              { step: "3", title: "Get paid and stay compliant", desc: "Automated reminders follow up. Compliance alerts keep you covered." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Stop leaving money on the table</h2>
            <p className="mt-4 text-lg text-slate-400">
              Join trades businesses getting paid faster and staying compliant — for less than the cost of lunch.
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
