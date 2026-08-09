import { getSession } from "@/lib/session"
import { query } from "@/lib/db"
import { NextRequest } from "next/server"

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let inQuotes = false
  let val = ""
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { val += '"'; i++ }
        else inQuotes = false
      } else val += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ",") { current.push(val); val = "" }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++
        current.push(val); rows.push(current); current = []; val = ""
      } else val += ch
    }
  }
  if (val || current.length > 0) { current.push(val); rows.push(current) }
  return rows.filter(r => r.some(c => c.trim()))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file")
  if (!file || typeof file === "string") {
    return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length < 2) {
    return new Response(JSON.stringify({ error: "CSV must have a header row and at least one data row" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const header = rows[0].map(h => h.trim().toLowerCase())
  const nameIdx = header.findIndex(h => h === "name")
  const emailIdx = header.findIndex(h => h === "email")
  const phoneIdx = header.findIndex(h => h === "phone")
  const companyIdx = header.findIndex(h => h === "company" || h === "company_name")

  if (nameIdx === -1) {
    return new Response(JSON.stringify({ error: 'CSV must have a "name" column' }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  let imported = 0
  const errors: string[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = row[nameIdx]?.trim()
    if (!name) continue
    const email = emailIdx >= 0 ? row[emailIdx]?.trim() || null : null
    const phone = phoneIdx >= 0 ? row[phoneIdx]?.trim() || null : null
    const company = companyIdx >= 0 ? row[companyIdx]?.trim() || null : null

    try {
      await query(
        `INSERT INTO customers (user_id, name, email, phone, company_name) VALUES ($1, $2, $3, $4, $5)`,
        [session.userId, name, email, phone, company]
      )
      imported++
    } catch (e: any) {
      errors.push(`Row ${i + 1}: ${e.message || "failed"}`)
    }
  }

  return new Response(JSON.stringify({ imported, errors }), {
    headers: { "Content-Type": "application/json" },
  })
}
