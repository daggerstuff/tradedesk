import Link from 'next/link';

const posts = [
  {
    slug: 'invoice-reminders-get-paid-faster',
    title: 'How Automated Invoice Reminders Help Small Businesses Get Paid Faster',
    excerpt: 'Late payments hurt cash flow. Learn how automated reminders reduce average payment time from 30 days to under 10.',
    date: '2026-08-08',
  },
  {
    slug: 'field-service-management-software',
    title: 'Field Service Management Software: A Complete Guide for Trade Businesses',
    excerpt: 'From scheduling to invoicing, the right field service software can cut admin time in half. Here\'s what to look for.',
    date: '2026-08-08',
  },
  {
    slug: 'compliance-document-tracking',
    title: 'Compliance Document Tracking: Never Let a License Expire Again',
    description: 'Expired licenses cost trade businesses thousands. A simple tracking system prevents fines and keeps your business compliant.',
    date: '2026-08-08',
  },
  {
    slug: 'invoice-gets-paid',
    title: 'How to Write an Invoice That Gets Paid: A Contractor\'s Guide',
    excerpt: 'The difference between a paid invoice and a forgotten one is often just a few lines. Learn the exact structure that gets contractors paid faster.',
    date: '2026-08-09',
  },
  {
    slug: 'contractor-expense-tracking',
    title: 'Expense Tracking for Contractors: Tax Deductions You\'re Probably Missing',
    excerpt: 'Most contractors leave money on the table at tax time. Here are the common deductions and a simple system to track them all year round.',
    date: '2026-08-09',
  },
];

export const metadata = {
  title: 'Blog — TradeDesk',
  description: 'Tips and guides for small trade businesses: invoicing, field service, compliance, and getting paid faster.',
};

export default function BlogPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">TradeDesk Blog</h1>
      <p className="text-gray-500 mb-10">Tips for running a tighter trade business.</p>
      <div className="space-y-8">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block border rounded-xl p-6 hover:border-blue-500 transition">
            <p className="text-sm text-gray-400 mb-1">{post.date}</p>
            <h2 className="text-xl font-semibold mb-1">{post.title}</h2>
            <p className="text-gray-600">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
