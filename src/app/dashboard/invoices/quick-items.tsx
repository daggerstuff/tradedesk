"use client";

import { useState, useEffect } from "react";

interface Template {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function QuickItems({ onAdd }: { onAdd: (item: LineItem) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/line-item-templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleAddTemplate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const res = await fetch("/api/line-item-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newDesc.trim(), quantity: newQty, unitPrice: newPrice }),
    });

    if (res.ok) {
      setNewDesc("");
      setNewQty(1);
      setNewPrice(0);
      setShowForm(false);
      fetchTemplates();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/line-item-templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  if (loading) return null;

  return (
    <div className="mb-4">
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {templates.map((t) => (
            <div key={t.id} className="group relative">
              <button
                type="button"
                onClick={() => onAdd({ description: t.description, quantity: t.quantity, unitPrice: t.unit_price })}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
              >
                {t.description}
                <span className="text-slate-400">${t.unit_price}</span>
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleAddTemplate} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            autoFocus
          />
          <input
            type="number"
            value={newQty}
            onChange={(e) => setNewQty(parseFloat(e.target.value) || 0)}
            placeholder="Qty"
            className="w-20 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
            placeholder="Price"
            className="w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
            Save
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-slate-500 text-sm hover:text-slate-700">
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + Save a quick item
        </button>
      )}
    </div>
  );
}
