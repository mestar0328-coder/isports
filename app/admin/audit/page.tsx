"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getScoreAudit, type ScoreAudit } from "@/data/scoreAudit";
import { getEvents } from "@/data/eventsStorage";
import { getMatches, type StoredMatch } from "@/data/matchStorage";
import { getAllScores } from "@/data/data/scoringStorage";
import { getScores as getTeamScores } from "@/data/scoreStorage";

import { detectAuditAlerts } from "@/data/auditAlertDetection";
import {
  getAuditAlerts,
  updateAuditAlert,
  type AuditAlert,
  type AuditAlertStatus,
} from "@/data/auditAlertStorage";

type SportEvent = ReturnType<typeof getEvents>[number];
type ActionFilter = "All" | ScoreAudit["action"];

function getEventName(eventId: string, events: SportEvent[]) {
  const event = events.find((item) => item.id === eventId);
  return event?.name || eventId;
}

function getMatchName(matchId: string, matches: StoredMatch[]) {
  const match = matches.find((item) => item.id === matchId);
  if (!match) return matchId;
  return `${match.teamA || "Team A"} vs ${match.teamB || "Team B"}`;
}

function parseAuditDate(timestamp: string): Date | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (!Number.isNaN(date.getTime())) return date;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function formatDateTime(timestamp: string) {
  const date = parseAuditDate(timestamp);
  return date ? date.toLocaleString() : timestamp;
}

function formatDateInput(timestamp: string) {
  const date = parseAuditDate(timestamp);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeCSV(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function formatAuditDetailValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "â€”";

  if (
    key.toLowerCase().includes("elapsedmilliseconds") &&
    typeof value === "number"
  ) {
    const totalSeconds = value / 1000;
    return `${totalSeconds.toFixed(3)} seconds (${value} ms)`;
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function getScoreDataSummary(data: unknown): Array<[string, unknown]> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return [["Recorded value", data]];
  }
  return Object.entries(data as Record<string, unknown>);
}

function getSeverityClasses(severity: AuditAlert["severity"]) {
  if (severity === "High") {
    return "border-red-800 bg-red-950/40 text-red-300";
  }
  if (severity === "Medium") {
    return "border-orange-800 bg-orange-950/40 text-orange-300";
  }
  return "border-blue-800 bg-blue-950/40 text-blue-300";
}

function getStatusClasses(status: AuditAlertStatus) {
  if (status === "Pending Review") return "bg-yellow-900/40 text-yellow-300";
  if (status === "Reviewed") return "bg-green-900/40 text-green-300";
  return "bg-slate-800 text-slate-300";
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<ScoreAudit[]>([]);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [matches, setMatches] = useState<StoredMatch[]>([]);
  const [auditAlerts, setAuditAlerts] = useState<AuditAlert[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIncharge, setSelectedIncharge] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [selectedMatch, setSelectedMatch] = useState("All");
  const [selectedAction, setSelectedAction] = useState<ActionFilter>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedAudit, setSelectedAudit] = useState<ScoreAudit | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AuditAlert | null>(null);
  const [selectedAlertStatus, setSelectedAlertStatus] =
    useState<AuditAlertStatus | "All">("All");
  const [lastUpdated, setLastUpdated] = useState("");

  // Advanced/individual-event scoring records are stored separately from team-match scores.
  const selectedScore = useMemo(() => {
    if (!selectedAudit) return null;

    const allScores = getAllScores();

    if (selectedAudit.scoreRecordId) {
      const linkedScore = allScores.find(
        (score) => score.id === selectedAudit.scoreRecordId
      );
      if (linkedScore) return linkedScore;
    }

    return (
      allScores.find(
        (score) =>
          score.matchId === selectedAudit.matchId &&
          (!selectedAudit.eventId || score.eventId === selectedAudit.eventId)
      ) ?? null
    );
  }, [selectedAudit]);

  // Legacy/team-match scores use the isports_scores store and are matched by matchId.
  const selectedTeamScore = useMemo(() => {
    if (!selectedAudit) return null;

    return (
      getTeamScores().find(
        (score) => score.matchId === selectedAudit.matchId
      ) ?? null
    );
  }, [selectedAudit]);

  function loadAuditData() {
    const loadedAudits = getScoreAudit();
    const loadedEvents = getEvents();
    const loadedMatches = getMatches();
    const detectedAlerts = detectAuditAlerts();
    const storedAlerts = getAuditAlerts();

    setAuditLogs(loadedAudits);
    setEvents(loadedEvents);
    setMatches(loadedMatches);
    setAuditAlerts(storedAlerts.length ? storedAlerts : detectedAlerts);
    setLastUpdated(new Date().toLocaleTimeString());

    // Keep an open audit modal synchronized with refreshed audit data.
    setSelectedAudit((current) => {
      if (!current) return null;
      return loadedAudits.find((audit) => audit.id === current.id) ?? current;
    });
  }

  useEffect(() => {
    loadAuditData();
    const interval = window.setInterval(loadAuditData, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const inchargeOptions = useMemo(
    () =>
      Array.from(new Set(auditLogs.map((audit) => audit.performedBy))).sort(),
    [auditLogs]
  );

  const eventOptions = useMemo(() => {
    return Array.from(
      new Set(
        auditLogs.map((audit) => {
          const match = matches.find((item) => item.id === audit.matchId);
          return audit.eventId || match?.eventId || "";
        })
      )
    )
      .filter(Boolean)
      .sort((a, b) =>
        getEventName(a, events).localeCompare(getEventName(b, events))
      );
  }, [auditLogs, matches, events]);

  const matchOptions = useMemo(
    () =>
      Array.from(new Set(auditLogs.map((audit) => audit.matchId))).sort(
        (a, b) =>
          getMatchName(a, matches).localeCompare(getMatchName(b, matches))
      ),
    [auditLogs, matches]
  );

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((audit) => {
      const match = matches.find((item) => item.id === audit.matchId);
      const eventId = audit.eventId || match?.eventId || "";
      const eventName = eventId ? getEventName(eventId, events) : "";
      const matchName = getMatchName(audit.matchId, matches);
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        audit.matchId.toLowerCase().includes(searchText) ||
        matchName.toLowerCase().includes(searchText) ||
        audit.performedBy.toLowerCase().includes(searchText) ||
        audit.action.toLowerCase().includes(searchText) ||
        eventName.toLowerCase().includes(searchText) ||
        (audit.athleteId || "").toLowerCase().includes(searchText);

      const matchesIncharge =
        selectedIncharge === "All" || audit.performedBy === selectedIncharge;
      const matchesEvent = selectedEvent === "All" || eventId === selectedEvent;
      const matchesMatch =
        selectedMatch === "All" || audit.matchId === selectedMatch;
      const matchesAction =
        selectedAction === "All" || audit.action === selectedAction;

      let matchesDate = true;
      const auditDate = parseAuditDate(audit.timestamp);

      if (auditDate) {
        const auditDateOnly = formatDateInput(audit.timestamp);
        if (dateFrom && auditDateOnly < dateFrom) matchesDate = false;
        if (dateTo && auditDateOnly > dateTo) matchesDate = false;
      }

      return (
        matchesSearch &&
        matchesIncharge &&
        matchesEvent &&
        matchesMatch &&
        matchesAction &&
        matchesDate
      );
    });
  }, [
    auditLogs,
    matches,
    events,
    search,
    selectedIncharge,
    selectedEvent,
    selectedMatch,
    selectedAction,
    dateFrom,
    dateTo,
  ]);

  const summary = useMemo(
    () => ({
      total: filteredLogs.length,
      saved: filteredLogs.filter((a) => a.action === "Score Saved").length,
      submitted: filteredLogs.filter((a) => a.action === "Score Submitted").length,
      corrected: filteredLogs.filter((a) => a.action === "Score Corrected").length,
      locked: filteredLogs.filter((a) => a.action === "Score Locked").length,
    }),
    [filteredLogs]
  );

  const inchargeActivity = useMemo(() => {
    const map = new Map<
      string,
      { total: number; submitted: number; corrected: number; locked: number }
    >();

    filteredLogs.forEach((audit) => {
      const current = map.get(audit.performedBy) || {
        total: 0,
        submitted: 0,
        corrected: 0,
        locked: 0,
      };
      current.total += 1;
      if (audit.action === "Score Submitted") current.submitted += 1;
      if (audit.action === "Score Corrected") current.corrected += 1;
      if (audit.action === "Score Locked") current.locked += 1;
      map.set(audit.performedBy, current);
    });

    return Array.from(map.entries())
      .map(([performedBy, stats]) => ({ performedBy, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLogs]);

  const eventActivity = useMemo(() => {
    const map = new Map<
      string,
      { total: number; submitted: number; corrected: number }
    >();

    filteredLogs.forEach((audit) => {
      const match = matches.find((item) => item.id === audit.matchId);
      const eventId = audit.eventId || match?.eventId || "Unknown";
      const current = map.get(eventId) || {
        total: 0,
        submitted: 0,
        corrected: 0,
      };
      current.total += 1;
      if (audit.action === "Score Submitted") current.submitted += 1;
      if (audit.action === "Score Corrected") current.corrected += 1;
      map.set(eventId, current);
    });

    return Array.from(map.entries())
      .map(([eventId, stats]) => ({
        eventId,
        eventName:
          eventId === "Unknown" ? "Unknown" : getEventName(eventId, events),
        ...stats,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLogs, matches, events]);

  const matchActivity = useMemo(() => {
    const map = new Map<
      string,
      { total: number; submitted: number; corrected: number; locked: number }
    >();

    filteredLogs.forEach((audit) => {
      const current = map.get(audit.matchId) || {
        total: 0,
        submitted: 0,
        corrected: 0,
        locked: 0,
      };
      current.total += 1;
      if (audit.action === "Score Submitted") current.submitted += 1;
      if (audit.action === "Score Corrected") current.corrected += 1;
      if (audit.action === "Score Locked") current.locked += 1;
      map.set(audit.matchId, current);
    });

    return Array.from(map.entries())
      .map(([matchId, stats]) => ({
        matchId,
        matchName: getMatchName(matchId, matches),
        ...stats,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLogs, matches]);

  // Apply the page-level filters to alert records as well as score-audit records.
  // Alert records do not contain a separate action field; all current alert types
  // are generated from score-correction activity, so "Score Corrected" is the
  // only action filter that corresponds to an alert.
  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return auditAlerts.filter((alert) => {
      const match = matches.find((item) => item.id === alert.matchId);
      const eventId = alert.eventId || match?.eventId || "";
      const eventName = eventId ? getEventName(eventId, events) : "";
      const matchName = getMatchName(alert.matchId, matches);

      const matchesIncharge =
        selectedIncharge === "All" || alert.performedBy === selectedIncharge;
      const matchesEvent =
        selectedEvent === "All" || eventId === selectedEvent;
      const matchesMatch =
        selectedMatch === "All" || alert.matchId === selectedMatch;
      const matchesStatus =
        selectedAlertStatus === "All" || alert.status === selectedAlertStatus;

      // Current alert rules are all based on score corrections.
      const matchesAction =
        selectedAction === "All" || selectedAction === "Score Corrected";

      const detectedDate = parseAuditDate(alert.detectedAt);
      const alertDate = detectedDate ? formatDateInput(alert.detectedAt) : "";
      const matchesDate =
        (!dateFrom || !alertDate || alertDate >= dateFrom) &&
        (!dateTo || !alertDate || alertDate <= dateTo);

      const searchableText = [
        alert.id,
        alert.type,
        alert.severity,
        alert.status,
        alert.performedBy,
        alert.reason,
        alert.matchId,
        matchName,
        eventId,
        eventName,
      ].join(" ").toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);

      return (
        matchesIncharge &&
        matchesEvent &&
        matchesMatch &&
        matchesStatus &&
        matchesAction &&
        matchesDate &&
        matchesSearch
      );
    });
  }, [
    auditAlerts,
    matches,
    events,
    search,
    selectedIncharge,
    selectedEvent,
    selectedMatch,
    selectedAction,
    selectedAlertStatus,
    dateFrom,
    dateTo,
  ]);

  // Alert Overview cards and type breakdown use the same filtered alert set.
  const totalAlerts = filteredAlerts.length;
  const pendingAlerts = filteredAlerts.filter(
    (alert) => alert.status === "Pending Review"
  ).length;
  const reviewedAlerts = filteredAlerts.filter(
    (alert) => alert.status === "Reviewed"
  ).length;
  const dismissedAlerts = filteredAlerts.filter(
    (alert) => alert.status === "Dismissed"
  ).length;
  const highAlerts = filteredAlerts.filter(
    (alert) => alert.severity === "High"
  ).length;
  const mediumAlerts = filteredAlerts.filter(
    (alert) => alert.severity === "Medium"
  ).length;
  const lowAlerts = filteredAlerts.filter(
    (alert) => alert.severity === "Low"
  ).length;

  const repeatedCorrectionAlerts = filteredAlerts.filter(
    (alert) => alert.type === "Repeated Corrections"
  ).length;
  const rapidCorrectionAlerts = filteredAlerts.filter(
    (alert) => alert.type === "Rapid Corrections"
  ).length;
  const highActivityAlerts = filteredAlerts.filter(
    (alert) => alert.type === "High Correction Activity"
  ).length;

  const mostCommonAlertType = useMemo(() => {
    const types = [
      { name: "Repeated Corrections", count: repeatedCorrectionAlerts },
      { name: "Rapid Corrections", count: rapidCorrectionAlerts },
      { name: "High Correction Activity", count: highActivityAlerts },
    ];
    return types.sort((a, b) => b.count - a.count)[0];
  }, [
    repeatedCorrectionAlerts,
    rapidCorrectionAlerts,
    highActivityAlerts,
  ]);

  const activeFilterCount = [
    selectedIncharge !== "All",
    selectedEvent !== "All",
    selectedMatch !== "All",
    selectedAction !== "All",
    Boolean(search),
    Boolean(dateFrom),
    Boolean(dateTo),
  ].filter(Boolean).length;

  const invalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  function clearFilters() {
    setSearch("");
    setSelectedIncharge("All");
    setSelectedEvent("All");
    setSelectedMatch("All");
    setSelectedAction("All");
    setDateFrom("");
    setDateTo("");
  }

  function setToday() {
    const value = formatDateInput(new Date().toISOString());
    setDateFrom(value);
    setDateTo(value);
  }

  function setDateRange(days: number) {
    const today = new Date();
    const previous = new Date();
    previous.setDate(today.getDate() - (days - 1));
    setDateFrom(formatDateInput(previous.toISOString()));
    setDateTo(formatDateInput(today.toISOString()));
  }

  function setThisMonth() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateFrom(formatDateInput(firstDay.toISOString()));
    setDateTo(formatDateInput(today.toISOString()));
  }

  function exportCSV() {
    const rows = [
      [
        "ID",
        "Match",
        "Event",
        "Action",
        "Performed By",
        "Timestamp",
        "Athlete ID",
        "Status",
        "Scoring Engine",
        "Score Data",
        "Previous Value",
        "New Value",
        "Reason",
      ],
      ...filteredLogs.map((audit) => {
        const match = matches.find((item) => item.id === audit.matchId);
        const eventId = audit.eventId || match?.eventId || "";
        return [
          audit.id,
          getMatchName(audit.matchId, matches),
          eventId ? getEventName(eventId, events) : "",
          audit.action,
          audit.performedBy,
          formatDateTime(audit.timestamp),
          audit.athleteId || "",
          audit.status || "",
          audit.scoringEngine || "",
          JSON.stringify(audit.scoreData ?? ""),
          JSON.stringify(audit.previousValue ?? ""),
          JSON.stringify(audit.newValue ?? ""),
          audit.reason || "",
        ];
      }),
    ];

    const csv = rows
      .map((row) => row.map((value) => escapeCSV(value)).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `score-audit-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `score-audit-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleAlertStatusUpdate(
    alert: AuditAlert,
    status: AuditAlertStatus
  ) {
    const updated = updateAuditAlert(alert.id, {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: "Admin",
    });
    setAuditAlerts(updated);
    const updatedAlert = updated.find((item) => item.id === alert.id);
    if (updatedAlert) setSelectedAlert(updatedAlert);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Score Audit Log</h1>
            <p className="mt-1 text-sm text-slate-400">
              Monitor score activity, corrections, locking and audit alerts.
            </p>
            {lastUpdated && (
              <p className="mt-1 text-xs text-slate-500">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 font-semibold hover:bg-slate-800"
            >
              â† Back to Admin
            </Link>
            <button
              onClick={loadAuditData}
              className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500"
            >
              Refresh
            </button>
          </div>
        </div>

        <section className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={exportCSV}
            className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-500"
          >
            Export CSV
          </button>
          <button
            onClick={exportJSON}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
          >
            Export JSON
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 font-semibold hover:bg-slate-800"
          >
            Admin Dashboard
          </Link>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            ["Total Actions", summary.total],
            ["Saved", summary.saved],
            ["Submitted", summary.submitted],
            ["Corrected", summary.corrected],
            ["Locked", summary.locked],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Filters</h2>
              <p className="text-sm text-slate-400">
                {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm text-slate-400">
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search audit..."
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-purple-500"
              />
            </label>

            <label className="block text-sm text-slate-400">
              In-Charge
              <select
                value={selectedIncharge}
                onChange={(event) => setSelectedIncharge(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="All">All In-Charges</option>
                {inchargeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-400">
              Event
              <select
                value={selectedEvent}
                onChange={(event) => setSelectedEvent(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="All">All Events</option>
                {eventOptions.map((eventId) => (
                  <option key={eventId} value={eventId}>
                    {getEventName(eventId, events)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-400">
              Match
              <select
                value={selectedMatch}
                onChange={(event) => setSelectedMatch(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="All">All Matches</option>
                {matchOptions.map((matchId) => (
                  <option key={matchId} value={matchId}>
                    {getMatchName(matchId, matches)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-400">
              Action
              <select
                value={selectedAction}
                onChange={(event) =>
                  setSelectedAction(event.target.value as ActionFilter)
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="All">All Actions</option>
                <option value="Score Saved">Score Saved</option>
                <option value="Score Submitted">Score Submitted</option>
                <option value="Score Corrected">Score Corrected</option>
                <option value="Score Locked">Score Locked</option>
              </select>
            </label>

            <label className="block text-sm text-slate-400">
              Date From
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>

            <label className="block text-sm text-slate-400">
              Date To
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
          </div>

          {invalidDateRange && (
            <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
              Date From cannot be later than Date To.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={setToday}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Today
            </button>
            <button
              onClick={() => setDateRange(7)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange(30)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Last 30 Days
            </button>
            <button
              onClick={setThisMonth}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              This Month
            </button>
          </div>
        </section>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-bold">In-Charge Activity</h2>
            <div className="space-y-3">
              {inchargeActivity.length === 0 ? (
                <p className="text-sm text-slate-500">No activity found.</p>
              ) : (
                inchargeActivity.map((item) => (
                  <div
                    key={item.performedBy}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">{item.performedBy}</span>
                      <span className="text-sm text-slate-400">
                        {item.total} actions
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Submitted: {item.submitted} Â· Corrected: {item.corrected} Â·
                      Locked: {item.locked}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Event Activity</h2>
            <div className="space-y-3">
              {eventActivity.length === 0 ? (
                <p className="text-sm text-slate-500">No activity found.</p>
              ) : (
                eventActivity.map((item) => (
                  <div
                    key={item.eventId}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">{item.eventName}</span>
                      <span className="text-sm text-slate-400">{item.total}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Submitted: {item.submitted} Â· Corrected: {item.corrected}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Match Activity</h2>
            <div className="space-y-3">
              {matchActivity.length === 0 ? (
                <p className="text-sm text-slate-500">No activity found.</p>
              ) : (
                matchActivity.map((item) => (
                  <div
                    key={item.matchId}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">{item.matchName}</span>
                      <span className="text-sm text-slate-400">{item.total}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Submitted: {item.submitted} Â· Corrected: {item.corrected} Â·
                      Locked: {item.locked}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Alert Overview</h2>
            <p className="mt-1 text-sm text-slate-400">
Alert counts and severity distribution based on the filters above and the alert-status selector below.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
            {[
              ["Total Alerts", totalAlerts, "border-slate-700", "text-white"],
              ["High", highAlerts, "border-red-800", "text-red-400"],
              ["Medium", mediumAlerts, "border-orange-800", "text-orange-400"],
              ["Low", lowAlerts, "border-blue-800", "text-blue-400"],
              ["Pending Review", pendingAlerts, "border-yellow-800", "text-yellow-400"],
              ["Reviewed", reviewedAlerts, "border-green-800", "text-green-400"],
              ["Dismissed", dismissedAlerts, "border-slate-700", "text-slate-300"],
            ].map(([label, value, border, color]) => (
              <div
                key={label}
                className={`rounded-xl border ${border} bg-slate-900 p-4`}
              >
                <p className="text-sm text-slate-400">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Alert Type Breakdown</h2>
              <p className="mt-1 text-sm text-slate-400">
                Identify which unusual activity pattern is being detected most often.
              </p>
            </div>
            {totalAlerts > 0 && (
              <div className="rounded-lg border border-purple-800 bg-purple-950/40 px-4 py-2 text-sm">
                Most common:{" "}
                <span className="font-semibold text-purple-300">
                  {mostCommonAlertType.name}
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-red-800 bg-red-950/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-red-300">Repeated Corrections</h3>
                <span className="rounded-full bg-red-900/50 px-3 py-1 text-sm font-bold text-red-300">
                  {repeatedCorrectionAlerts}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Three or more score corrections detected for the same match.
              </p>
            </div>
            <div className="rounded-xl border border-orange-800 bg-orange-950/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-orange-300">Rapid Corrections</h3>
                <span className="rounded-full bg-orange-900/50 px-3 py-1 text-sm font-bold text-orange-300">
                  {rapidCorrectionAlerts}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Multiple score corrections detected within a 10-minute period.
              </p>
            </div>
            <div className="rounded-xl border border-purple-800 bg-purple-950/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-purple-300">High Correction Activity</h3>
                <span className="rounded-full bg-purple-900/50 px-3 py-1 text-sm font-bold text-purple-300">
                  {highActivityAlerts}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                An In-Charge has performed a high number of score corrections.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Audit Alerts</h2>
              <p className="mt-1 text-sm text-slate-400">
Automatically detected unusual score activity. This list follows the shared audit filters above.
              </p>
            </div>
            <select
              value={selectedAlertStatus}
              onChange={(event) =>
                setSelectedAlertStatus(
                  event.target.value as AuditAlertStatus | "All"
                )
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="All">All Alerts</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center">
              <p className="text-slate-400">No alerts found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const match = matches.find((item) => item.id === alert.matchId);
                const eventId = match?.eventId;
                return (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-semibold ${getSeverityClasses(alert.severity)}`}
                          >
                            {alert.severity}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusClasses(alert.status)}`}
                          >
                            {alert.status}
                          </span>
                          <span className="text-sm font-semibold">{alert.type}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-300">{alert.reason}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>Match: {getMatchName(alert.matchId, matches)}</span>
                          <span>
                            Event: {eventId ? getEventName(eventId, events) : "Unknown"}
                          </span>
                          <span>In-Charge: {alert.performedBy}</span>
                          <span>Detected: {formatDateTime(alert.detectedAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="shrink-0 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500"
                      >
                        View Alert
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Score Audit Records</h2>
              <p className="text-sm text-slate-400">
                Showing {filteredLogs.length} of {auditLogs.length} records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportCSV}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500"
              >
                Export CSV
              </button>
              <button
                onClick={exportJSON}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
              >
                Export JSON
              </button>
              <Link
                href="/admin"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
              >
                â† Admin
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">In-Charge</th>
                  <th className="px-3 py-3">Event</th>
                  <th className="px-3 py-3">Match</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-slate-500"
                    >
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((audit) => {
                    const match = matches.find(
                      (item) => item.id === audit.matchId
                    );
                    const eventId = audit.eventId || match?.eventId;
                    return (
                      <tr
                        key={audit.id}
                        className="border-b border-slate-900 hover:bg-slate-950"
                      >
                        <td className="px-3 py-3 text-xs text-slate-400">
                          {formatDateTime(audit.timestamp)}
                        </td>
                        <td className="px-3 py-3">{audit.performedBy}</td>
                        <td className="px-3 py-3">
                          {eventId ? getEventName(eventId, events) : "Unknown"}
                        </td>
                        <td className="px-3 py-3">
                          {getMatchName(audit.matchId, matches)}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">
                            {audit.action}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => setSelectedAudit(audit)}
                            className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-6 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Audit Details</h2>
              <button
                onClick={() => setSelectedAudit(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Close audit details"
              >
                âœ•
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-slate-500">Audit ID</span>
                <p className="break-all font-medium">{selectedAudit.id}</p>
              </div>
              <div>
                <span className="text-slate-500">Action</span>
                <p className="font-medium">{selectedAudit.action}</p>
              </div>
              <div>
                <span className="text-slate-500">In-Charge</span>
                <p className="font-medium">{selectedAudit.performedBy}</p>
              </div>
              <div>
                <span className="text-slate-500">Event</span>
                <p className="font-medium">
                  {selectedAudit.eventId
                    ? getEventName(selectedAudit.eventId, events)
                    : (() => {
                        const match = matches.find(
                          (item) => item.id === selectedAudit.matchId
                        );
                        return match?.eventId
                          ? getEventName(match.eventId, events)
                          : "Unknown";
                      })()}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Match</span>
                <p className="font-medium">
                  {getMatchName(selectedAudit.matchId, matches)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Athlete ID</span>
                <p className="font-medium">
                  {selectedAudit.athleteId || "Not recorded"}
                </p>
              </div>
             <div>
                <span className="text-slate-500">Status at Audit Time</span>
                <p className="font-medium">
                  {selectedAudit.status || "Not recorded"}
                </p>
              </div>

              <div>
                <span className="text-slate-500">Current Score Status</span>
                <p className="font-medium">
                  {selectedTeamScore?.status ||
                    selectedScore?.status ||
                    "Not available"}
                </p>
              </div>

              <div>
                <span className="text-slate-500">Scoring Engine</span>
                <p className="font-medium">
                  {selectedAudit.scoringEngine ||
                    selectedScore?.scoringEngine ||
                    "Not recorded"}
                </p>
              </div>

              <div>
                <span className="text-slate-500">Score Record Reference</span>
                <p className="break-all font-medium">
                  {selectedAudit.scoreRecordId ||
                    selectedScore?.id ||
                    selectedTeamScore?.matchId ||
                    "Not linked"}
                </p>

                {selectedTeamScore &&
                  !selectedAudit.scoreRecordId &&
                  !selectedScore && (
                    <p className="mt-1 text-xs text-slate-500">
                      Team-match score reference (match ID); not an advanced
                      score-record ID.
                    </p>
                  )}
              </div>

              <div>
                <span className="text-slate-500">
                  Audit Snapshot / Score Details
                </span>

                {(() => {
                  const hasAuditSnapshot =
                    selectedAudit.scoreData !== undefined;

                  const data = hasAuditSnapshot
                    ? selectedAudit.scoreData
                    : selectedScore?.data ?? selectedTeamScore ?? undefined;

                  if (data === undefined) {
                    return (
                      <p className="mt-1 text-slate-400">
                        Detailed score snapshot is unavailable for this audit
                        record.
                      </p>
                    );
                  }

                  const entries = getScoreDataSummary(data);

                  return (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-slate-400">
                        {hasAuditSnapshot
                          ? "Historical snapshot captured when this audit action occurred."
                          : "Legacy fallback: current score data. This is not a historical snapshot."}
                      </p>

                      <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
                        {entries.map(([key, value]) => (
                          <div
                            key={key}
                            className="grid gap-1 sm:grid-cols-[minmax(120px,0.7fr)_minmax(0,1.3fr)]"
                          >
                            <span className="break-words text-slate-400">
                              {key}
                            </span>

                            <pre className="whitespace-pre-wrap break-words font-sans text-slate-100">
                              {formatAuditDetailValue(key, value)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {(selectedAudit.previousValue !== undefined ||
                selectedAudit.newValue !== undefined) && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <h3 className="mb-3 font-semibold">Change Details</h3>
                  {selectedAudit.previousValue !== undefined && (
                    <div className="mb-3">
                      <span className="text-slate-500">Previous Value</span>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-slate-200">
                        {formatAuditDetailValue(
                          "previousValue",
                          selectedAudit.previousValue
                        )}
                      </pre>
                    </div>
                  )}
                  {selectedAudit.newValue !== undefined && (
                    <div>
                      <span className="text-slate-500">New Value</span>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-slate-200">
                        {formatAuditDetailValue(
                          "newValue",
                          selectedAudit.newValue
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {selectedAudit.reason && (
                <div>
                  <span className="text-slate-500">Correction / Save Reason</span>
                  <p className="whitespace-pre-wrap font-medium">
                    {selectedAudit.reason}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-500">Timestamp</span>
                <p className="font-medium">
                  {formatDateTime(selectedAudit.timestamp)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedAudit(null)}
              className="mt-6 w-full rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Audit Alert</h2>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                âœ•
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClasses(selectedAlert.severity)}`}
              >
                {selectedAlert.severity}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedAlert.status)}`}
              >
                {selectedAlert.status}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-slate-500">Alert Type</span>
                <p className="font-medium">{selectedAlert.type}</p>
              </div>
              <div>
                <span className="text-slate-500">Reason</span>
                <p className="font-medium text-slate-200">
                  {selectedAlert.reason}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Match</span>
                <p className="font-medium">
                  {getMatchName(selectedAlert.matchId, matches)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Event</span>
                <p className="font-medium">
                  {(() => {
                    const match = matches.find(
                      (item) => item.id === selectedAlert.matchId
                    );
                    return match?.eventId
                      ? getEventName(match.eventId, events)
                      : "Unknown";
                  })()}
                </p>
              </div>
              <div>
                <span className="text-slate-500">In-Charge</span>
                <p className="font-medium">{selectedAlert.performedBy}</p>
              </div>
              <div>
                <span className="text-slate-500">Detected At</span>
                <p className="font-medium">
                  {formatDateTime(selectedAlert.detectedAt)}
                </p>
              </div>
              {selectedAlert.reviewedAt && (
                <div>
                  <span className="text-slate-500">Reviewed At</span>
                  <p className="font-medium">
                    {formatDateTime(selectedAlert.reviewedAt)}
                  </p>
                </div>
              )}
              {selectedAlert.reviewedBy && (
                <div>
                  <span className="text-slate-500">Reviewed By</span>
                  <p className="font-medium">{selectedAlert.reviewedBy}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {selectedAlert.status !== "Reviewed" && (
                <button
                  onClick={() =>
                    handleAlertStatusUpdate(selectedAlert, "Reviewed")
                  }
                  className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-500"
                >
                  Mark Reviewed
                </button>
              )}
              {selectedAlert.status !== "Dismissed" && (
                <button
                  onClick={() =>
                    handleAlertStatusUpdate(selectedAlert, "Dismissed")
                  }
                  className="rounded-lg bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600"
                >
                  Dismiss
                </button>
              )}
              <button
                onClick={() => setSelectedAlert(null)}
                className="ml-auto rounded-lg border border-slate-700 px-4 py-2 font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
