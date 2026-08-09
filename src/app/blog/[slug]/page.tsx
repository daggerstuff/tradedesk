import { notFound } from 'next/navigation';
import Link from 'next/link';

const posts: Record<string, { title: string; date: string; content: string }> = {
  'invoice-reminders-get-paid-faster': {
    title: 'How Automated Invoice Reminders Help Small Businesses Get Paid Faster',
    date: '2026-08-08',
    content: `
      <p>Late payments are the #1 cash flow killer for small businesses. The average invoice in the US takes 28 days to pay — but businesses that send automated reminders consistently get paid in under 10 days.</p>
      <h2>Why invoices go unpaid</h2>
      <p>Most late payments aren't intentional. The invoice gets buried in someone's inbox, the due date slips by, or the accounts payable process is simply slow. A polite nudge at the right time fixes this.</p>
      <h2>What to automate</h2>
      <ul>
        <li><strong>3 days before due:</strong> Friendly reminder that payment is coming up</li>
        <li><strong>On the due date:</strong> "Invoice is due today"</li>
        <li><strong>7 days after:</strong> Late notice with a direct payment link</li>
        <li><strong>14+ days:</strong> Final notice before collections</li>
      </ul>
      <h2>Results you can expect</h2>
      <p>Businesses using TradeDesk's automated reminders report:</p>
      <ul>
        <li>40% reduction in average days-to-payment</li>
        <li>Fewer awkward client conversations about money</li>
        <li>More predictable revenue for planning and growth</li>
      </ul>
      <p><a href="/signup">Get started with TradeDesk</a> — free for your first 5 invoices.</p>
    `,
  },
  'field-service-management-software': {
    title: 'Field Service Management Software: A Complete Guide for Trade Businesses',
    date: '2026-08-08',
    content: `
      <p>If you run a trade business — plumbing, electrical, HVAC, landscaping, or any on-site service — your time is split between doing the job and running the business. Good field service software handles the admin so you can focus on the work.</p>
      <h2>What field service software should do</h2>
      <ul>
        <li><strong>Job scheduling:</strong> Assign and track jobs with dates, locations, and statuses</li>
        <li><strong>Customer history:</strong> See every job, invoice, and note in one place</li>
        <li><strong>Estimates to invoices:</strong> Convert approved quotes directly into invoices</li>
        <li><strong>Mobile access:</strong> Update job status and send invoices from the field</li>
      </ul>
      <h2>Why general tools aren't enough</h2>
      <p>Spreadsheets and generic project tools work until they don't. Trade businesses need workflows that match how field work actually happens: estimate → approve → schedule → complete → invoice → get paid.</p>
      <h2>How TradeDesk fits</h2>
      <p>TradeDesk was built specifically for small trade businesses. It combines customer management, quotes, invoicing, field service scheduling, expense tracking, and compliance — in one simple tool that costs less than a single lunch per week.</p>
      <p><a href="/signup">Try it free →</a></p>
    `,
  },
  'compliance-document-tracking': {
    title: 'Compliance Document Tracking: Never Let a License Expire Again',
    date: '2026-08-08',
    content: `
      <p>An expired license or insurance certificate can shut down a job site — or worse, expose your business to liability. Yet most small trade businesses track compliance on spreadsheets, sticky notes, or memory.</p>
      <h2>The real cost of expired documents</h2>
      <ul>
        <li>Contractor license lapse: fines up to $5,000 in most states</li>
        <li>Insurance cancellation: no coverage when you need it</li>
        <li>Lost contracts: many GCs require current certs before releasing payment</li>
      </ul>
      <h2>A simple tracking system</h2>
      <p>You need three things:</p>
      <ol>
        <li>A list of every document that has an expiry date</li>
        <li>Automated reminders 30, 14, and 7 days before expiry</li>
        <li>A single place to store the documents themselves</li>
      </ol>
      <h2>How TradeDesk handles it</h2>
      <p>TradeDesk's compliance tracker stores your documents, tracks expiry dates, and sends automatic reminders so you always renew on time. Set it once and never worry about it again.</p>
      <p><a href="/signup">Start tracking for free →</a></p>
    `,
  },
  'invoice-gets-paid': {
    title: 'How to Write an Invoice That Gets Paid: A Contractor\'s Guide',
    date: '2026-08-09',
    content: `
      <p>You finished the work. Now you need to get paid. But a vague or incomplete invoice is the fastest way to delay your payment — or never see it at all.</p>
      <h2>The anatomy of a paid-fast invoice</h2>
      <p>Every invoice you send should include these five elements:</p>
      <ol>
        <li><strong>Your business name and contact info</strong> — makes you look professional and gives them someone to call with questions</li>
        <li><strong>A unique invoice number</strong> — essential for tracking and accounting (use sequential numbering)</li>
        <li><strong>A clear description of work</strong> — "Bathroom remodel - Phase 2" not "Services rendered"</li>
        <li><strong>The exact amount due and due date</strong> — no ambiguity about what's owed and when</li>
        <li><strong>A payment link</strong> — let them pay in one click instead of writing a check</li>
      </ol>
      <h2>Common invoicing mistakes that delay payment</h2>
      <ul>
        <li><strong>No due date:</strong> "Net 30" means nothing if they don't know when the clock started</li>
        <li><strong>Vague line items:</strong> "Labor" doesn't tell them what they paid for</li>
        <li><strong>Sending by mail only:</strong> Email gets there faster and gives you a delivery receipt</li>
        <li><strong>No follow-up:</strong> Most late payments just need a polite reminder</li>
      </ul>
      <h2>How TradeDesk helps</h2>
      <p>TradeDesk generates professional invoices with automatic numbering, one-click payment links, and scheduled reminders. Create an invoice in 60 seconds and get paid faster.</p>
      <p><a href="/signup">Start invoicing for free →</a></p>
    `,
  },
  'contractor-expense-tracking': {
    title: 'Expense Tracking for Contractors: Tax Deductions You\'re Probably Missing',
    date: '2026-08-09',
    content: `
      <p>Tax day is painful for contractors who don't track expenses. Every receipt you lose is money you're paying taxes on that you shouldn't be.</p>
      <h2>Common deductions contractors miss</h2>
      <ul>
        <li><strong>Vehicle mileage:</strong> The IRS allows 67 cents per mile (2024) — a 20-mile round trip to a job site is $13.40 in deductions</li>
        <li><strong>Tools and supplies:</strong> Blades, bits, gloves, consumables — they add up fast</li>
        <li><strong>Home office:</strong> If you do estimates, invoicing, or calls from home, you qualify</li>
        <li><strong>Phone bill:</strong> The business portion is deductible</li>
        <li><strong>Insurance premiums:</strong> General liability, workers comp, tool insurance</li>
        <li><strong>Continuing education:</strong> License renewal courses, safety training</li>
      </ul>
      <h2>A simple tracking system</h2>
      <p>You don't need complex accounting software. You need:</p>
      <ol>
        <li>A habit of logging expenses weekly (5 minutes)</li>
        <li>Categories that match tax line items</li>
        <li>A place to store receipts (photos are fine)</li>
      </ol>
      <h2>How TradeDesk handles it</h2>
      <p>TradeDesk lets you log expenses by category, attach receipt photos, and run reports at tax time. Your accountant will thank you — and so will your refund.</p>
      <p><a href="/signup">Start tracking expenses →</a></p>
    `,
  },
  'contractor-estimate-template': {
    title: 'How to Write a Contractor Estimate That Wins Jobs (Free Template)',
    date: '2026-08-09',
    content: `
      <p>You showed up, took measurements, and priced the job. Now you need to send an estimate that wins. A sloppy estimate loses jobs to competitors who look more professional — even if their price is higher.</p>
      <h2>What a professional estimate includes</h2>
      <ol>
        <li><strong>Your business info:</strong> Name, license number, insurance details, and contact info. This builds instant trust.</li>
        <li><strong>Client info:</strong> Name, address, and project location.</li>
        <li><strong>Scope of work:</strong> A clear, line-by-line description of what you will (and won't) do.</li>
        <li><strong>Materials and labor:</strong> Break down costs so clients see the value.</li>
        <li><strong>Total price:</strong> Clear and upfront. No hidden fees.</li>
        <li><strong>Validity period:</strong> "This estimate is valid for 30 days" protects you from material cost changes.</li>
        <li><strong>Next steps:</strong> How to approve and what happens after.</li>
      </ol>
      <h2>The #1 mistake contractors make</h2>
      <p>Writing "kitchen remodel — $8,000" with no breakdown. Clients want to see where the money goes. A detailed estimate shows professionalism and reduces price-shopping.</p>
      <h2>From estimate to invoice</h2>
      <p>Once approved, your estimate should convert directly into an invoice — same line items, same numbers. TradeDesk lets you do this with one click, so you never re-scope or re-price twice.</p>
      <h2>Free estimate template</h2>
      <p>Use this structure for every estimate:</p>
      <pre>
[Your Business Name] | [License #]
Estimate for: [Client Name]
Project: [Address / Description]

1. [Task description] — $[amount]
2. [Task description] — $[amount]
3. [Task description] — $[amount]

Materials: $[amount]
Labor: $[amount]
Total: $[amount]

Valid for 30 days. To approve, reply to this email or call [phone].
      </pre>
      <p><a href="/signup">Create professional estimates with TradeDesk →</a></p>
    `,
  },
  'contractor-payment-terms': {
    title: 'Contractor Payment Terms That Actually Get You Paid',
    date: '2026-08-09',
    content: `
      <p>You did the work. The client is happy. But 30 days later, your invoice is still unpaid. The difference between getting paid on time and chasing money often comes down to the payment terms you set upfront.</p>
      <h2>The best payment terms for contractors</h2>
      <ul>
        <li><strong>50% deposit before starting:</strong> Covers materials and commits the client. Never start without one.</li>
        <li><strong>Milestone payments:</strong> For large projects, bill at 25%, 50%, 75%, and completion.</li>
        <li><strong>Net 15 (not Net 30):</strong> You're a contractor, not a bank. Shorter terms = faster cash.</li>
        <li><strong>Late fees:</strong> 1.5% per month on overdue balances. State this clearly on every invoice.</li>
        <li><strong>Payment methods:</strong> Accept credit cards, bank transfers, and checks. The easier you make it, the faster you get paid.</li>
      </ul>
      <h2>What to put in writing</h2>
      <p>Verbal agreements don't protect you. Every project should have a signed agreement that includes:</p>
      <ul>
        <li>Total project cost and payment schedule</li>
        <li>Deposit amount and when it's due</li>
        <li>Late fee policy</li>
        <li>Scope of work (to prevent "while you're here..." creep)</li>
        <li>Change order process (how extra work gets billed)</li>
      </ul>
      <h2>How TradeDesk enforces your terms</h2>
      <p>TradeDesk includes payment terms automatically on every invoice, sends scheduled reminders before and after the due date, and lets clients pay instantly with a credit card or bank transfer — no excuses for late payment.</p>
      <p><a href="/signup">Set up payment terms that protect your cash flow →</a></p>
    `,
  },
};

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = posts[params.slug];
  if (!post) return {};
  return { title: `${post.title} — TradeDesk Blog` };
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = posts[params.slug];
  if (!post) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/blog" className="text-blue-600 text-sm mb-4 inline-block">← Back to blog</Link>
      <p className="text-sm text-gray-400 mb-2">{post.date}</p>
      <h1 className="text-3xl font-bold mb-8">{post.title}</h1>
      <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </main>
  );
}
