"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getAuditAlerts,
  type AuditAlert,
} from "@/data/auditAlertStorage";

import { detectAuditAlerts } from "@/data/auditAlertDetection";

import {
  getMatches,
  type StoredMatch,
} from "@/data/matchStorage";

import {
  getEvents,
} from "@/data/eventsStorage";

type AuditEvent = ReturnType<typeof getEvents>[number];

/* =========================================================
   HELPERS
========================================================= */

function getEventName(
  event: AuditEvent | undefined
) {
  if (!event) {
    return "Event not found";
  }

  const record = event as AuditEvent & {
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

function getMatchName(
  match: StoredMatch | undefined
) {
  if (!match) {
    return "Match not found";
  }

  return `${match.teamA} vs ${match.teamB}`;
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getSeverityClasses(
  severity: AuditAlert["severity"]
) {
  switch (severity) {
    case "High":
      return "border-red-500/30 bg-red-500/10 text-red-300";

    case "Medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";

    default:
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminAuditAlertsCard() {
  const [alerts, setAlerts] =
    useState<AuditAlert[]>([]);

  const [matches, setMatches] =
    useState<StoredMatch[]>([]);

  const [events, setEvents] =
    useState<AuditEvent[]>([]);

  const [lastUpdated, setLastUpdated] =
    useState("");

  /* =========================================================
     LOAD
  ========================================================= */

  function loadData() {
    try {
      /*
       * Run detection first so newly generated
       * alerts appear on the Admin Dashboard.
       */
      detectAuditAlerts();

      setAlerts(getAuditAlerts());
      setMatches(getMatches());
      setEvents(getEvents());

      setLastUpdated(
        new Date().toLocaleTimeString()
      );
    } catch (error) {
      console.error(
        "Failed to load audit alerts:",
        error
      );

      setAlerts([]);
      setMatches([]);
      setEvents([]);
    }
  }

  useEffect(() => {
    loadData();

    const interval =
      window.setInterval(
        loadData,
        30000
      );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* =========================================================
     LOOKUPS
  ========================================================= */

  function findMatch(
    matchId: string
  ) {
    return matches.find(
      (match) =>
        match.id === matchId
    );
  }

  function findEvent(
    eventId: string | undefined
  ) {
    if (!eventId) {
      return undefined;
    }

    return events.find(
      (event) =>
        event.id === eventId
    );
  }

  function getAlertEvent(
    alert: AuditAlert
  ) {
    const match =
      findMatch(alert.matchId);

    const eventId =
      alert.eventId ||
      match?.eventId;

    return findEvent(eventId);
  }

  /* =========================================================
     SUMMARY
  ========================================================= */

  const totalAlerts =
    alerts.length;

  const pendingAlerts =
    alerts.filter(
      (alert) =>
        alert.status ===
        "Pending Review"
    ).length;

  const highAlerts =
    alerts.filter(
      (alert) =>
        alert.severity === "High"
    ).length;

  const reviewedAlerts =
    alerts.filter(
      (alert) =>
        alert.status === "Reviewed"
    ).length;

  /* =========================================================
     RECENT ALERTS
  ========================================================= */

  const recentAlerts =
    useMemo(() => {
      return [...alerts]
        .sort(
          (a, b) =>
            new Date(
              b.detectedAt
            ).getTime() -
            new Date(
              a.detectedAt
            ).getTime()
        )
        .slice(0, 5);
    }, [alerts]);

  /* =========================================================
     TOP FLAGGED IN-CHARGE
  ========================================================= */

  const topIncharge =
    useMemo(() => {
      if (alerts.length === 0) {
        return null;
      }

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

      const sorted =
        Array.from(
          counts.entries()
        ).sort(
          (a, b) =>
            b[1] - a[1]
        );

      if (sorted.length === 0) {
        return null;
      }

      return {
        name: sorted[0][0],
        count: sorted[0][1],
      };
    }, [alerts]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section className="mb-8 rounded-2xl border border-red-500/20 bg-slate-900 shadow-xl">

      {/* HEADER */}

      <div className="flex flex-col gap-4 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div
              className={`h-3 w-3 rounded-full ${
                pendingAlerts > 0
                  ? "bg-red-500"
                  : "bg-green-500"
              }`}
            />

            <h2 className="text-xl font-bold text-white">
              Audit Alerts
            </h2>

          </div>

          <p className="mt-1 text-sm text-slate-400">
            Security and score-audit alerts requiring
            administrative attention.
          </p>

          {lastUpdated && (
            <p className="mt-2 text-xs text-slate-600">
              Updated {lastUpdated}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={loadData}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            Refresh
          </button>

          <Link
            href="/admin/audit/alerts"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            View All Alerts
          </Link>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 border-b border-slate-800 p-6 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Alerts
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {totalAlerts}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-yellow-400">
            Pending Review
          </p>

          <p className="mt-2 text-3xl font-bold text-yellow-300">
            {pendingAlerts}
          </p>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-red-400">
            High Severity
          </p>

          <p className="mt-2 text-3xl font-bold text-red-300">
            {highAlerts}
          </p>
        </div>

        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-green-400">
            Reviewed
          </p>

          <p className="mt-2 text-3xl font-bold text-green-300">
            {reviewedAlerts}
          </p>
        </div>

      </div>

      {/* CONTENT */}

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">

        {/* RECENT ALERTS */}

        <div>

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h3 className="font-bold text-white">
                Recent Alerts
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Latest detected audit activity.
              </p>
            </div>

            {totalAlerts > 5 && (
              <Link
                href="/admin/audit/alerts"
                className="text-sm font-semibold text-blue-400 hover:text-blue-300"
              >
                See all
              </Link>
            )}

          </div>

          {recentAlerts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">

              <div className="text-3xl">
                ✓
              </div>

              <p className="mt-3 font-semibold text-green-300">
                No audit alerts
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No suspicious audit activity has
                been detected.
              </p>

            </div>
          ) : (
            <div className="space-y-3">

              {recentAlerts.map(
                (alert) => {
                  const match =
                    findMatch(
                      alert.matchId
                    );

                  const event =
                    getAlertEvent(
                      alert
                    );

                  return (
                    <Link
                      key={alert.id}
                      href="/admin/audit/alerts"
                      className="block rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700 hover:bg-slate-900"
                    >

                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getSeverityClasses(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>

                            <span className="text-sm font-semibold text-white">
                              {alert.type}
                            </span>

                          </div>

                          <p className="mt-2 text-sm text-slate-300">
                            {event
                              ? getEventName(
                                  event
                                )
                              : "Event not found"}
                          </p>

                          <p className="mt-1 text-sm font-medium text-blue-300">
                            {getMatchName(
                              match
                            )}
                          </p>

                          <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                            {alert.reason}
                          </p>

                        </div>

                        <div className="shrink-0 text-left md:text-right">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              alert.status ===
                              "Pending Review"
                                ? "bg-yellow-500/10 text-yellow-300"
                                : alert.status ===
                                  "Reviewed"
                                ? "bg-green-500/10 text-green-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {alert.status}
                          </span>

                          <p className="mt-2 text-xs text-slate-600">
                            {formatDateTime(
                              alert.detectedAt
                            )}
                          </p>

                        </div>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* QUICK INSIGHT */}

        <div>

          <h3 className="font-bold text-white">
            Alert Overview
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Quick administrative insight.
          </p>

          <div className="mt-4 space-y-3">

            {/* PENDING */}

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">

              <p className="text-xs uppercase tracking-wide text-yellow-400">
                Requires Attention
              </p>

              <p className="mt-2 text-2xl font-bold text-yellow-300">
                {pendingAlerts}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                alert
                {pendingAlerts === 1
                  ? ""
                  : "s"} pending review
              </p>

            </div>

            {/* HIGH */}

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">

              <p className="text-xs uppercase tracking-wide text-red-400">
                High Severity
              </p>

              <p className="mt-2 text-2xl font-bold text-red-300">
                {highAlerts}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                high-risk alert
                {highAlerts === 1
                  ? ""
                  : "s"}
                detected
              </p>

            </div>

            {/* TOP INCHARGE */}

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">

              <p className="text-xs uppercase tracking-wide text-purple-400">
                Most Flagged In-Charge
              </p>

              {topIncharge ? (
                <>
                  <p className="mt-2 truncate font-bold text-purple-300">
                    {topIncharge.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {topIncharge.count} alert
                    {topIncharge.count === 1
                      ? ""
                      : "s"}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  No alert activity
                </p>
              )}

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}