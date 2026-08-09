import { NextRequest, NextResponse } from "next/server";
import { query, queryMany, queryOne } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateId } from "@/lib/auth";

const DEFAULT_CATEGORIES = [
  { name: "Materials", color: "#3b82f6" },
  { name: "Fuel", color: "#ef4444" },
  { name: "Tools & Equipment", color: "#f59e0b" },
  { name: "Subcontractor", color: "#8b5cf6" },
  { name: "Permits & Licenses", color: "#10b981" },
  { name: "Insurance", color: "#06b6d4" },
  { name: "Office & Admin", color: "#64748b" },
  { name: "Meals", color: "#ec4899" },
  { name: "Travel", color: "#14b8a6" },
  { name: "Marketing", color: "#f97316" },
];

// GET /api/expense-categories - list user's categories
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let categories = await queryMany<{ id: string; name: string; color: string }>(
    "SELECT id, name, color FROM expense_categories WHERE user_id = $1 ORDER BY name",
    [session.userId]
  );

  // Seed defaults if none exist
  if (categories.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      const id = generateId("cat");
      await query(
        "INSERT INTO expense_categories (id, user_id, name, color) VALUES ($1, $2, $3, $4)",
        [id, session.userId, cat.name, cat.color]
      );
    }
    categories = await queryMany(
      "SELECT id, name, color FROM expense_categories WHERE user_id = $1 ORDER BY name",
      [session.userId]
    );
  }

  return NextResponse.json({ categories });
}

// POST /api/expense-categories - create new category
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, color } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const id = generateId("cat");
  const category = await queryOne(
    "INSERT INTO expense_categories (id, user_id, name, color) VALUES ($1, $2, $3, $4) RETURNING id, name, color",
    [id, session.userId, name, color || "#64748b"]
  );

  return NextResponse.json({ category }, { status: 201 });
}
