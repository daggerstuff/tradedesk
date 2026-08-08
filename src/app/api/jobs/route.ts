import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { query, queryMany } from "@/lib/db"
import { generateId } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const jobs = await queryMany(
    `SELECT j.*, c.name as customer_name FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id WHERE j.user_id = $1 ORDER BY j.created_at DESC`,
    [session.user.id]
  )
  return NextResponse.json({ jobs })
}

export async function POST(request: Request) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const id = generateId("job")

  await query(
    `INSERT INTO jobs (id, user_id, customer_id, title, description, status, scheduled_date, location, estimate_amount, final_amount, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
    [id, session.user.id, body.customer_id, body.title, body.description || null, body.status || "scheduled",
     body.scheduled_date || null, body.location || null, body.estimate_amount || null, body.final_amount || null, body.notes || null]
  )
  return NextResponse.json({ id })
}
