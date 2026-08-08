import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { query, queryOne } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const doc = await queryOne(
    `SELECT cd.*, c.name as customer_name FROM compliance_docs cd LEFT JOIN customers c ON cd.customer_id = c.id WHERE cd.id = $1 AND cd.user_id = $2`,
    [id, session.user.id]
  )
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ doc })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await request.json()

  await query(
    `UPDATE compliance_docs SET doc_name = $1, doc_type = $2, customer_id = $3, expiry_date = $4, notes = $5, status = $6, updated_at = NOW()
     WHERE id = $7 AND user_id = $8`,
    [body.doc_name, body.doc_type, body.customer_id || null, body.expiry_date, body.notes || null, body.status || "active", id, session.user.id]
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  await query(`DELETE FROM compliance_docs WHERE id = $1 AND user_id = $2`, [id, session.user.id])
  return NextResponse.json({ ok: true })
}
