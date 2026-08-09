import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await query(
    "DELETE FROM line_item_templates WHERE id = $1 AND user_id = $2",
    [id, session.userId]
  );

  return NextResponse.json({ success: true });
}
