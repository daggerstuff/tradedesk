import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { unauthorized } from '@/lib/api-errors';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '6m';

  let fromDate: string;
  const now = new Date();
  switch (range) {
    case '30d':
      fromDate = new Date(now.getTime() - 30 * 86400000).toISOString();
      break;
    case '90d':
      fromDate = new Date(now.getTime() - 90 * 86400000).toISOString();
      break;
    case 'ytd':
      fromDate = new Date(now.getFullYear(), 0, 1).toISOString();
      break;
    case '12m':
      fromDate = new Date(now.getTime() - 365 * 86400000).toISOString();
      break;
    case 'all':
      fromDate = '2000-01-01';
      break;
    default:
      fromDate = new Date(now.getTime() - 180 * 86400000).toISOString();
  }

  const uid = session.userId;

  // Monthly cash flow
  const cashFlow = await query<{ month: string; revenue: string; expenses: string }>(
    `SELECT TO_CHAR(d, 'Mon YYYY') as month,
       COALESCE((SELECT SUM(p.amount) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.user_id = $1 AND date_trunc('month', p.date) = d), 0) as revenue,
       COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = $1 AND date_trunc('month', date) = d), 0) as expenses
     FROM generate_series(date_trunc('month', $2::timestamptz), date_trunc('month', NOW()), '1 month') d
     GROUP BY 1, d ORDER BY d`,
    [uid, fromDate]
  );

  // Outstanding invoices (total minus payments received)
  const outstanding = await query<{ status: string; count: string; total: string }>(
    `SELECT i.status, COUNT(*) as count, COALESCE(SUM(i.total - COALESCE(p.paid, 0)), 0) as total
     FROM invoices i
     LEFT JOIN (SELECT invoice_id, SUM(amount) as paid FROM payments GROUP BY invoice_id) p ON i.id = p.invoice_id
     WHERE i.user_id = $1 AND i.status IN ('sent', 'overdue', 'partial')
     GROUP BY i.status ORDER BY total DESC`,
    [uid]
  );

  // Top customers by revenue in period
  const topCustomers = await query<{ name: string; total: string; count: string }>(
    `SELECT c.name, SUM(p.total_paid) as total, COUNT(DISTINCT i.id) as count
     FROM customers c
     JOIN invoices i ON c.id = i.customer_id
     JOIN (SELECT invoice_id, SUM(amount) as total_paid FROM payments GROUP BY invoice_id) p ON i.id = p.invoice_id
     WHERE c.user_id = $1
     GROUP BY c.name ORDER BY total DESC LIMIT 8`,
    [uid]
  );

  // Expense breakdown in period
  const expenseBreakdown = await query<{ category: string; total: string }>(
    `SELECT category, SUM(amount) as total
     FROM expenses WHERE user_id = $1 AND date >= $2::date
     GROUP BY category ORDER BY total DESC`,
    [uid, fromDate]
  );

  // Key metrics
  const metrics = await query<{
    total_revenue: string;
    total_expenses: string;
    invoice_count: string;
    avg_invoice: string;
    paid_count: string;
    outstanding_total: string;
    outstanding_count: string;
    unique_customers: string;
  }>(
    `SELECT
       (SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.user_id = $1 AND p.date >= $2::date) as total_revenue,
       (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = $1 AND date >= $2::date) as total_expenses,
       (SELECT COUNT(*) FROM invoices WHERE user_id = $1 AND issue_date >= $2::date) as invoice_count,
       (SELECT COALESCE(AVG(p.amount), 0) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.user_id = $1 AND p.date >= $2::date) as avg_invoice,
       (SELECT COUNT(DISTINCT p.invoice_id) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.user_id = $1 AND p.date >= $2::date) as paid_count,
       (SELECT COALESCE(SUM(i.total - COALESCE(paid, 0)), 0) FROM invoices i LEFT JOIN (SELECT invoice_id, SUM(amount) as paid FROM payments GROUP BY invoice_id) p ON i.id = p.invoice_id WHERE i.user_id = $1 AND i.status IN ('sent', 'overdue', 'partial')) as outstanding_total,
       (SELECT COUNT(*) FROM invoices i LEFT JOIN (SELECT invoice_id, SUM(amount) as paid FROM payments GROUP BY invoice_id) p ON i.id = p.invoice_id WHERE i.user_id = $1 AND i.status IN ('sent', 'overdue', 'partial') AND i.total - COALESCE(paid, 0) > 0) as outstanding_count,
       (SELECT COUNT(DISTINCT customer_id) FROM invoices WHERE user_id = $1 AND issue_date >= $2::date) as unique_customers`,
    [uid, fromDate]
  );

  // Year over year
  const yoy = await query<{ year: string; revenue: string; expenses: string }>(
    `SELECT EXTRACT(YEAR FROM d)::text as year,
       COALESCE((SELECT SUM(p.amount) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.user_id = $1 AND EXTRACT(YEAR FROM p.date) = EXTRACT(YEAR FROM d)), 0) as revenue,
       COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM d)), 0) as expenses
     FROM generate_series(date_trunc('year', $2::timestamptz), date_trunc('year', NOW()), '1 year') d
     GROUP BY 1, d ORDER BY d`,
    [uid, fromDate]
  );

  return NextResponse.json({
    range,
    cashFlow,
    outstanding,
    topCustomers,
    expenseBreakdown,
    metrics: metrics[0],
    yoy,
  });
}
