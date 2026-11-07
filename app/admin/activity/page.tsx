"use client";
 
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAdminActivityLogs,
  type AdminActivityLog,
} from "@/data/adminActivityStorage";
import { hasAdminPermission, type AdminRoleSession } from "@/lib/adminRbac";
 
export default function AdminActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
 
  useEffect(() => {
    try {
      const raw = localStorage.getItem("isports_user");
      const session = raw ? JSON.parse(raw) as AdminRoleSession : null;
      if (!session || !hasAdminPermission(session, "audit.view")) {
        router.replace("/admin");
        return;
      }
      setLogs(getAdminActivityLogs());
    } catch {
      router.replace("/admin");
    }
  }, [router]);
 
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesQuery = !query ||
        log.actor.toLowerCase().includes(query) ||
        log.targetName.toLowerCase().includes(query) ||
        log.targetId.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query);
      const matchesAction = action === "All" || log.action === action;
      const day = log.timestamp.slice(0, 10);
      const matchesFrom = !dateFrom || day >= dateFrom;
      const matchesTo = !dateTo || day <= dateTo;
      return matchesQuery && matchesAction && matchesFrom && matchesTo;
    });
  }, [logs, search, action, dateFrom, dateTo]);
 
  function refresh() {
    setLogs(getAdminActivityLogs());
  }
 
  function exportCsv() {
    const header = ["Timestamp", "Actor", "Action", "Target", "Target ID", "Details"];
    const rows = filtered.map((item) => [
      item.timestamp, item.actor, item.action, item.targetName, item.targetId, item.details,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "isports-admin-activity.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
 
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">Administration</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Admin Activity History</h1>
            <p className="mt-2 text-gray-400">Track in-charge account and event assignment changes.</p>
          </div>
          <Link href="/admin" className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800">Back to Dashboard</Link>
        </div>
 
        <div className="mb-6 rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-200">
          Local development audit: entries are stored in this browser's localStorage. This is useful for workflow testing, but users with browser access can alter or clear these records. Production audit logs must be written and protected on the server.
        </div>
 
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4"><p className="text-sm text-gray-400">Total activities</p><p className="mt-1 text-2xl font-bold">{logs.length}</p></div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4"><p className="text-sm text-gray-400">Filtered activities</p><p className="mt-1 text-2xl font-bold">{filtered.length}</p></div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4"><p className="text-sm text-gray-400">Account actions</p><p className="mt-1 text-2xl font-bold">{logs.filter((x) => x.action.includes("In-Charge") || x.action.includes("Account")).length}</p></div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4"><p className="text-sm text-gray-400">Assignment actions</p><p className="mt-1 text-2xl font-bold">{logs.filter((x) => x.action === "Events Assigned").length}</p></div>
        </div>
 
        <div className="mb-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actor, account or details" className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-purple-500 lg:col-span-2" />
          <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white">
            <option value="All">All actions</option>
            <option>In-Charge Created</option><option>In-Charge Deleted</option>
            <option>Events Assigned</option><option>Account Activated</option><option>Account Deactivated</option>
          </select>
          <input type="date" aria-label="From date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white" />
          <input type="date" aria-label="To date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white" />
        </div>
 
        <div className="mb-5 flex flex-wrap gap-3">
          <button onClick={refresh} type="button" className="rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800">Refresh</button>
          <button onClick={exportCsv} type="button" disabled={!filtered.length} className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500 disabled:opacity-50">Export CSV</button>
        </div>
 
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">No admin activity records match these filters. New account and assignment changes will appear here.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-800 text-gray-300"><tr>
                <th className="px-4 py-3">Date & Time</th><th className="px-4 py-3">Performed By</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Details</th>
              </tr></thead>
              <tbody>{filtered.map((log) => <tr key={log.id} className="border-t border-gray-800 align-top">
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-4">{log.actor}</td>
                <td className="px-4 py-4"><span className="rounded-full border border-purple-800 bg-purple-950/40 px-3 py-1 text-xs text-purple-300">{log.action}</span></td>
                <td className="px-4 py-4"><p className="font-semibold">{log.targetName}</p><p className="mt-1 text-xs text-gray-500">{log.targetId}</p></td>
                <td className="max-w-xl whitespace-pre-wrap px-4 py-4 text-gray-300">{log.details}</td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

 