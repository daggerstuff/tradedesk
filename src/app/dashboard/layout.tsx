import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { queryOne } from "@/lib/db"
import SidebarNav from "./sidebar-nav"
import MobileBottomNav from "./mobile-bottom-nav"
import FeedbackWidget from "@/components/FeedbackWidget"

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
    <div className="min-h-screen bg-slate-50">
      <SidebarNav userName={user?.name || "User"} userEmail={user?.email || ""} />
      {/* pt-14 for mobile top bar, lg:pt-0 removes it on desktop */}
      <div className="lg:ml-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        {children}
        <FeedbackWidget />
      </div>
      <MobileBottomNav />
    </div>
  )
}
