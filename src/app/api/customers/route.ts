import { NextRequest, NextResponse } from "next/server"
import { queryOne, queryMany } from "@/lib/db"
import { getSession } from "@/lib/session"
import { generateId } from "@/lib/auth"

export const runtime = "nodejs"

// GET /api/customers - list customers
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const customers = await queryMany(
    "SELECT id, name, email, phone, company_name, address FROM customers WHERE user_id = $1 ORDER BY created_at DESC",
    [session.userId]
  )

  return NextResponse.json({ customers })
}

// POST /api/customers - create customer
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { name, email, phone, company_name, address } = body

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    const id = generateId("cust")
    const customer = await queryOne(
      `INSERT INTO customers (id, user_id, name, email, phone, company_name, address, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, name, email, phone, company_name, address`,
      [id, session.userId, name, email || null, phone || null, company_name || null, address || null]
    )

    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Create customer error:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
