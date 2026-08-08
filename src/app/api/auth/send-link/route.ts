import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { generateId, generateToken } from "@/lib/auth"
import { sendMagicLinkEmail } from "@/lib/resend"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const user = await queryOne<{
      id: string
      email: string
      name: string
    }>("SELECT id, email, name FROM users WHERE email = $1", [normalizedEmail])

    if (!user) {
      return NextResponse.json(
        { error: "No account found with that email. Sign up first." },
        { status: 404 }
      )
    }

    // Create auth token
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15) // 15 minutes

    await queryOne(
      `INSERT INTO auth_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [generateId("tok"), user.id, token, expiresAt]
    )

    // Send magic link email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`

    await sendMagicLinkEmail(user.email, user.name, magicLink)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send link error:", error)
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 })
  }
}
