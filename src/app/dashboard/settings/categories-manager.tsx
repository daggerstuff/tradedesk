"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

const COLORS = [
  "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#10b981",
  "#06b6d4", "#64748b", "#ec4899", "#14b8a6", "#f97316",
];

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#64748b");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/expense-categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleAdd = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const res = await fetch("/api/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });

    if (res.ok) {
      setNewName("");
      setNewColor("#64748b");
      fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    await fetch(`/api/expense-categories/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  if (loading) return <div className="text-sm text-slate-500">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Category list */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 group"
          >
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
            <span className="text-sm text-slate-700">{cat.name}</span>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex items-center gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewColor(color)}
              className={`h-6 w-6 rounded-full transition-transform ${
                newColor === color ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={!newName.trim()}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}
