import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { query, queryOne } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const job = await queryOne(
    `SELECT j.*, c.name as customer_name FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id WHERE j.id = $1 AND j.user_id = $2`,
    [id, session.userId]
  )
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ job })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await request.json()

  await query(
    `UPDATE jobs SET title = $1, description = $2, status = $3, scheduled_date = $4, location = $5, estimate_amount = $6, final_amount = $7, notes = $8, updated_at = NOW()
     WHERE id = $9 AND user_id = $10`,
    [body.title, body.description || null, body.status, body.scheduled_date || null, body.location || null,
     body.estimate_amount || null, body.final_amount || null, body.notes || null, id, session.userId]
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  await query(`DELETE FROM jobs WHERE id = $1 AND user_id = $2`, [id, session.userId])
  return NextResponse.json({ ok: true })
}
