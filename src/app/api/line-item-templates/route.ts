import { NextRequest, NextResponse } from "next/server";
import { queryMany, queryOne } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateId } from "@/lib/auth";

// GET /api/line-item-templates - list user's templates
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await queryMany(
    "SELECT id, description, quantity, unit_price FROM line_item_templates WHERE user_id = $1 ORDER BY created_at DESC",
    [session.userId]
  );

  return NextResponse.json({ templates });
}

// POST /api/line-item-templates - create new template
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { description, quantity, unitPrice } = body;

  if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });

  const id = generateId("lit");
  const template = await queryOne(
    "INSERT INTO line_item_templates (id, user_id, description, quantity, unit_price) VALUES ($1, $2, $3, $4, $5) RETURNING id, description, quantity, unit_price",
    [id, session.userId, description, quantity || 1, unitPrice || 0]
  );

  return NextResponse.json({ template }, { status: 201 });
}
