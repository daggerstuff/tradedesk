import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const searchTerm = `%${q}%`;
  const userId = session.userId;

  const [invoices, customers, quotes, jobs] = await Promise.all([
    query(
      `SELECT id, invoice_number as title, status, total, 'invoice' as type
       FROM invoices
       WHERE user_id = $1 AND (invoice_number ILIKE $2 OR notes ILIKE $2)
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId, searchTerm]
    ),
    query(
      `SELECT id, name as title, email, 'customer' as type
       FROM customers
       WHERE user_id = $1 AND (name ILIKE $2 OR email ILIKE $2 OR company_name ILIKE $2)
       ORDER BY name
       LIMIT 5`,
      [userId, searchTerm]
    ),
    query(
      `SELECT id, quote_number as title, status, total, 'quote' as type
       FROM quotes
       WHERE user_id = $1 AND (quote_number ILIKE $2 OR notes ILIKE $2)
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId, searchTerm]
    ),
    query(
      `SELECT id, title, status, 'job' as type
       FROM jobs
       WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2 OR location ILIKE $2)
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId, searchTerm]
    ),
  ]);

  const results = [
    ...invoices.map((r: Record<string, unknown>) => ({ ...r, href: `/dashboard/invoices/${r.id}` })),
    ...customers.map((r: Record<string, unknown>) => ({ ...r, href: `/dashboard/customers/${r.id}` })),
    ...quotes.map((r: Record<string, unknown>) => ({ ...r, href: `/dashboard/quotes/${r.id}` })),
    ...jobs.map((r: Record<string, unknown>) => ({ ...r, href: `/dashboard/field-service/${r.id}` })),
  ];

  return NextResponse.json({ results });
}
