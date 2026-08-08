import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { getSession } from "@/lib/session"

export const runtime = "nodejs"

// GET /api/customers/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const customer = await queryOne(
    "SELECT id, name, email, phone, company_name, address FROM customers WHERE id = $1 AND user_id = $2",
    [id, session.userId]
  )

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ customer })
}

// PUT /api/customers/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, email, phone, company_name, address } = body

  const customer = await queryOne(
    `UPDATE customers SET name = $1, email = $2, phone = $3, company_name = $4, address = $5, updated_at = NOW()
     WHERE id = $6 AND user_id = $7
     RETURNING id, name, email, phone, company_name, address`,
    [name, email || null, phone || null, company_name || null, address || null, id, session.userId]
  )

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ customer })
}

// DELETE /api/customers/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await queryOne("DELETE FROM customers WHERE id = $1 AND user_id = $2", [id, session.userId])

  return NextResponse.json({ success: true })
}
