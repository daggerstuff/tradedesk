"use client";

import { useState, useEffect, useCallback } from "react";

interface DunningSettings {
  late_fee_enabled: boolean;
  late_fee_amount: number;
  late_fee_type: "fixed" | "percent";
  grace_period_days: number;
  auto_charge_late_fee: boolean;
  dunning_enabled: boolean;
  max_dunning_attempts: number;
}

interface CollectionsStats {
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  overdueByBucket: { bucket: string; count: number; amount: number }[];
  avgDaysOverdue: number;
}

interface OverdueInvoice {
  id: string;
  invoice_number: string;
  total: number;
  due_date: string;
  dunning_status: string;
  dunning_attempts: number;
  late_fee_charged: number;
  last_dunning_sent_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

interface DunningLog {
  id: string;
  invoice_number: string;
  customer_name: string;
  attempt: number;
  action: string;
  channel: string;
  amount_charged: number | null;
  sent_at: string;
}

const BUCKET_COLORS: Record<string, string> = {
  "3-7": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "7-14": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "14-30": "bg-red-500/20 text-red-400 border-red-500/30",
  "30+": "bg-red-700/20 text-red-300 border-red-700/30",
};

const BUCKET_LABELS: Record<string, string> = {
  "3-7": "3-7 days",
  "7-14": "7-14 days",
  "14-30": "14-30 days",
  "30+": "30+ days",
};

export default function CollectionsPage() {
  const [stats, setStats] = useState<CollectionsStats | null>(null);
  const [settings, setSettings] = useState<DunningSettings | null>(null);
  const [invoices, setInvoices] = useState<OverdueInvoice[]>([]);
  const [logs, setLogs] = useState<DunningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "settings" | "log">("overview");
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setStats(data.stats);
      setSettings(data.settings);
      setInvoices(data.overdueInvoices);
      setLogs(data.logs);
    } catch {
      setToast("Failed to load collections data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/collections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Settings saved");
    } catch {
      showToast("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendAction = async (invoiceId: string, action: string) => {
    try {
      const res = await fetch(`/api/collections/${invoiceId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Action sent");
      fetchData();
    } catch {
      showToast("Failed to send action");
    }
  };

  const handleResolve = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/collections/${invoiceId}/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Invoice marked as resolved");
      fetchData();
    } catch {
      showToast("Failed to resolve");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg shadow-xl animate-slide-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Collections</h1>
        <p className="text-slate-400 mt-1">Track overdue invoices and automate payment follow-up</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {(["overview", "invoices", "settings", "log"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <p className="text-sm text-slate-400">Total Overdue</p>
              <p className="text-2xl font-bold text-white mt-1">${stats.totalOverdue.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <p className="text-sm text-slate-400">Overdue Invoices</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.overdueCount}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <p className="text-sm text-slate-400">Avg Days Overdue</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.avgDaysOverdue.toFixed(0)}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <p className="text-sm text-slate-400">Dunning Status</p>
              <p className={`text-2xl font-bold mt-1 ${settings?.dunning_enabled ? "text-green-400" : "text-slate-500"}`}>
                {settings?.dunning_enabled ? "Active" : "Paused"}
              </p>
            </div>
          </div>

          {/* Aging Buckets */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Aging Report</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.overdueByBucket.length === 0 ? (
                <p className="text-slate-500 col-span-4 text-center py-8">No overdue invoices — nice work!</p>
              ) : (
                stats.overdueByBucket.map((bucket) => (
                  <div
                    key={bucket.bucket}
                    className={`rounded-lg border p-4 ${BUCKET_COLORS[bucket.bucket] || "bg-slate-700/50 text-slate-300 border-slate-600"}`}
                  >
                    <p className="text-sm font-medium opacity-80">{BUCKET_LABELS[bucket.bucket] || bucket.bucket}</p>
                    <p className="text-xl font-bold mt-1">${bucket.amount.toFixed(2)}</p>
                    <p className="text-xs opacity-70 mt-1">{bucket.count} invoice{bucket.count !== 1 ? "s" : ""}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          {logs.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div>
                      <p className="text-sm text-white">
                        {log.action.replace(/_/g, " ")} — {log.invoice_number}
                      </p>
                      <p className="text-xs text-slate-500">{log.customer_name} • Attempt #{log.attempt}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(log.sent_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No overdue invoices</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    <th className="px-4 py-3 text-slate-400 font-medium">Invoice</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Customer</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Amount</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Due Date</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Days Over</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Attempts</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const daysOver = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000);
                    return (
                      <tr key={inv.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="px-4 py-3 text-white font-medium">{inv.invoice_number}</td>
                        <td className="px-4 py-3 text-slate-300">{inv.customer_name}</td>
                        <td className="px-4 py-3 text-white">${inv.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-400">{new Date(inv.due_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            daysOver >= 30 ? "bg-red-500/20 text-red-400" :
                            daysOver >= 14 ? "bg-orange-500/20 text-orange-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {daysOver}d
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{inv.dunning_attempts}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendAction(inv.id, "reminder_email")}
                              className="text-xs px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded hover:bg-indigo-600/30 transition-colors"
                            >
                              Send Reminder
                            </button>
                            {daysOver >= 14 && (
                              <button
                                onClick={() => handleSendAction(inv.id, "payment_plan_offered")}
                                className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30 transition-colors"
                              >
                                Offer Plan
                              </button>
                            )}
                            <button
                              onClick={() => handleResolve(inv.id)}
                              className="text-xs px-2 py-1 bg-slate-600/20 text-slate-400 rounded hover:bg-slate-600/30 transition-colors"
                            >
                              Resolve
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && settings && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-6 max-w-2xl">
          <h3 className="text-lg font-semibold text-white">Dunning Settings</h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Enable Automated Dunning</p>
              <p className="text-sm text-slate-400">Automatically send reminders for overdue invoices</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, dunning_enabled: !settings.dunning_enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.dunning_enabled ? "bg-indigo-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.dunning_enabled ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Late Fees</p>
              <p className="text-sm text-slate-400">Charge late fees on overdue invoices</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, late_fee_enabled: !settings.late_fee_enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.late_fee_enabled ? "bg-indigo-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.late_fee_enabled ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          {settings.late_fee_enabled && (
            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-indigo-600/30">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Late Fee Amount</label>
                <input
                  type="number"
                  value={settings.late_fee_amount}
                  onChange={(e) => setSettings({ ...settings, late_fee_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Fee Type</label>
                <select
                  value={settings.late_fee_type}
                  onChange={(e) => setSettings({ ...settings, late_fee_type: e.target.value as "fixed" | "percent" })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="fixed">Fixed ($)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <button
                  onClick={() => setSettings({ ...settings, auto_charge_late_fee: !settings.auto_charge_late_fee })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.auto_charge_late_fee ? "bg-indigo-600" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.auto_charge_late_fee ? "translate-x-6" : ""
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-300">Auto-charge late fee</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-slate-400 block mb-1">Grace Period (days)</label>
            <input
              type="number"
              value={settings.grace_period_days}
              onChange={(e) => setSettings({ ...settings, grace_period_days: parseInt(e.target.value) || 0 })}
              className="w-32 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              min="0"
              max="30"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1">Max Dunning Attempts</label>
            <input
              type="number"
              value={settings.max_dunning_attempts}
              onChange={(e) => setSettings({ ...settings, max_dunning_attempts: parseInt(e.target.value) || 1 })}
              className="w-32 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              min="1"
              max="10"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}

      {/* Log Tab */}
      {activeTab === "log" && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No dunning activity yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    <th className="px-4 py-3 text-slate-400 font-medium">Date</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Invoice</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Customer</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Action</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Attempt</th>
                    <th className="px-4 py-3 text-slate-400 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(log.sent_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-white">{log.invoice_number}</td>
                      <td className="px-4 py-3 text-slate-300">{log.customer_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">#{log.attempt}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {log.amount_charged ? `$${log.amount_charged.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
