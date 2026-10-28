"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getScoreAudit,
  type ScoreAudit,
} from "@/data/scoreAudit";

import {
  getEvents,
} from "@/data/eventsStorage";

type SportEvent = ReturnType<typeof getEvents>[number];

import {
  getMatches,
  type StoredMatch,
} from "@/data/matchStorage";

import {
  detectAuditAlerts,
} from "@/data/auditAlertDetection";

import {
  getAuditAlerts,
  updateAuditAlert,
  type AuditAlert,
  type AuditAlertStatus,
} from "@/data/auditAlertStorage";

type ActionFilter =
  | "All"
  | ScoreAudit["action"];

function getEventName(
  eventId: string,
  events: SportEvent[]
) {
  const event = events.find(
    (item) => item.id === eventId
  );

  return event?.name || eventId;
}

function getMatchName(
  matchId: string,
  matches: StoredMatch[]
) {
  const match = matches.find(
    (item) => item.id === matchId
  );

  if (!match) {
    return matchId;
  }

  return `${match.teamA || "Team A"} vs ${
    match.teamB || "Team B"
  }`;
}

function parseAuditDate(
  timestamp: string
): Date | null {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  const parsed = Date.parse(timestamp);

  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
}

function formatDateTime(
  timestamp: string
) {
  const date = parseAuditDate(timestamp);

  if (!date) {
    return timestamp;
  }

  return date.toLocaleString();
}

function formatDateInput(
  timestamp: string
) {
  const date = parseAuditDate(timestamp);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function escapeCSV(
  value: string | number
) {
  const text = String(value);

  return `"${text.replaceAll(
    '"',
    '""'
  )}"`;
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] =
    useState<ScoreAudit[]>([]);

  const [events, setEvents] =
    useState<SportEvent[]>([]);

  const [matches, setMatches] =
    useState<StoredMatch[]>([]);

  const [auditAlerts, setAuditAlerts] =
    useState<AuditAlert[]>([]);

  const [search, setSearch] =
    useState("");

  const [selectedIncharge, setSelectedIncharge] =
    useState("All");

  const [selectedEvent, setSelectedEvent] =
    useState("All");

  const [selectedMatch, setSelectedMatch] =
    useState("All");

  const [selectedAction, setSelectedAction] =
    useState<ActionFilter>("All");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [selectedAudit, setSelectedAudit] =
    useState<ScoreAudit | null>(null);

  const [selectedAlert, setSelectedAlert] =
    useState<AuditAlert | null>(null);

  const [selectedAlertStatus, setSelectedAlertStatus] =
    useState<
      AuditAlertStatus | "All"
    >("All");

  const [lastUpdated, setLastUpdated] =
    useState("");

  function loadAuditData() {
    const loadedAudits =
      getScoreAudit();

    const loadedEvents =
      getEvents();

    const loadedMatches =
      getMatches();

    const detectedAlerts =
      detectAuditAlerts();

    const storedAlerts =
      getAuditAlerts();

    setAuditLogs(
      loadedAudits
    );

    setEvents(
      loadedEvents
    );

    setMatches(
      loadedMatches
    );

    setAuditAlerts(
      storedAlerts.length
        ? storedAlerts
        : detectedAlerts
    );

    setLastUpdated(
      new Date().toLocaleTimeString()
    );
  }

  useEffect(() => {
    loadAuditData();

    const interval =
      window.setInterval(() => {
        loadAuditData();
      }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const inchargeOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          auditLogs.map(
            (audit) =>
              audit.performedBy
          )
        )
      ).sort();
    }, [auditLogs]);

  const eventOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          auditLogs.map((audit) => {
            const match =
              matches.find(
                (item) =>
                  item.id ===
                  audit.matchId
              );

            return (
              match?.eventId || ""
            );
          })
        )
      )
        .filter(Boolean)
        .sort((a, b) =>
          getEventName(
            a,
            events
          ).localeCompare(
            getEventName(
              b,
              events
            )
          )
        );
    }, [
      auditLogs,
      matches,
      events,
    ]);

  const matchOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          auditLogs.map(
            (audit) =>
              audit.matchId
          )
        )
      ).sort((a, b) =>
        getMatchName(
          a,
          matches
        ).localeCompare(
          getMatchName(
            b,
            matches
          )
        )
      );
    }, [
      auditLogs,
      matches,
    ]);

  const filteredLogs =
    useMemo(() => {
      return auditLogs.filter(
        (audit) => {
          const match =
            matches.find(
              (item) =>
                item.id ===
                audit.matchId
            );

          const eventId =
            match?.eventId || "";

          const eventName =
            eventId
              ? getEventName(
                  eventId,
                  events
                )
              : "";

          const matchName =
            getMatchName(
              audit.matchId,
              matches
            );

          const searchText =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            !searchText ||
            audit.matchId
              .toLowerCase()
              .includes(searchText) ||
            matchName
              .toLowerCase()
              .includes(searchText) ||
            audit.performedBy
              .toLowerCase()
              .includes(searchText) ||
            audit.action
              .toLowerCase()
              .includes(searchText) ||
            eventName
              .toLowerCase()
              .includes(searchText);

          const matchesIncharge =
            selectedIncharge ===
              "All" ||
            audit.performedBy ===
              selectedIncharge;

          const matchesEvent =
            selectedEvent ===
              "All" ||
            eventId ===
              selectedEvent;

          const matchesMatch =
            selectedMatch ===
              "All" ||
            audit.matchId ===
              selectedMatch;

          const matchesAction =
            selectedAction ===
              "All" ||
            audit.action ===
              selectedAction;

          let matchesDate =
            true;

          const auditDate =
            parseAuditDate(
              audit.timestamp
            );

          if (auditDate) {
            const auditDateOnly =
              formatDateInput(
                audit.timestamp
              );

            if (
              dateFrom &&
              auditDateOnly <
                dateFrom
            ) {
              matchesDate = false;
            }

            if (
              dateTo &&
              auditDateOnly >
                dateTo
            ) {
              matchesDate = false;
            }
          }

          return (
            matchesSearch &&
            matchesIncharge &&
            matchesEvent &&
            matchesMatch &&
            matchesAction &&
            matchesDate
          );
        }
      );
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

  const summary =
    useMemo(() => {
      return {
        total:
          filteredLogs.length,

        saved:
          filteredLogs.filter(
            (audit) =>
              audit.action ===
              "Score Saved"
          ).length,

        submitted:
          filteredLogs.filter(
            (audit) =>
              audit.action ===
              "Score Submitted"
          ).length,

        corrected:
          filteredLogs.filter(
            (audit) =>
              audit.action ===
              "Score Corrected"
          ).length,

        locked:
          filteredLogs.filter(
            (audit) =>
              audit.action ===
              "Score Locked"
          ).length,
      };
    }, [filteredLogs]);

  const inchargeActivity =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            total: number;
            submitted: number;
            corrected: number;
            locked: number;
          }
        >();

      filteredLogs.forEach(
        (audit) => {
          const current =
            map.get(
              audit.performedBy
            ) || {
              total: 0,
              submitted: 0,
              corrected: 0,
              locked: 0,
            };

          current.total += 1;

          if (
            audit.action ===
            "Score Submitted"
          ) {
            current.submitted += 1;
          }

          if (
            audit.action ===
            "Score Corrected"
          ) {
            current.corrected += 1;
          }

          if (
            audit.action ===
            "Score Locked"
          ) {
            current.locked += 1;
          }

          map.set(
            audit.performedBy,
            current
          );
        }
      );

      return Array.from(
        map.entries()
      )
        .map(
          ([
            performedBy,
            stats,
          ]) => ({
            performedBy,
            ...stats,
          })
        )
        .sort(
          (a, b) =>
            b.total - a.total
        );
    }, [filteredLogs]);

  const eventActivity =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            total: number;
            submitted: number;
            corrected: number;
          }
        >();

      filteredLogs.forEach(
        (audit) => {
          const match =
            matches.find(
              (item) =>
                item.id ===
                audit.matchId
            );

          const eventId =
            match?.eventId ||
            "Unknown";

          const current =
            map.get(
              eventId
            ) || {
              total: 0,
              submitted: 0,
              corrected: 0,
            };

          current.total += 1;

          if (
            audit.action ===
            "Score Submitted"
          ) {
            current.submitted += 1;
          }

          if (
            audit.action ===
            "Score Corrected"
          ) {
            current.corrected += 1;
          }

          map.set(
            eventId,
            current
          );
        }
      );

      return Array.from(
        map.entries()
      )
        .map(
          ([
            eventId,
            stats,
          ]) => ({
            eventId,
            eventName:
              eventId ===
              "Unknown"
                ? "Unknown"
                : getEventName(
                    eventId,
                    events
                  ),
            ...stats,
          })
        )
        .sort(
          (a, b) =>
            b.total - a.total
        );
    }, [
      filteredLogs,
      matches,
      events,
    ]);

  const matchActivity =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            total: number;
            submitted: number;
            corrected: number;
            locked: number;
          }
        >();

      filteredLogs.forEach(
        (audit) => {
          const current =
            map.get(
              audit.matchId
            ) || {
              total: 0,
              submitted: 0,
              corrected: 0,
              locked: 0,
            };

          current.total += 1;

          if (
            audit.action ===
            "Score Submitted"
          ) {
            current.submitted += 1;
          }

          if (
            audit.action ===
            "Score Corrected"
          ) {
            current.corrected += 1;
          }

          if (
            audit.action ===
            "Score Locked"
          ) {
            current.locked += 1;
          }

          map.set(
            audit.matchId,
            current
          );
        }
      );

      return Array.from(
        map.entries()
      )
        .map(
          ([
            matchId,
            stats,
          ]) => ({
            matchId,
            matchName:
              getMatchName(
                matchId,
                matches
              ),
            ...stats,
          })
        )
        .sort(
          (a, b) =>
            b.total - a.total
        );
    }, [
      filteredLogs,
      matches,
    ]);

  const filteredAlerts =
    useMemo(() => {
      return auditAlerts.filter(
        (alert) =>
          selectedAlertStatus ===
            "All" ||
          alert.status ===
            selectedAlertStatus
      );
    }, [
      auditAlerts,
      selectedAlertStatus,
    ]);

  /* Alert overview */

  const totalAlerts =
    auditAlerts.length;

  const pendingAlerts =
    auditAlerts.filter(
      (alert) =>
        alert.status ===
        "Pending Review"
    ).length;

  const reviewedAlerts =
    auditAlerts.filter(
      (alert) =>
        alert.status ===
        "Reviewed"
    ).length;

  const dismissedAlerts =
    auditAlerts.filter(
      (alert) =>
        alert.status ===
        "Dismissed"
    ).length;

  const highAlerts =
    auditAlerts.filter(
      (alert) =>
        alert.severity ===
        "High"
    ).length;

  const mediumAlerts =
    auditAlerts.filter(
      (alert) =>
        alert.severity ===
        "Medium"
    ).length;

  const lowAlerts =
    auditAlerts.filter(
      (alert) =>
        alert.severity ===
        "Low"
    ).length;

  /* Alert type breakdown */

  const repeatedCorrectionAlerts =
    auditAlerts.filter(
      (alert) =>
        alert.type ===
        "Repeated Corrections"
    ).length;

  const rapidCorrectionAlerts =
    auditAlerts.filter(
      (alert) =>
        alert.type ===
        "Rapid Corrections"
    ).length;

  const highActivityAlerts =
    auditAlerts.filter(
      (alert) =>
        alert.type ===
        "High Correction Activity"
    ).length;

  const mostCommonAlertType =
    useMemo(() => {
      const types = [
        {
          name: "Repeated Corrections",
          count:
            repeatedCorrectionAlerts,
        },
        {
          name: "Rapid Corrections",
          count:
            rapidCorrectionAlerts,
        },
        {
          name: "High Correction Activity",
          count:
            highActivityAlerts,
        },
      ];

      return types.sort(
        (a, b) =>
          b.count - a.count
      )[0];
    }, [
      repeatedCorrectionAlerts,
      rapidCorrectionAlerts,
      highActivityAlerts,
    ]);

  const activeFilterCount =
    [
      selectedIncharge !==
        "All",

      selectedEvent !==
        "All",

      selectedMatch !==
        "All",

      selectedAction !==
        "All",

      Boolean(search),

      Boolean(dateFrom),

      Boolean(dateTo),
    ].filter(Boolean)
      .length;

  const invalidDateRange =
    Boolean(
      dateFrom &&
        dateTo &&
        dateFrom > dateTo
    );

  function clearFilters() {
    setSearch("");
    setSelectedIncharge(
      "All"
    );
    setSelectedEvent("All");
    setSelectedMatch("All");
    setSelectedAction("All");
    setDateFrom("");
    setDateTo("");
  }

  function setToday() {
    const today =
      new Date();

    const value =
      formatDateInput(
        today.toISOString()
      );

    setDateFrom(value);
    setDateTo(value);
  }

  function setLast7Days() {
    const today =
      new Date();

    const previous =
      new Date();

    previous.setDate(
      today.getDate() - 6
    );

    setDateFrom(
      formatDateInput(
        previous.toISOString()
      )
    );

    setDateTo(
      formatDateInput(
        today.toISOString()
      )
    );
  }

  function setLast30Days() {
    const today =
      new Date();

    const previous =
      new Date();

    previous.setDate(
      today.getDate() - 29
    );

    setDateFrom(
      formatDateInput(
        previous.toISOString()
      )
    );

    setDateTo(
      formatDateInput(
        today.toISOString()
      )
    );
  }

  function setThisMonth() {
    const today =
      new Date();

    const firstDay =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    setDateFrom(
      formatDateInput(
        firstDay.toISOString()
      )
    );

    setDateTo(
      formatDateInput(
        today.toISOString()
      )
    );
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
      ],
      ...filteredLogs.map(
        (audit) => {
          const match =
            matches.find(
              (item) =>
                item.id ===
                audit.matchId
            );

          const eventId =
            match?.eventId || "";

          return [
            audit.id,
            getMatchName(
              audit.matchId,
              matches
            ),
            eventId
              ? getEventName(
                  eventId,
                  events
                )
              : "",
            audit.action,
            audit.performedBy,
            formatDateTime(
              audit.timestamp
            ),
          ];
        }
      ),
    ];

    const csv =
      rows
        .map((row) =>
          row
            .map((value) =>
              escapeCSV(value)
            )
            .join(",")
        )
        .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `score-audit-${Date.now()}.csv`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const blob =
      new Blob(
        [
          JSON.stringify(
            filteredLogs,
            null,
            2
          ),
        ],
        {
          type: "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `score-audit-${Date.now()}.json`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  }

  function handleAlertStatusUpdate(
    alert: AuditAlert,
    status: AuditAlertStatus
  ) {
    const updated =
      updateAuditAlert(
        alert.id,
        {
          status,
          reviewedAt:
            new Date().toISOString(),
          reviewedBy:
            "Admin",
        }
      );

    setAuditAlerts(
      updated
    );

    const updatedAlert =
      updated.find(
        (item) =>
          item.id === alert.id
      );

    if (updatedAlert) {
      setSelectedAlert(
        updatedAlert
      );
    }
  }

  function getSeverityClasses(
    severity: AuditAlert["severity"]
  ) {
    if (
      severity === "High"
    ) {
      return "border-red-800 bg-red-950/40 text-red-300";
    }

    if (
      severity === "Medium"
    ) {
      return "border-orange-800 bg-orange-950/40 text-orange-300";
    }

    return "border-blue-800 bg-blue-950/40 text-blue-300";
  }

  function getStatusClasses(
    status: AuditAlertStatus
  ) {
    if (
      status ===
      "Pending Review"
    ) {
      return "bg-yellow-900/40 text-yellow-300";
    }

    if (
      status === "Reviewed"
    ) {
      return "bg-green-900/40 text-green-300";
    }

    return "bg-slate-800 text-slate-300";
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Score Audit Log
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Monitor score activity,
              corrections, locking and
              audit alerts.
            </p>

            {lastUpdated && (
              <p className="mt-1 text-xs text-slate-500">
                Last updated:{" "}
                {lastUpdated}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 font-semibold hover:bg-slate-800"
            >
              ← Back to Admin
            </Link>

            <button
              onClick={
                loadAuditData
              }
              className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Top Actions */}
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

        {/* Summary */}
        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              Total Actions
            </p>

            <p className="mt-1 text-2xl font-bold">
              {summary.total}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              Saved
            </p>

            <p className="mt-1 text-2xl font-bold">
              {summary.saved}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              Submitted
            </p>

            <p className="mt-1 text-2xl font-bold">
              {summary.submitted}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              Corrected
            </p>

            <p className="mt-1 text-2xl font-bold">
              {summary.corrected}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">
              Locked
            </p>

            <p className="mt-1 text-2xl font-bold">
              {summary.locked}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Filters
              </h2>

              <p className="text-sm text-slate-400">
                {activeFilterCount} active
                filter
                {activeFilterCount ===
                1
                  ? ""
                  : "s"}
              </p>
            </div>

            <button
              onClick={
                clearFilters
              }
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Search
              </label>

              <input
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search audit..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-400">
                In-Charge
              </label>

              <select
                value={
                  selectedIncharge
                }
                onChange={(
                  event
                ) =>
                  setSelectedIncharge(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="All">
                  All In-Charges
                </option>

                {inchargeOptions.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Event
              </label>

              <select
                value={
                  selectedEvent
                }
                onChange={(
                  event
                ) =>
                  setSelectedEvent(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="All">
                  All Events
                </option>

                {eventOptions.map(
                  (eventId) => (
                    <option
                      key={eventId}
                      value={eventId}
                    >
                      {getEventName(
                        eventId,
                        events
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Match
              </label>

              <select
                value={
                  selectedMatch
                }
                onChange={(
                  event
                ) =>
                  setSelectedMatch(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="All">
                  All Matches
                </option>

                {matchOptions.map(
                  (matchId) => (
                    <option
                      key={matchId}
                      value={matchId}
                    >
                      {getMatchName(
                        matchId,
                        matches
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Action
              </label>

              <select
                value={
                  selectedAction
                }
                onChange={(
                  event
                ) =>
                  setSelectedAction(
                    event.target
                      .value as ActionFilter
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="All">
                  All Actions
                </option>

                <option value="Score Saved">
                  Score Saved
                </option>

                <option value="Score Submitted">
                  Score Submitted
                </option>

                <option value="Score Corrected">
                  Score Corrected
                </option>

                <option value="Score Locked">
                  Score Locked
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Date From
              </label>

              <input
                type="date"
                value={dateFrom}
                onChange={(
                  event
                ) =>
                  setDateFrom(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Date To
              </label>

              <input
                type="date"
                value={dateTo}
                onChange={(
                  event
                ) =>
                  setDateTo(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </div>
          </div>

          {invalidDateRange && (
            <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
              Date From cannot be
              later than Date To.
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
              onClick={
                setLast7Days
              }
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Last 7 Days
            </button>

            <button
              onClick={
                setLast30Days
              }
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Last 30 Days
            </button>

            <button
              onClick={
                setThisMonth
              }
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              This Month
            </button>
          </div>
        </section>
        {/* Activity */}
        <div className="mb-6 grid gap-6 lg:grid-cols-3">

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              In-Charge Activity
            </h2>

            <div className="space-y-3">
              {inchargeActivity.length ===
              0 ? (
                <p className="text-sm text-slate-500">
                  No activity found.
                </p>
              ) : (
                inchargeActivity.map(
                  (item) => (
                    <div
                      key={
                        item.performedBy
                      }
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">
                          {
                            item.performedBy
                          }
                        </span>

                        <span className="text-sm text-slate-400">
                          {
                            item.total
                          }{" "}
                          actions
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        Submitted:{" "}
                        {
                          item.submitted
                        }{" "}
                        · Corrected:{" "}
                        {
                          item.corrected
                        }{" "}
                        · Locked:{" "}
                        {
                          item.locked
                        }
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              Event Activity
            </h2>

            <div className="space-y-3">
              {eventActivity.length ===
              0 ? (
                <p className="text-sm text-slate-500">
                  No activity found.
                </p>
              ) : (
                eventActivity.map(
                  (item) => (
                    <div
                      key={
                        item.eventId
                      }
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">
                          {
                            item.eventName
                          }
                        </span>

                        <span className="text-sm text-slate-400">
                          {
                            item.total
                          }
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        Submitted:{" "}
                        {
                          item.submitted
                        }{" "}
                        · Corrected:{" "}
                        {
                          item.corrected
                        }
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              Match Activity
            </h2>

            <div className="space-y-3">
              {matchActivity.length ===
              0 ? (
                <p className="text-sm text-slate-500">
                  No activity found.
                </p>
              ) : (
                matchActivity.map(
                  (item) => (
                    <div
                      key={
                        item.matchId
                      }
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">
                          {
                            item.matchName
                          }
                        </span>

                        <span className="text-sm text-slate-400">
                          {
                            item.total
                          }
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        Submitted:{" "}
                        {
                          item.submitted
                        }{" "}
                        · Corrected:{" "}
                        {
                          item.corrected
                        }{" "}
                        · Locked:{" "}
                        {
                          item.locked
                        }
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        </div>

        {/* Alert Overview */}
        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Alert Overview
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Current audit alert status
              and severity distribution.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">
                Total Alerts
              </p>

              <p className="mt-1 text-2xl font-bold">
                {totalAlerts}
              </p>
            </div>

            <div className="rounded-xl border border-red-800 bg-red-950/40 p-4">
              <p className="text-sm text-red-300">
                High
              </p>

              <p className="mt-1 text-2xl font-bold text-red-400">
                {highAlerts}
              </p>
            </div>

            <div className="rounded-xl border border-orange-800 bg-orange-950/40 p-4">
              <p className="text-sm text-orange-300">
                Medium
              </p>

              <p className="mt-1 text-2xl font-bold text-orange-400">
                {mediumAlerts}
              </p>
            </div>

            <div className="rounded-xl border border-blue-800 bg-blue-950/40 p-4">
              <p className="text-sm text-blue-300">
                Low
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-400">
                {lowAlerts}
              </p>
            </div>

            <div className="rounded-xl border border-yellow-800 bg-yellow-950/40 p-4">
              <p className="text-sm text-yellow-300">
                Pending Review
              </p>

              <p className="mt-1 text-2xl font-bold text-yellow-400">
                {pendingAlerts}
              </p>
            </div>

            <div className="rounded-xl border border-green-800 bg-green-950/40 p-4">
              <p className="text-sm text-green-300">
                Reviewed
              </p>

              <p className="mt-1 text-2xl font-bold text-green-400">
                {reviewedAlerts}
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">
                Dismissed
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-300">
                {dismissedAlerts}
              </p>
            </div>
          </div>
        </section>

        {/* Alert Type Breakdown */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Alert Type Breakdown
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Identify which unusual
                activity pattern is being
                detected most often.
              </p>
            </div>

            {totalAlerts > 0 && (
              <div className="rounded-lg border border-purple-800 bg-purple-950/40 px-4 py-2 text-sm">
                Most common:{" "}
                <span className="font-semibold text-purple-300">
                  {
                    mostCommonAlertType.name
                  }
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-red-800 bg-red-950/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-red-300">
                  Repeated Corrections
                </h3>

                <span className="rounded-full bg-red-900/50 px-3 py-1 text-sm font-bold text-red-300">
                  {
                    repeatedCorrectionAlerts
                  }
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-400">
                Three or more score
                corrections detected
                for the same match.
              </p>
            </div>

            <div className="rounded-xl border border-orange-800 bg-orange-950/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-orange-300">
                  Rapid Corrections
                </h3>

                <span className="rounded-full bg-orange-900/50 px-3 py-1 text-sm font-bold text-orange-300">
                  {
                    rapidCorrectionAlerts
                  }
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-400">
                Multiple score
                corrections detected
                within a 10-minute
                period.
              </p>
            </div>

            <div className="rounded-xl border border-purple-800 bg-purple-950/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-purple-300">
                  High Correction Activity
                </h3>

                <span className="rounded-full bg-purple-900/50 px-3 py-1 text-sm font-bold text-purple-300">
                  {
                    highActivityAlerts
                  }
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-400">
                An In-Charge has
                performed a high
                number of score
                corrections.
              </p>
            </div>

          </div>
        </section>

        {/* Audit Alerts */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Audit Alerts
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Automatically detected
                unusual score activity.
              </p>
            </div>

            <select
              value={
                selectedAlertStatus
              }
              onChange={(
                event
              ) =>
                setSelectedAlertStatus(
                  event.target
                    .value as
                    | AuditAlertStatus
                    | "All"
                )
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="All">
                All Alerts
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

          {filteredAlerts.length ===
          0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center">
              <p className="text-slate-400">
                No alerts found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map(
                (alert) => {
                  const match =
                    matches.find(
                      (item) =>
                        item.id ===
                        alert.matchId
                    );

                  const eventId =
                    match?.eventId;

                  return (
                    <div
                      key={
                        alert.id
                      }
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-semibold ${getSeverityClasses(
                                alert.severity
                              )}`}
                            >
                              {
                                alert.severity
                              }
                            </span>

                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusClasses(
                                alert.status
                              )}`}
                            >
                              {
                                alert.status
                              }
                            </span>

                            <span className="text-sm font-semibold">
                              {
                                alert.type
                              }
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-slate-300">
                            {
                              alert.reason
                            }
                          </p>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">

                            <span>
                              Match:{" "}
                              {getMatchName(
                                alert.matchId,
                                matches
                              )}
                            </span>

                            <span>
                              Event:{" "}
                              {eventId
                                ? getEventName(
                                    eventId,
                                    events
                                  )
                                : "Unknown"}
                            </span>

                            <span>
                              In-Charge:{" "}
                              {
                                alert.performedBy
                              }
                            </span>

                            <span>
                              Detected:{" "}
                              {formatDateTime(
                                alert.detectedAt
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setSelectedAlert(
                              alert
                            )
                          }
                          className="shrink-0 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500"
                        >
                          View Alert
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
        {/* Audit Table */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Score Audit Records
              </h2>

              <p className="text-sm text-slate-400">
                Showing{" "}
                {
                  filteredLogs.length
                }{" "}
                of{" "}
                {auditLogs.length}{" "}
                records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                onClick={
                  exportCSV
                }
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500"
              >
                Export CSV
              </button>

              <button
                onClick={
                  exportJSON
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
              >
                Export JSON
              </button>

              <Link
                href="/admin"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
              >
                ← Admin
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full text-left text-sm">

              <thead>
                <tr className="border-b border-slate-800 text-slate-400">

                  <th className="px-3 py-3">
                    Time
                  </th>

                  <th className="px-3 py-3">
                    In-Charge
                  </th>

                  <th className="px-3 py-3">
                    Event
                  </th>

                  <th className="px-3 py-3">
                    Match
                  </th>

                  <th className="px-3 py-3">
                    Action
                  </th>

                  <th className="px-3 py-3">
                    Details
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredLogs.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-slate-500"
                    >
                      No audit records
                      found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(
                    (audit) => {
                      const match =
                        matches.find(
                          (item) =>
                            item.id ===
                            audit.matchId
                        );

                      const eventId =
                        match?.eventId;

                      return (
                        <tr
                          key={
                            audit.id
                          }
                          className="border-b border-slate-900 hover:bg-slate-950"
                        >

                          <td className="px-3 py-3 text-xs text-slate-400">
                            {formatDateTime(
                              audit.timestamp
                            )}
                          </td>

                          <td className="px-3 py-3">
                            {
                              audit.performedBy
                            }
                          </td>

                          <td className="px-3 py-3">
                            {eventId
                              ? getEventName(
                                  eventId,
                                  events
                                )
                              : "Unknown"}
                          </td>

                          <td className="px-3 py-3">
                            {getMatchName(
                              audit.matchId,
                              matches
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">
                              {
                                audit.action
                              }
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <button
                              onClick={() =>
                                setSelectedAudit(
                                  audit
                                )
                              }
                              className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
                            >
                              View
                            </button>
                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl font-bold">
                Audit Details
              </h2>

              <button
                onClick={() =>
                  setSelectedAudit(
                    null
                  )
                }
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>

            </div>

            <div className="space-y-3 text-sm">

              <div>
                <span className="text-slate-500">
                  Audit ID
                </span>

                <p className="font-medium">
                  {
                    selectedAudit.id
                  }
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  Action
                </span>

                <p className="font-medium">
                  {
                    selectedAudit.action
                  }
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  In-Charge
                </span>

                <p className="font-medium">
                  {
                    selectedAudit.performedBy
                  }
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  Event
                </span>

                <p className="font-medium">
                  {(() => {
                    const match =
                      matches.find(
                        (item) =>
                          item.id ===
                          selectedAudit.matchId
                      );

                    return match?.eventId
                      ? getEventName(
                          match.eventId,
                          events
                        )
                      : "Unknown";
                  })()}
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  Match
                </span>

                <p className="font-medium">
                  {getMatchName(
                    selectedAudit.matchId,
                    matches
                  )}
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  Timestamp
                </span>

                <p className="font-medium">
                  {formatDateTime(
                    selectedAudit.timestamp
                  )}
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                setSelectedAudit(
                  null
                )
              }
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

              <h2 className="text-xl font-bold">
                Audit Alert
              </h2>

              <button
                onClick={() =>
                  setSelectedAlert(
                    null
                  )
                }
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>

            </div>

            <div className="mb-5 flex flex-wrap gap-2">

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClasses(
                  selectedAlert.severity
                )}`}
              >
                {
                  selectedAlert.severity
                }
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                  selectedAlert.status
                )}`}
              >
                {
                  selectedAlert.status
                }
              </span>

            </div>

            <div className="space-y-4 text-sm">

              <div>
                <span className="text-slate-500">
                  Alert Type
                </span>

                <p className="font-medium">
                  {
                    selectedAlert.type
                  }
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  Reason
                </span>

                <p className="font-medium text-slate-200">
                  {
                    selectedAlert.reason
                  }
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  Match
                </span>

                <p className="font-medium">
                  {getMatchName(
                    selectedAlert.matchId,
                    matches
                  )}
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  Event
                </span>

                <p className="font-medium">
                  {(() => {
                    const match =
                      matches.find(
                        (item) =>
                          item.id ===
                          selectedAlert.matchId
                      );

                    return match?.eventId
                      ? getEventName(
                          match.eventId,
                          events
                        )
                      : "Unknown";
                  })()}
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  In-Charge
                </span>

                <p className="font-medium">
                  {
                    selectedAlert.performedBy
                  }
                </p>
              </div>

              <div>
                <span className="text-slate-500">
                  Detected At
                </span>

                <p className="font-medium">
                  {formatDateTime(
                    selectedAlert.detectedAt
                  )}
                </p>
              </div>

              {selectedAlert.reviewedAt && (
                <div>
                  <span className="text-slate-500">
                    Reviewed At
                  </span>

                  <p className="font-medium">
                    {formatDateTime(
                      selectedAlert.reviewedAt
                    )}
                  </p>
                </div>
              )}

              {selectedAlert.reviewedBy && (
                <div>
                  <span className="text-slate-500">
                    Reviewed By
                  </span>

                  <p className="font-medium">
                    {
                      selectedAlert.reviewedBy
                    }
                  </p>
                </div>
              )}

            </div>

            <div className="mt-6 flex flex-wrap gap-3">

              {selectedAlert.status !==
                "Reviewed" && (
                <button
                  onClick={() =>
                    handleAlertStatusUpdate(
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
                  onClick={() =>
                    handleAlertStatusUpdate(
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
                onClick={() =>
                  setSelectedAlert(
                    null
                  )
                }
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