import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { queryOne, queryMany } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const customer = await queryOne(
    `SELECT * FROM customers WHERE id = $1 AND user_id = $2`,
    [id, session.user.id]
  )
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  const jobs = await queryMany(
    `SELECT * FROM jobs WHERE customer_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
    [id, session.user.id]
  )

  const invoices = await queryMany(
    `SELECT * FROM invoices WHERE customer_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
    [id, session.user.id]
  )

  return NextResponse.json({ customer, jobs, invoices })
}
