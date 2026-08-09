import { getSession } from "@/lib/session"
import { queryMany } from "@/lib/db"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const year = searchParams.get("year") || new Date().getFullYear().toString()

  const [invoices, expenses] = await Promise.all([
    queryMany<{ invoice_number: string; issue_date: string; customer_name: string; total: string; status: string }>(
      `SELECT i.invoice_number, i.issue_date, c.name as customer_name, i.total, i.status
       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.user_id = $1 AND EXTRACT(YEAR FROM i.issue_date) = $2
       ORDER BY i.issue_date`,
      [session.userId, year]
    ),
    queryMany<{ date: string; category: string; vendor: string; amount: string; description: string }>(
      `SELECT date, category, vendor, amount, description
       FROM expenses
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       ORDER BY date`,
      [session.userId, year]
    ),
  ])

  // Build CSV
  const lines: string[] = []
  lines.push("TRADESDesk Tax Export - Year " + year)
  lines.push("")
  lines.push("INCOME")
  lines.push("Date,Invoice,Customer,Amount,Status")
  let totalIncome = 0
  for (const inv of invoices) {
    const amt = parseFloat(inv.total)
    totalIncome += amt
    lines.push(`${inv.issue_date},${inv.invoice_number},"${inv.customer_name || ""}",${amt.toFixed(2)},${inv.status}`)
  }
  lines.push(`Total Income,,,${totalIncome.toFixed(2)},`)
  lines.push("")
  lines.push("EXPENSES")
  lines.push("Date,Category,Vendor,Description,Amount")
  let totalExpenses = 0
  for (const exp of expenses) {
    const amt = parseFloat(exp.amount)
    totalExpenses += amt
    lines.push(`${exp.date},${exp.category},"${exp.vendor}","${exp.description || ""}",${amt.toFixed(2)}`)
  }
  lines.push(`Total Expenses,,,${totalExpenses.toFixed(2)},`)
  lines.push("")
  lines.push(`NET INCOME,,,${(totalIncome - totalExpenses).toFixed(2)},`)

  const csv = lines.join("\n")
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="tradedesk-tax-${year}.csv"`,
    },
  })
}
