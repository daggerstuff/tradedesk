import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { queryOne } from "@/lib/db"
import SidebarNav from "./sidebar-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const user = await queryOne<{ name: string; email: string }>(
    "SELECT name, email FROM users WHERE id = $1",
    [session.userId]
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarNav userName={user?.name || "User"} userEmail={user?.email || ""} />
      <div className="flex-1 lg:ml-64">
        {children}
      </div>
    </div>
  )
}
