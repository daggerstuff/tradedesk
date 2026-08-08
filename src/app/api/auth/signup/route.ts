import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { generateId, generateToken, signJwt } from "@/lib/auth"
import { sendMagicLinkEmail } from "@/lib/resend"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { email, name, company } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    )

    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists. Sign in instead." },
        { status: 409 }
      )
    }

    // Create user
    const userId = generateId("usr")
    await queryOne(
      `INSERT INTO users (id, email, name, company_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [userId, normalizedEmail, name || null, company || null]
    )

    // Create free subscription
    await queryOne(
      `INSERT INTO subscriptions (id, user_id, plan, status, created_at, updated_at)
       VALUES ($1, $2, 'free', 'active', NOW(), NOW())`,
      [generateId("sub"), userId]
    )

    // Create auth token for magic link
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15)

    await queryOne(
      `INSERT INTO auth_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [generateId("tok"), userId, token, expiresAt]
    )

    // Send magic link email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`

    await sendMagicLinkEmail(normalizedEmail, name || "there", magicLink)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
