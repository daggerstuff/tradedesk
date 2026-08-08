import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { query, queryOne } from "@/lib/db"
import { generateId } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const job = await queryOne(`SELECT * FROM jobs WHERE id = $1 AND user_id = $2`, [id, session.userId])
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  const invoiceId = generateId("inv")
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`
  const dueDate = new Date(Date.now() + 30 * 86400000)
  const amount = job.final_amount || job.estimate_amount || "0"

  await query(
    `INSERT INTO invoices (id, user_id, customer_id, invoice_number, status, issue_date, due_date, subtotal, tax, total, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'draft', NOW(), $5, $6, 0, $7, $8, NOW(), NOW())`,
    [invoiceId, session.userId, job.customer_id, invoiceNumber, dueDate, amount, amount, `From job: ${job.title}`]
  )

  await query(
    `INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, created_at)
     VALUES ($1, $2, $3, 1, $4, NOW())`,
    [generateId("item"), invoiceId, job.title, amount]
  )

  return NextResponse.json({ invoice_id: invoiceId })
}
