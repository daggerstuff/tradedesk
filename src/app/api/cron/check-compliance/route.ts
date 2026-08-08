import { NextResponse } from "next/server"
import { query, queryMany } from "@/lib/db"
import { sendEmail, complianceReminderEmail } from "@/lib/resend"
import { generateId } from "@/lib/auth"

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const expiring = await queryMany(
    `SELECT cd.*, u.email, u.name as user_name
     FROM compliance_docs cd
     JOIN users u ON cd.user_id = u.id
     WHERE cd.expiry_date <= NOW() + INTERVAL '30 days'
     AND cd.status = 'active'
     AND NOT EXISTS (
       SELECT 1 FROM reminders r
       WHERE r.invoice_id = cd.id AND r.type = 'compliance'
       AND r.sent_at > NOW() - INTERVAL '24 hours'
     )`
  )

  let sent = 0
  for (const doc of expiring) {
    const daysUntil = Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / 86400000)
    const html = complianceReminderEmail(doc.user_name || "there", doc.doc_name, new Date(doc.expiry_date).toLocaleDateString())
    const subject = `Compliance reminder: ${doc.doc_name} expires in ${daysUntil} days`

    await sendEmail({ to: doc.email, subject, html })

    const reminderId = generateId("rem")
    await query(
      `INSERT INTO reminders (id, user_id, invoice_id, type, subject, body, sent_at, status, created_at)
       VALUES ($1, $2, $3, 'compliance', $4, $5, NOW(), 'sent', NOW())`,
      [reminderId, doc.user_id, doc.id, subject, html]
    )
    sent++
  }

  return NextResponse.json({ sent })
}
