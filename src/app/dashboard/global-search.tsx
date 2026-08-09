"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  status?: string;
  total?: string;
  email?: string;
  href: string;
}

const TYPE_ICONS: Record<string, string> = {
  invoice: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  customer: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  quote: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
  job: "M11 3.055A5.001 5.001 0 005.055 9c0 2.761 2.239 5 5 5M11 3.055A5.001 5.001 0 0116.945 9c0 2.761-2.239 5-5 5M11 3.055V3a2 2 0 012-2h2a2 2 0 012 2v2.5",
};

const TYPE_COLORS: Record<string, string> = {
  invoice: "bg-blue-100 text-blue-600",
  customer: "bg-green-100 text-green-600",
  quote: "bg-purple-100 text-purple-600",
  job: "bg-orange-100 text-orange-600",
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Close on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      router.push(results[selectedIndex].href);
      setOpen(false);
    }
  }, [results, selectedIndex, router]);

  return (
    <>
      {/* Search trigger button in sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">⌘K</kbd>
      </button>

      {/* Search modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search invoices, customers, quotes, jobs..."
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              />
              {loading && (
                <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              )}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 && query.trim().length >= 2 && !loading && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No results found
                </div>
              )}
              {results.length === 0 && query.trim().length < 2 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Type at least 2 characters to search
                </div>
              )}
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    router.push(result.href);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex ? "bg-slate-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[result.type] || "bg-slate-100 text-slate-500"}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TYPE_ICONS[result.type] || TYPE_ICONS.invoice} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{result.type}{result.status ? ` · ${result.status}` : ""}</p>
                  </div>
                  {result.total && (
                    <span className="text-sm font-medium text-slate-700">${result.total}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1 rounded">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1 rounded">↵</kbd> open</span>
              <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1 rounded">esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
