import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { signToken } from "@/lib/auth"
import { setSessionCookie } from "@/lib/session"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=missing-token", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    }

    // Verify token
    const authToken = await queryOne<{
      id: string
      user_id: string
      expires_at: Date
    }>(
      `SELECT id, user_id, expires_at FROM auth_tokens
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    )

    if (!authToken) {
      return NextResponse.redirect(new URL("/login?error=invalid-or-expired", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    }

    // Mark token as used
    await queryOne("UPDATE auth_tokens SET used = true WHERE id = $1", [authToken.id])

    // Get user
    const user = await queryOne<{ id: string; email: string; name: string }>(
      "SELECT id, email, name FROM users WHERE id = $1",
      [authToken.user_id]
    )

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=user-not-found", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    }

    // Create session JWT
    const jwt = await signToken({
      userId: user.id,
      email: user.email,
    })

    // Set cookie and redirect to dashboard
    await setSessionCookie(jwt)
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.redirect(new URL("/login?error=server-error", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  }
}
