"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getAuditAlerts,
  updateAuditAlert,
  type AuditAlert,
  type AuditAlertSeverity,
  type AuditAlertStatus,
  type AuditAlertType,
} from "@/data/auditAlertStorage";

import { detectAuditAlerts } from "@/data/auditAlertDetection";

import {
  getMatches,
  type StoredMatch,
} from "@/data/matchStorage";

import { getEvents } from "@/data/eventsStorage";

/* =========================================================
   HELPERS
========================================================= */

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getSeverityClasses(
  severity: AuditAlertSeverity
) {
  switch (severity) {
    case "High":
      return "border-red-500/30 bg-red-500/20 text-red-300";

    case "Medium":
      return "border-amber-500/30 bg-amber-500/20 text-amber-300";

    case "Low":
      return "border-blue-500/30 bg-blue-500/20 text-blue-300";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function getStatusClasses(
  status: AuditAlertStatus
) {
  switch (status) {
    case "Pending Review":
      return "border-yellow-500/30 bg-yellow-500/20 text-yellow-300";

    case "Reviewed":
      return "border-green-500/30 bg-green-500/20 text-green-300";

    case "Dismissed":
      return "border-slate-700 bg-slate-800 text-slate-300";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function escapeCSV(value: unknown) {
  const text = String(value ?? "");

  return `"${text.replaceAll('"', '""')}"`;
}

function getMatchLabel(
  match: StoredMatch | undefined
) {
  if (!match) {
    return "Match not found";
  }

  return `${match.teamA} vs ${match.teamB}`;
}

function getEventName(
  event: unknown
) {
  if (!event) {
    return "Event not found";
  }

  const record = event as {
    name?: string;
    eventName?: string;
    title?: string;
  };

  return (
    record.name ||
    record.eventName ||
    record.title ||
    "Unnamed Event"
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AuditAlertsPage() {
  const [alerts, setAlerts] = useState<AuditAlert[]>([]);
  const [matches, setMatches] = useState<StoredMatch[]>([]);
  const [events, setEvents] = useState<
    ReturnType<typeof getEvents>
  >([]);

  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] =
    useState<"All" | AuditAlertSeverity>("All");

  const [statusFilter, setStatusFilter] =
    useState<"All" | AuditAlertStatus>("All");

  const [typeFilter, setTypeFilter] =
    useState<"All" | AuditAlertType>("All");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "severity"
  >("newest");

  const [selectedAlert, setSelectedAlert] =
    useState<AuditAlert | null>(null);

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [lastUpdated, setLastUpdated] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  function loadAlerts() {
    setIsLoading(true);

    try {
      const loadedMatches = getMatches();
      const loadedEvents = getEvents();

      setMatches(loadedMatches);
      setEvents(loadedEvents);

      detectAuditAlerts();

      const storedAlerts = getAuditAlerts();

      setAlerts(storedAlerts);

      setLastUpdated(
        new Date().toLocaleTimeString()
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();

    const interval = window.setInterval(
      loadAlerts,
      30000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* =========================================================
     LOOKUP MAPS
  ========================================================= */

  const matchMap = useMemo(() => {
    return new Map(
      matches.map((match) => [
        match.id,
        match,
      ])
    );
  }, [matches]);

  const eventMap = useMemo(() => {
    return new Map(
      events.map((event) => [
        event.id,
        event,
      ])
    );
  }, [events]);

  function findMatch(matchId: string) {
    return matchMap.get(matchId);
  }

  function findEventForAlert(
    alert: AuditAlert
  ) {
    const match = findMatch(
      alert.matchId
    );

    const eventId =
      alert.eventId ||
      match?.eventId;

    if (!eventId) {
      return undefined;
    }

    return eventMap.get(eventId);
  }

  function getEventId(
    alert: AuditAlert
  ) {
    const match = findMatch(
      alert.matchId
    );

    return (
      alert.eventId ||
      match?.eventId ||
      ""
    );
  }

  /* =========================================================
     FILTERED ALERTS
  ========================================================= */

  const filteredAlerts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    const fromTime = dateFrom
      ? new Date(
          `${dateFrom}T00:00:00`
        ).getTime()
      : null;

    const toTime = dateTo
      ? new Date(
          `${dateTo}T23:59:59`
        ).getTime()
      : null;

    const result = alerts.filter(
      (alert) => {
        if (
          severityFilter !== "All" &&
          alert.severity !== severityFilter
        ) {
          return false;
        }

        if (
          statusFilter !== "All" &&
          alert.status !== statusFilter
        ) {
          return false;
        }

        if (
          typeFilter !== "All" &&
          alert.type !== typeFilter
        ) {
          return false;
        }

        const detectedTime =
          new Date(
            alert.detectedAt
          ).getTime();

        if (
          fromTime !== null &&
          detectedTime < fromTime
        ) {
          return false;
        }

        if (
          toTime !== null &&
          detectedTime > toTime
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const match = findMatch(
          alert.matchId
        );

        const event =
          findEventForAlert(alert);

        const searchableText = [
          alert.id,
          alert.type,
          alert.severity,
          alert.status,
          alert.performedBy,
          alert.reason,
          alert.matchId,
          getEventId(alert),
          match?.teamA || "",
          match?.teamB || "",
          getEventName(event),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          query
        );
      }
    );

    result.sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.detectedAt).getTime() -
          new Date(b.detectedAt).getTime()
        );
      }

      if (sortBy === "severity") {
        const priority: Record<
          AuditAlertSeverity,
          number
        > = {
          High: 3,
          Medium: 2,
          Low: 1,
        };

        return (
          priority[b.severity] -
          priority[a.severity]
        );
      }

      return (
        new Date(b.detectedAt).getTime() -
        new Date(a.detectedAt).getTime()
      );
    });

    return result;
  }, [
    alerts,
    matches,
    events,
    search,
    severityFilter,
    statusFilter,
    typeFilter,
    dateFrom,
    dateTo,
    sortBy,
  ]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const totalAlerts = alerts.length;

  const pendingAlerts = alerts.filter(
    (alert) =>
      alert.status === "Pending Review"
  ).length;

  const reviewedAlerts = alerts.filter(
    (alert) =>
      alert.status === "Reviewed"
  ).length;

  const dismissedAlerts = alerts.filter(
    (alert) =>
      alert.status === "Dismissed"
  ).length;

  const highAlerts = alerts.filter(
    (alert) =>
      alert.severity === "High"
  ).length;

  const mediumAlerts = alerts.filter(
    (alert) =>
      alert.severity === "Medium"
  ).length;

  const lowAlerts = alerts.filter(
    (alert) =>
      alert.severity === "Low"
  ).length;

  const repeatedAlerts = alerts.filter(
    (alert) =>
      alert.type === "Repeated Corrections"
  ).length;

  const rapidAlerts = alerts.filter(
    (alert) =>
      alert.type === "Rapid Corrections"
  ).length;

  const activityAlerts = alerts.filter(
    (alert) =>
      alert.type ===
      "High Correction Activity"
  ).length;

  /* =========================================================
     TOP IN-CHARGES
  ========================================================= */

  const topIncharges = useMemo(() => {
    const counts =
      new Map<string, number>();

    alerts.forEach((alert) => {
      counts.set(
        alert.performedBy,
        (counts.get(
          alert.performedBy
        ) || 0) + 1
      );
    });

    return Array.from(
      counts.entries()
    )
      .map(
        ([performedBy, count]) => ({
          performedBy,
          count,
        })
      )
      .sort(
        (a, b) => b.count - a.count
      )
      .slice(0, 5);
  }, [alerts]);

  /* =========================================================
     SELECTION
  ========================================================= */

  const allVisibleSelected =
    filteredAlerts.length > 0 &&
    filteredAlerts.every((alert) =>
      selectedIds.includes(alert.id)
    );

  function toggleSelection(
    alertId: string
  ) {
    setSelectedIds((current) =>
      current.includes(alertId)
        ? current.filter(
            (id) => id !== alertId
          )
        : [...current, alertId]
    );
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) =>
            !filteredAlerts.some(
              (alert) =>
                alert.id === id
            )
        )
      );

      return;
    }

    setSelectedIds((current) => {
      const ids = new Set(current);

      filteredAlerts.forEach(
        (alert) => ids.add(alert.id)
      );

      return Array.from(ids);
    });
  }

  /* =========================================================
     STATUS UPDATE
  ========================================================= */

  function updateStatus(
    alert: AuditAlert,
    status: AuditAlertStatus
  ) {
    const updated =
      updateAuditAlert(
        alert.id,
        {
          status,

          reviewedAt:
            status === "Pending Review"
              ? undefined
              : new Date().toISOString(),

          reviewedBy:
            status === "Pending Review"
              ? undefined
              : "Admin",
        }
      );

    setAlerts(updated);

    const updatedAlert =
      updated.find(
        (item) =>
          item.id === alert.id
      );

    setSelectedAlert(
      updatedAlert || null
    );
  }

  function bulkUpdateStatus(
    status: AuditAlertStatus
  ) {
    if (selectedIds.length === 0) {
      return;
    }

    if (
      status === "Dismissed" &&
      !window.confirm(
        `Dismiss ${selectedIds.length} selected alert(s)?`
      )
    ) {
      return;
    }

    let updated = getAuditAlerts();

    selectedIds.forEach((id) => {
      updated =
        updateAuditAlert(
          id,
          {
            status,

            reviewedAt:
              status ===
              "Pending Review"
                ? undefined
                : new Date().toISOString(),

            reviewedBy:
              status ===
              "Pending Review"
                ? undefined
                : "Admin",
          }
        );
    });

    setAlerts(updated);
    setSelectedIds([]);
    setSelectedAlert(null);
  }

  /* =========================================================
     FILTER CLEAR
  ========================================================= */

  function clearFilters() {
    setSearch("");
    setSeverityFilter("All");
    setStatusFilter("All");
    setTypeFilter("All");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
  }

  /* =========================================================
     EXPORT CSV
  ========================================================= */

  function exportCSV() {
    const rows = [
      [
        "Alert ID",
        "Type",
        "Severity",
        "Status",
        "In-Charge",
        "Event",
        "Event ID",
        "Match",
        "Match ID",
        "Reason",
        "Detected At",
        "Reviewed At",
        "Reviewed By",
      ],

      ...filteredAlerts.map(
        (alert) => {
          const match =
            findMatch(
              alert.matchId
            );

          const event =
            findEventForAlert(
              alert
            );

          return [
            alert.id,
            alert.type,
            alert.severity,
            alert.status,
            alert.performedBy,
            getEventName(event),
            getEventId(alert),
            getMatchLabel(match),
            alert.matchId,
            alert.reason,
            formatDateTime(
              alert.detectedAt
            ),
            formatDateTime(
              alert.reviewedAt
            ),
            alert.reviewedBy || "",
          ];
        }
      ),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(escapeCSV)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `isports-audit-alerts-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /* =========================================================
     EXPORT JSON
  ========================================================= */

  function exportJSON() {
    const data =
      filteredAlerts.map(
        (alert) => {
          const match =
            findMatch(
              alert.matchId
            );

          const event =
            findEventForAlert(
              alert
            );

          return {
            ...alert,

            event: {
              id: getEventId(alert),
              name: getEventName(event),
            },

            match: {
              id: alert.matchId,
              name: getMatchLabel(match),
              teamA:
                match?.teamA || "",
              teamB:
                match?.teamB || "",
            },
          };
        }
      );

    const blob = new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        ),
      ],
      {
        type:
          "application/json;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `isports-audit-alerts-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">

        {/* HEADER */}

        <div className="mb-4 flex flex-wrap gap-3">

          <Link
            href="/admin/audit"
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700"
          >
            ← Back to Audit
          </Link>

          <button
            type="button"
            onClick={loadAlerts}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700"
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-700"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={exportJSON}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Export JSON
          </button>

          <a
  href="/admin/audit/alerts/analytics"
  className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
>
  Analytics
</a>


          <Link
            href="/admin"
            className="rounded-lg border border-gray-500 bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700"
          >
            Admin Dashboard
          </Link>

        </div>

        <div className="mb-6 text-xs text-slate-500">
          Auto-refresh: every 30 seconds
          {" • "}
          Last updated:{" "}
          {lastUpdated || "-"}
        </div>

        {/* SUMMARY */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Alerts
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalAlerts}
            </p>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-slate-900 p-5">
            <p className="text-sm text-yellow-300">
              Pending Review
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-300">
              {pendingAlerts}
            </p>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-slate-900 p-5">
            <p className="text-sm text-red-300">
              High Severity
            </p>

            <p className="mt-2 text-3xl font-bold text-red-300">
              {highAlerts}
            </p>
          </div>

          <div className="rounded-xl border border-green-500/20 bg-slate-900 p-5">
            <p className="text-sm text-green-300">
              Reviewed
            </p>

            <p className="mt-2 text-3xl font-bold text-green-300">
              {reviewedAlerts}
            </p>
          </div>

        </section>

        {/* SECONDARY SUMMARY */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <div className="rounded-xl border border-red-500/20 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">
              High
            </p>
            <p className="mt-1 text-2xl font-bold text-red-300">
              {highAlerts}
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">
              Medium
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-300">
              {mediumAlerts}
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">
              Low
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-300">
              {lowAlerts}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">
              Dismissed
            </p>
            <p className="mt-1 text-2xl font-bold">
              {dismissedAlerts}
            </p>
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">
              Active Alerts
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-300">
              {pendingAlerts}
            </p>
          </div>

        </section>

        {/* ALERT TYPE BREAKDOWN */}

        <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-bold">
            Alert Type Breakdown
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Distribution of detected audit
            alerts.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">

            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-slate-400">
                Repeated Corrections
              </p>

              <p className="mt-2 text-2xl font-bold text-red-300">
                {repeatedAlerts}
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm text-slate-400">
                Rapid Corrections
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-300">
                {rapidAlerts}
              </p>
            </div>

            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
              <p className="text-sm text-slate-400">
                High Correction Activity
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-300">
                {activityAlerts}
              </p>
            </div>

          </div>
        </section>

        {/* TOP IN-CHARGES */}

        <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-bold">
            Top Flagged In-Charges
          </h2>

          <p className="mb-5 mt-1 text-sm text-slate-400">
            In-Charges associated with the
            highest number of alerts.
          </p>

          {topIncharges.length === 0 ? (
            <p className="text-sm text-slate-500">
              No alert activity available.
            </p>
          ) : (
            <div className="space-y-3">
              {topIncharges.map(
                (item, index) => (
                  <div
                    key={item.performedBy}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold">
                        {index + 1}
                      </span>

                      <span className="font-semibold">
                        {item.performedBy}
                      </span>
                    </div>

                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-300">
                      {item.count} alerts
                    </span>
                  </div>
                )
              )}
            </div>
          )}

        </section>

        {/* FILTERS */}

        <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Alert Filters
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Search and filter the audit
                alert records.
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
            >
              Clear Filters
            </button>

          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Search
              </label>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Event, teams, alert, In-Charge..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Severity
              </label>

              <select
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(
                    event.target.value as
                      | "All"
                      | AuditAlertSeverity
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="All">
                  All Severities
                </option>
                <option value="High">
                  High
                </option>
                <option value="Medium">
                  Medium
                </option>
                <option value="Low">
                  Low
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "All"
                      | AuditAlertStatus
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="All">
                  All Statuses
                </option>
                <option value="Pending Review">
                  Pending Review
                </option>
                <option value="Reviewed">
                  Reviewed
                </option>
                <option value="Dismissed">
                  Dismissed
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Alert Type
              </label>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as
                      | "All"
                      | AuditAlertType
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="All">
                  All Types
                </option>
                <option value="Repeated Corrections">
                  Repeated Corrections
                </option>
                <option value="Rapid Corrections">
                  Rapid Corrections
                </option>
                <option value="High Correction Activity">
                  High Correction Activity
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Date From
              </label>

              <input
                type="date"
                value={dateFrom}
                onChange={(event) =>
                  setDateFrom(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Date To
              </label>

              <input
                type="date"
                value={dateTo}
                onChange={(event) =>
                  setDateTo(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Sort
              </label>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as
                      | "newest"
                      | "oldest"
                      | "severity"
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="newest">
                  Newest First
                </option>
                <option value="oldest">
                  Oldest First
                </option>
                <option value="severity">
                  Highest Severity
                </option>
              </select>
            </div>

          </div>
        </section>

        {/* BULK ACTIONS */}

        {selectedIds.length > 0 && (
          <section className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="font-semibold text-blue-300">
                  {selectedIds.length} alert(s)
                  selected
                </p>

                <p className="text-xs text-slate-400">
                  Apply a status to all selected
                  alerts.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    bulkUpdateStatus(
                      "Pending Review"
                    )
                  }
                  className="rounded-lg border border-yellow-500/30 px-3 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/10"
                >
                  Reopen
                </button>

                <button
                  type="button"
                  onClick={() =>
                    bulkUpdateStatus(
                      "Reviewed"
                    )
                  }
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold hover:bg-green-500"
                >
                  Mark Reviewed
                </button>

                <button
                  type="button"
                  onClick={() =>
                    bulkUpdateStatus(
                      "Dismissed"
                    )
                  }
                  className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-600"
                >
                  Dismiss
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds([])
                  }
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-800"
                >
                  Clear Selection
                </button>

              </div>

            </div>
          </section>
        )}

        {/* ALERT RECORDS */}

        <section className="rounded-xl border border-slate-800 bg-slate-900">

          <div className="flex flex-col gap-3 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Alert Records
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Showing{" "}
                {filteredAlerts.length}{" "}
                of {alerts.length} alerts.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={exportCSV}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
              >
                Export Filtered CSV
              </button>

              <button
                type="button"
                onClick={exportJSON}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
              >
                Export Filtered JSON
              </button>

            </div>

          </div>

          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center">

              <p className="font-semibold text-slate-300">
                No alerts found
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your filters or
                search term.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-full text-sm">

                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">

                    <th className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={
                          allVisibleSelected
                        }
                        onChange={
                          toggleSelectAll
                        }
                        className="h-4 w-4"
                      />
                    </th>

                    <th className="px-6 py-4">
                      Alert
                    </th>

                    <th className="px-6 py-4">
                      Severity
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      In-Charge
                    </th>

                    <th className="px-6 py-4">
                      Event
                    </th>

                    <th className="px-6 py-4">
                      Match
                    </th>

                    <th className="px-6 py-4">
                      Detected
                    </th>

                    <th className="px-6 py-4">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredAlerts.map(
                    (alert) => {
                      const match =
                        findMatch(
                          alert.matchId
                        );

                      const event =
                        findEventForAlert(
                          alert
                        );

                      const isSelected =
                        selectedIds.includes(
                          alert.id
                        );

                      return (
                        <tr
                          key={alert.id}
                          className={`border-b border-slate-800 last:border-b-0 hover:bg-slate-950 ${
                            isSelected
                              ? "bg-blue-500/5"
                              : ""
                          }`}
                        >

                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={
                                isSelected
                              }
                              onChange={() =>
                                toggleSelection(
                                  alert.id
                                )
                              }
                              className="h-4 w-4"
                            />
                          </td>
                          {/* ALERT */}

                          <td className="px-6 py-4">

                            <div className="font-semibold">
                              {alert.type}
                            </div>

                            <div className="mt-1 max-w-sm text-xs text-slate-500">
                              {alert.reason}
                            </div>

                            <div className="mt-1 font-mono text-xs text-slate-600">
                              {alert.id}
                            </div>

                          </td>

                          {/* SEVERITY */}

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSeverityClasses(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                alert.status
                              )}`}
                            >
                              {alert.status}
                            </span>
                          </td>

                          {/* IN-CHARGE */}

                          <td className="px-6 py-4 font-medium">
                            {alert.performedBy}
                          </td>

                          {/* EVENT */}

                          <td className="px-6 py-4">

                            <div className="font-semibold text-white">
                              {getEventName(
                                event
                              )}
                            </div>

                            <div className="mt-1 font-mono text-xs text-slate-500">
                              Event ID:{" "}
                              {getEventId(
                                alert
                              ) || "-"}
                            </div>

                          </td>

                          {/* MATCH */}

                          <td className="px-6 py-4">

                            <div className="font-semibold text-white">
                              {getMatchLabel(
                                match
                              )}
                            </div>

                            <div className="mt-1 font-mono text-xs text-slate-500">
                              Match ID:{" "}
                              {alert.matchId}
                            </div>

                          </td>

                          {/* DETECTED */}

                          <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                            {formatDateTime(
                              alert.detectedAt
                            )}
                          </td>

                          {/* ACTION */}

                          <td className="px-6 py-4">

                            <div className="flex flex-wrap gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedAlert(
                                    alert
                                  )
                                }
                                className="rounded-lg border border-blue-500/30 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/10"
                              >
                                View
                              </button>

                              {alert.status !==
                                "Reviewed" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateStatus(
                                      alert,
                                      "Reviewed"
                                    )
                                  }
                                  className="rounded-lg border border-green-500/30 px-3 py-2 text-xs font-semibold text-green-300 hover:bg-green-500/10"
                                >
                                  Review
                                </button>
                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>
      </div>

      {/* =====================================================
          DETAIL MODAL
      ===================================================== */}

      {selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedAlert(null);
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 p-6">

              <div>
                <h2 className="text-xl font-bold">
                  Alert Details
                </h2>

                <p className="mt-1 font-mono text-xs text-slate-500">
                  {selectedAlert.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAlert(null)
                }
                className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800"
              >
                ✕
              </button>

            </div>

            <div className="space-y-5 p-6">

              {/* EVENT */}

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">

                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Event
                </p>

                <p className="mt-2 text-xl font-bold">
                  {getEventName(
                    findEventForAlert(
                      selectedAlert
                    )
                  )}
                </p>

                <p className="mt-2 font-mono text-xs text-slate-500">
                  Event ID:{" "}
                  {getEventId(
                    selectedAlert
                  ) || "-"}
                </p>

              </div>

              {/* MATCH */}

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">

                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Match
                </p>

                <p className="mt-2 text-xl font-bold">
                  {getMatchLabel(
                    findMatch(
                      selectedAlert.matchId
                    )
                  )}
                </p>

                <p className="mt-2 font-mono text-xs text-slate-500">
                  Match ID:{" "}
                  {selectedAlert.matchId}
                </p>

              </div>

              {/* TYPE */}

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Alert Type
                </p>

                <p className="mt-1 font-semibold">
                  {selectedAlert.type}
                </p>
              </div>

              {/* SEVERITY / STATUS */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Severity
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getSeverityClasses(
                      selectedAlert.severity
                    )}`}
                  >
                    {selectedAlert.severity}
                  </span>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClasses(
                      selectedAlert.status
                    )}`}
                  >
                    {selectedAlert.status}
                  </span>
                </div>

              </div>

              {/* IN-CHARGE */}

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  In-Charge
                </p>

                <p className="mt-1 font-semibold">
                  {selectedAlert.performedBy}
                </p>
              </div>

              {/* REASON */}

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Reason
                </p>

                <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                  {selectedAlert.reason}
                </div>
              </div>

              {/* DATES */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Detected At
                  </p>

                  <p className="mt-1 text-sm">
                    {formatDateTime(
                      selectedAlert.detectedAt
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Reviewed At
                  </p>

                  <p className="mt-1 text-sm">
                    {formatDateTime(
                      selectedAlert.reviewedAt
                    )}
                  </p>
                </div>

              </div>

              {/* REVIEWED BY */}

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Reviewed By
                </p>

                <p className="mt-1 text-sm">
                  {selectedAlert.reviewedBy ||
                    "-"}
                </p>
              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 p-6">

              {selectedAlert.status !==
                "Pending Review" && (
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(
                      selectedAlert,
                      "Pending Review"
                    )
                  }
                  className="rounded-lg border border-yellow-500/30 px-4 py-2 font-semibold text-yellow-300 hover:bg-yellow-500/10"
                >
                  Reopen
                </button>
              )}

              {selectedAlert.status !==
                "Reviewed" && (
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(
                      selectedAlert,
                      "Reviewed"
                    )
                  }
                  className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-500"
                >
                  Mark Reviewed
                </button>
              )}

              {selectedAlert.status !==
                "Dismissed" && (
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(
                      selectedAlert,
                      "Dismissed"
                    )
                  }
                  className="rounded-lg bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600"
                >
                  Dismiss
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setSelectedAlert(null)
                }
                className="rounded-lg border border-slate-700 px-4 py-2 font-semibold hover:bg-slate-800"
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