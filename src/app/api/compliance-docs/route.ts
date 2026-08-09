import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { query, queryMany } from "@/lib/db"
import { generateId } from "@/lib/auth"
import { getUserPlan, hasFeature } from "@/lib/billing"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const docs = await queryMany(
    `SELECT cd.*, c.name as customer_name
     FROM compliance_docs cd
     LEFT JOIN customers c ON cd.customer_id = c.id
     WHERE cd.user_id = $1
     ORDER BY cd.expiry_date ASC`,
    [session.userId]
  )
  return NextResponse.json({ docs })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { plan } = await getUserPlan(session.userId)
  if (!hasFeature(plan, 'compliance')) {
    return NextResponse.json({ error: "Upgrade to Compliance Tracking ($49/mo) to use this feature." }, { status: 403 })
  }

  const body = await request.json()
  const id = generateId("comp")

  await query(
    `INSERT INTO compliance_docs (id, user_id, customer_id, doc_type, doc_name, expiry_date, status, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW(), NOW())`,
    [id, session.userId, body.customer_id || null, body.doc_type, body.doc_name, body.expiry_date, body.notes || null]
  )
  return NextResponse.json({ id })
}
