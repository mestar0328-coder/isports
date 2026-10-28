 
"use client";

import { useEffect, useMemo, useState } from "react";
 
 
 
import {
 
  getAuditAlerts,
 
  type AuditAlert,
 
} from "@/data/auditAlertStorage";
 
 
 
import {
 
  getMatches,
 
  type StoredMatch,
 
} from "@/data/matchStorage";
 
 
 
import {
 
  getEvents,
 
} from "@/data/eventsStorage";
 
 
 
type EventItem = ReturnType<typeof getEvents>[number];
 
 
 
function getEventName(event: EventItem | undefined) {
 
  if (!event) return "Event not found";
 
 
 
  const eventRecord = event as EventItem & {
 
    name?: string;
 
    eventName?: string;
 
    title?: string;
 
  };
 
 
 
  return (
 
    eventRecord.name ||
 
    eventRecord.eventName ||
 
    eventRecord.title ||
 
    "Unnamed Event"
 
  );
 
}
 
 
 
function getMatchName(match: StoredMatch | undefined) {
 
  if (!match) return "Match not found";
 
 
 
  return `${match.teamA} vs ${match.teamB}`;
 
}
 
 
 
function formatDate(value: string) {
 
  if (!value) return "-";
 
 
 
  const date = new Date(value);
 
 
 
  if (Number.isNaN(date.getTime())) return value;
 
 
 
  return date.toLocaleString();
 
}
 
 
 
function getAgeInHours(value: string) {
 
  const detected = new Date(value).getTime();
 
 
 
  if (Number.isNaN(detected)) return 0;
 
 
 
  return Math.max(
 
    0,
 
    (Date.now() - detected) / (1000 * 60 * 60)
 
  );
 
}
 
 
 
function getAgeLabel(value: string) {
 
  const hours = getAgeInHours(value);
 
 
 
  if (hours < 1) {
 
    return "Less than 1 hour";
 
  }
 
 
 
  if (hours < 24) {
 
    return `${Math.floor(hours)}h`;
 
  }
 
 
 
  return `${Math.floor(hours / 24)}d`;
 
}
 
 
 
function getAlertEventId(
  alert: AuditAlert,
  matchMap: Map<string, StoredMatch>
) {
  return alert.eventId || matchMap.get(alert.matchId)?.eventId || "";
}
 
function downloadFile(
 
  filename: string,
 
  content: string,
 
  type: string
 
) {
 
  const blob = new Blob([content], { type });
 
  const url = URL.createObjectURL(blob);
 
 
 
  const link = document.createElement("a");
 
  link.href = url;
 
  link.download = filename;
 
  link.click();
 
 
 
  URL.revokeObjectURL(url);
 
}
 
 
 
function getPreviousPeriodDates(
 
  from: string,
 
  to: string
 
) {
 
  if (!from && !to) {
 
    return {
 
      from: "",
 
      to: "",
 
    };
 
  }
 
 
 
  const start = from
 
    ? new Date(`${from}T00:00:00`)
 
    : new Date(`${to}T00:00:00`);
 
 
 
  const end = to
 
    ? new Date(`${to}T23:59:59.999`)
 
    : new Date(`${from}T23:59:59.999`);
 
 
 
  const duration =
 
    end.getTime() - start.getTime();
 
 
 
  const previousEnd = new Date(
 
    start.getTime() - 1
 
  );
 
 
 
  const previousStart = new Date(
 
    start.getTime() - duration - 1
 
  );
 
 
 
  const formatDate = (date: Date) => {
 
    const year = date.getFullYear();
 
    const month = String(
 
      date.getMonth() + 1
 
    ).padStart(2, "0");
 
    const day = String(
 
      date.getDate()
 
    ).padStart(2, "0");
 
 
 
    return `${year}-${month}-${day}`;
 
  };
 
 
 
  return {
 
    from: formatDate(previousStart),
 
    to: formatDate(previousEnd),
 
  };
 
}
 
 
 
export default function AlertAnalyticsPage() {
 
  const [alerts, setAlerts] = useState<AuditAlert[]>([]);
 
  const [matches, setMatches] = useState<StoredMatch[]>([]);
 
  const [events, setEvents] = useState<EventItem[]>([]);
 
 
 
  const [dateFrom, setDateFrom] = useState("");
 
  const [dateTo, setDateTo] = useState("");
 
 
 
  const [appliedFrom, setAppliedFrom] = useState("");
 
  const [appliedTo, setAppliedTo] = useState("");
 
 
 
  const [lastUpdated, setLastUpdated] =
 
    useState<Date | null>(null);
 
 
 
  function loadAnalytics() {
 
    setAlerts(getAuditAlerts());
 
    setMatches(getMatches());
 
    setEvents(getEvents());
 
    setLastUpdated(new Date());
 
  }
 
 
 
  useEffect(() => {
 
    loadAnalytics();
 
 
 
    const interval = window.setInterval(() => {
 
      loadAnalytics();
 
    }, 30000);
 
 
 
    return () => {
 
      window.clearInterval(interval);
 
    };
 
  }, []);
 
 
 
  const filteredAlerts = useMemo(() => {
 
    return alerts.filter((alert) => {
 
      const detected = new Date(alert.detectedAt);
 
 
 
      if (Number.isNaN(detected.getTime())) {
 
        return false;
 
      }
 
 
 
      if (appliedFrom) {
 
        const from = new Date(`${appliedFrom}T00:00:00`);
 
 
 
        if (detected < from) {
 
          return false;
 
        }
 
      }
 
 
 
      if (appliedTo) {
 
        const to = new Date(`${appliedTo}T23:59:59.999`);
 
 
 
        if (detected > to) {
 
          return false;
 
        }
 
      }
 
 
 
      return true;
 
    });
 
  }, [alerts, appliedFrom, appliedTo]);
 
{/* PERIOD COMPARISON CALCULATION */}
 
 
 
  const previousPeriod = useMemo(() => {
 
  return getPreviousPeriodDates(
 
    appliedFrom,
 
    appliedTo
 
  );
 
}, [appliedFrom, appliedTo]);
 
 
 
const previousPeriodAlerts = useMemo(() => {
 
  if (!previousPeriod.from && !previousPeriod.to) {
 
    return [];
 
  }
 
 
 
  const from = previousPeriod.from
 
    ? new Date(
 
        `${previousPeriod.from}T00:00:00`
 
      )
 
    : null;
 
 
 
  const to = previousPeriod.to
 
    ? new Date(
 
        `${previousPeriod.to}T23:59:59.999`
 
      )
 
    : null;
 
 
 
  return alerts.filter((alert) => {
 
    const detected = new Date(
 
      alert.detectedAt
 
    );
 
 
 
    if (Number.isNaN(detected.getTime())) {
 
      return false;
 
    }
 
 
 
    if (from && detected < from) {
 
      return false;
 
    }
 
 
 
    if (to && detected > to) {
 
      return false;
 
    }
 
 
 
    return true;
 
  });
 
}, [alerts, previousPeriod]);
 
 
 
const currentPeriodCount =
 
  filteredAlerts.length;
 
 
 
const previousPeriodCount =
 
  previousPeriodAlerts.length;
 
 
 
const periodChange =
 
  currentPeriodCount -
 
  previousPeriodCount;
 
 
 
const periodChangePercent =
 
  previousPeriodCount === 0
 
    ? currentPeriodCount > 0
 
      ? 100
 
      : 0
 
    : (periodChange /
 
        previousPeriodCount) *
 
      100;
 
 
 
      {/* SEVERITY COMPARISON CALCULATION */}
 
 
 
       const severityComparison = useMemo(() => {
 
  const severities = ["High", "Medium", "Low"] as const;
 
 
 
  return severities.map((severity) => {
 
    const current = filteredAlerts.filter(
 
      (alert) => alert.severity === severity
 
    ).length;
 
 
 
    const previous = previousPeriodAlerts.filter(
 
      (alert) => alert.severity === severity
 
    ).length;
 
 
 
    const change = current - previous;
 
 
 
    const changePercent =
 
      previous === 0
 
        ? current > 0
 
          ? 100
 
          : 0
 
        : (change / previous) * 100;
 
 
 
    return {
 
      severity,
 
      current,
 
      previous,
 
      change,
 
      changePercent,
 
    };
 
  });
 
}, [filteredAlerts, previousPeriodAlerts]);
 
 
 
{/* ALERT TYPE COMPARISON CALCULATION */}
 
  const alertTypeComparison = useMemo(() => {
 
    const types = [
 
      "Repeated Corrections",
 
      "Rapid Corrections",
 
      "High Correction Activity",
 
    ] as const;
 
 
 
    return types.map((type) => {
 
      const current = filteredAlerts.filter(
 
        (alert) => alert.type === type
 
      ).length;
 
 
 
      const previous = previousPeriodAlerts.filter(
 
        (alert) => alert.type === type
 
      ).length;
 
 
 
      const change = current - previous;
 
 
 
      const changePercent =
 
        previous === 0
 
          ? current > 0
 
            ? 100
 
            : 0
 
          : (change / previous) * 100;
 
 
 
      return {
 
        type,
 
        current,
 
        previous,
 
        change,
 
        changePercent,
 
      };
 
    });
 
  }, [filteredAlerts, previousPeriodAlerts]);
 
 
 
  {/* =========================================================
 
   IN-CHARGE COMPARISON — CURRENT VS PREVIOUS PERIOD
 
   ========================================================= */}
 
 
 
const inChargeComparison = useMemo(() => {
 
  const names = new Set<string>();
 
 
 
  filteredAlerts.forEach((alert) => {
 
    names.add(alert.performedBy);
 
  });
 
 
 
  previousPeriodAlerts.forEach((alert) => {
 
    names.add(alert.performedBy);
 
  });
 
 
 
  return Array.from(names)
 
    .map((name) => {
 
      const current = filteredAlerts.filter(
 
        (alert) => alert.performedBy === name
 
      ).length;
 
 
 
      const previous = previousPeriodAlerts.filter(
 
        (alert) => alert.performedBy === name
 
      ).length;
 
 
 
      const change = current - previous;
 
 
 
      const changePercent =
 
        previous === 0
 
          ? current > 0
 
            ? 100
 
            : 0
 
          : (change / previous) * 100;
 
 
 
      return {
 
        name,
 
        current,
 
        previous,
 
        change,
 
        changePercent,
 
      };
 
    })
 
    .sort((a, b) => b.current - a.current);
 
}, [filteredAlerts, previousPeriodAlerts]);
 
 
 
{/* =========================================================
 
   EVENT COMPARISON — CURRENT VS PREVIOUS PERIOD
 
   ========================================================= */}
 
 
 
const eventComparison = useMemo(() => {
 
  const eventIds = new Set<string>();
 
 
 
  filteredAlerts.forEach((alert) => {
 
    if (alert.eventId) {
 
      eventIds.add(alert.eventId);
 
    }
 
  });
 
 
 
  previousPeriodAlerts.forEach((alert) => {
 
    if (alert.eventId) {
 
      eventIds.add(alert.eventId);
 
    }
 
  });
 
 
 
  return Array.from(eventIds)
 
    .map((eventId) => {
 
      const event = events.find(
 
        (item) => item.id === eventId
 
      );
 
 
 
      const current = filteredAlerts.filter(
 
        (alert) => getAlertEventId(alert, matchMap) === eventId
 
      ).length;
 
 
 
      const previous = previousPeriodAlerts.filter(
 
        (alert) => getAlertEventId(alert, matchMap) === eventId
 
      ).length;
 
 
 
      const change = current - previous;
 
 
 
      const changePercent =
 
        previous === 0
 
          ? current > 0
 
            ? 100
 
            : 0
 
          : (change / previous) * 100;
 
 
 
      return {
 
        eventId,
 
        eventName: getEventName(event),
 
        current,
 
        previous,
 
        change,
 
        changePercent,
 
      };
 
    })
 
    .sort((a, b) => b.current - a.current);
 
}, [
 
  filteredAlerts,
 
  previousPeriodAlerts,
 
  events,
 
]);
 
 
 
{/* =========================================================
 
   MATCH COMPARISON — CURRENT VS PREVIOUS PERIOD
 
   ========================================================= */}
 
 
 
const matchComparison = useMemo(() => {
 
  const matchIds = new Set<string>();
 
 
 
  filteredAlerts.forEach((alert) => {
 
    if (alert.matchId) {
 
      matchIds.add(alert.matchId);
 
    }
 
  });
 
 
 
  previousPeriodAlerts.forEach((alert) => {
 
    if (alert.matchId) {
 
      matchIds.add(alert.matchId);
 
    }
 
  });
 
 
 
  return Array.from(matchIds)
 
    .map((matchId) => {
 
      const match = matches.find(
 
        (item) => item.id === matchId
 
      );
 
 
 
      const current = filteredAlerts.filter(
 
        (alert) => alert.matchId === matchId
 
      ).length;
 
 
 
      const previous = previousPeriodAlerts.filter(
 
        (alert) => alert.matchId === matchId
 
      ).length;
 
 
 
      const change = current - previous;
 
 
 
      const changePercent =
 
        previous === 0
 
          ? current > 0
 
            ? 100
 
            : 0
 
          : (change / previous) * 100;
 
 
 
      return {
 
        matchId,
 
        matchName: getMatchName(match),
 
        current,
 
        previous,
 
        change,
 
        changePercent,
 
      };
 
    })
 
    .sort((a, b) => b.current - a.current);
 
}, [
 
  filteredAlerts,
 
  previousPeriodAlerts,
 
  matches,
 
]);
 
{/* =========================================================
 
   COMPARISON SUMMARY — CURRENT VS PREVIOUS PERIOD
 
   ========================================================= */}
 
 
 
const currentHighSeverity = filteredAlerts.filter(
 
  (alert) => alert.severity === "High"
 
).length;
 
 
 
const previousHighSeverity =
 
  previousPeriodAlerts.filter(
 
    (alert) => alert.severity === "High"
 
  ).length;
 
 
 
const currentPendingReview = filteredAlerts.filter(
 
  (alert) => alert.status === "Pending Review"
 
).length;
 
 
 
const previousPendingReview =
 
  previousPeriodAlerts.filter(
 
    (alert) => alert.status === "Pending Review"
 
  ).length;
 
 
 
const highSeverityChange =
 
  currentHighSeverity - previousHighSeverity;
 
 
 
const pendingReviewChange =
 
  currentPendingReview - previousPendingReview;
 
 
 
  {/* =========================================================
 
   AUDIT HEALTH INDICATOR — CALCULATION
 
   ========================================================= */}
 
 
 
const auditHealth = useMemo(() => {
 
  const highSeverity = filteredAlerts.filter(
 
    (alert) => alert.severity === "High"
 
  ).length;
 
 
 
  const pendingReview = filteredAlerts.filter(
 
    (alert) => alert.status === "Pending Review"
 
  ).length;
 
 
 
  if (highSeverity >= 5 || pendingReview >= 10) {
 
    return {
 
      label: "Critical",
 
      description:
 
        "High alert activity or a large pending review backlog requires immediate attention.",
 
      className:
 
        "bg-red-50 text-red-700 border-red-200",
 
    };
 
  }
 
 
 
  if (highSeverity > 0 || pendingReview > 0) {
 
    return {
 
      label: "Attention Needed",
 
      description:
 
        "Some audit alerts require review or monitoring.",
 
      className:
 
        "bg-yellow-50 text-yellow-700 border-yellow-200",
 
    };
 
  }
 
 
 
  return {
 
    label: "Healthy",
 
    description:
 
      "No high-severity alerts or pending review backlog detected.",
 
    className:
 
      "bg-green-50 text-green-700 border-green-200",
 
  };
 
}, [filteredAlerts]);
 
 
 
{/* =========================================================
 
   PREVIOUS AUDIT HEALTH — CALCULATION
 
   ========================================================= */}
 
 
 
const previousAuditHealth = useMemo(() => {
 
  const highSeverity = previousPeriodAlerts.filter(
 
    (alert) => alert.severity === "High"
 
  ).length;
 
 
 
  const pendingReview = previousPeriodAlerts.filter(
 
    (alert) => alert.status === "Pending Review"
 
  ).length;
 
 
 
  if (highSeverity >= 5 || pendingReview >= 10) {
 
    return "Critical";
 
  }
 
 
 
  if (highSeverity > 0 || pendingReview > 0) {
 
    return "Attention Needed";
 
  }
 
 
 
  return "Healthy";
 
}, [previousPeriodAlerts]);
 
 
 
{/* =========================================================
 
   AUDIT HEALTH TREND — CALCULATION
 
   ========================================================= */}
 
 
 
const auditHealthTrend = useMemo(() => {
 
  const rank: Record<string, number> = {
 
    Healthy: 1,
 
    "Attention Needed": 2,
 
    Critical: 3,
 
  };
 
 
 
  const currentRank = rank[auditHealth.label];
 
  const previousRank = rank[previousAuditHealth];
 
 
 
  if (currentRank < previousRank) {
 
    return {
 
      label: "Improved",
 
      className: "text-green-600",
 
    };
 
  }
 
 
 
  if (currentRank > previousRank) {
 
    return {
 
      label: "Worsened",
 
      className: "text-red-600",
 
    };
 
  }
 
 
 
  return {
 
    label: "Stable",
 
    className: "text-gray-600",
 
  };
 
}, [auditHealth.label, previousAuditHealth]);
 
 
 
{/* =========================================================
 
   DAILY ALERT TREND — CALCULATION
 
   ========================================================= */}
 
 
 
const dailyAlertTrend = useMemo(() => {
 
  const counts = new Map<string, number>();
 
 
 
  filteredAlerts.forEach((alert) => {
 
    const detected = new Date(alert.detectedAt);
 
 
 
    if (Number.isNaN(detected.getTime())) {
 
      return;
 
    }
 
 
 
    const year = detected.getFullYear();
 
    const month = String(
 
      detected.getMonth() + 1
 
    ).padStart(2, "0");
 
    const day = String(
 
      detected.getDate()
 
    ).padStart(2, "0");
 
 
 
    const key = `${year}-${month}-${day}`;
 
 
 
    counts.set(
 
      key,
 
      (counts.get(key) || 0) + 1
 
    );
 
  });
 
 
 
  return Array.from(counts.entries())
 
    .map(([date, count]) => ({
 
      date,
 
      count,
 
    }))
 
    .sort((a, b) =>
 
      a.date.localeCompare(b.date)
 
    );
 
}, [filteredAlerts]);
 
 
 
{/* =========================================================
 
   WEEKLY ALERT TREND — CALCULATION
 
   ========================================================= */}
 
 
 
const weeklyAlertTrend = useMemo(() => {
 
  const counts = new Map<string, number>();
 
 
 
  filteredAlerts.forEach((alert) => {
 
    const detected = new Date(alert.detectedAt);
 
 
 
    if (Number.isNaN(detected.getTime())) {
 
      return;
 
    }
 
 
 
    const weekStart = new Date(detected);
 
    const day = weekStart.getDay();
 
 
 
    const daysSinceMonday =
 
      day === 0 ? 6 : day - 1;
 
 
 
    weekStart.setDate(
 
      weekStart.getDate() - daysSinceMonday
 
    );
 
 
 
    weekStart.setHours(0, 0, 0, 0);
 
 
 
    const year = weekStart.getFullYear();
 
    const month = String(
 
      weekStart.getMonth() + 1
 
    ).padStart(2, "0");
 
    const date = String(
 
      weekStart.getDate()
 
    ).padStart(2, "0");
 
 
 
    const key = `${year}-${month}-${date}`;
 
 
 
    counts.set(
 
      key,
 
      (counts.get(key) || 0) + 1
 
    );
 
  });
 
 
 
  return Array.from(counts.entries())
 
    .map(([weekStart, count]) => ({
 
      weekStart,
 
      count,
 
    }))
 
    .sort((a, b) =>
 
      a.weekStart.localeCompare(b.weekStart)
 
    );
 
}, [filteredAlerts]);
 
 
 
{/* =========================================================
 
   PEAK ALERT DAY / TIME — CALCULATION
 
   ========================================================= */}
 
 
 
const peakAlertAnalysis = useMemo(() => {
 
  const dayCounts = new Map<string, number>();
 
  const hourCounts = new Map<number, number>();
 
 
 
  filteredAlerts.forEach((alert) => {
 
    const detected = new Date(alert.detectedAt);
 
 
 
    if (Number.isNaN(detected.getTime())) {
 
      return;
 
    }
 
 
 
    const dayName = detected.toLocaleDateString(
 
      undefined,
 
      {
 
        weekday: "long",
 
      }
 
    );
 
 
 
    const hour = detected.getHours();
 
 
 
    dayCounts.set(
 
      dayName,
 
      (dayCounts.get(dayName) || 0) + 1
 
    );
 
 
 
    hourCounts.set(
 
      hour,
 
      (hourCounts.get(hour) || 0) + 1
 
    );
 
  });
 
const peakDay = Array.from(dayCounts.entries())
 
    .sort((a, b) => b[1] - a[1])[0];
 
 
 
  const peakHour = Array.from(hourCounts.entries())
 
    .sort((a, b) => b[1] - a[1])[0];
 
 
 
  const formatHour = (hour: number) => {
 
    const suffix = hour >= 12 ? "PM" : "AM";
 
    const displayHour =
 
      hour % 12 === 0 ? 12 : hour % 12;
 
 
 
    return `${displayHour}:00 ${suffix}`;
 
  };
 
 
 
  return {
 
    peakDay: peakDay
 
      ? {
 
          day: peakDay[0],
 
          count: peakDay[1],
 
        }
 
      : null,
 
 
 
    peakHour: peakHour
 
      ? {
 
          hour: peakHour[0],
 
          label: formatHour(peakHour[0]),
 
          count: peakHour[1],
 
        }
 
      : null,
 
  };
 
}, [filteredAlerts]);
 
 
 
{/* =========================================================
 
   PENDING REVIEW AGEING — CALCULATION
 
   ========================================================= */}
 
 
 
const pendingReviewAgeing = useMemo(() => {
 
  const buckets = [
 
    {
 
      label: "Less than 1 hour",
 
      minHours: 0,
 
      maxHours: 1,
 
    },
 
    {
 
      label: "1–6 hours",
 
      minHours: 1,
 
      maxHours: 6,
 
    },
 
    {
 
      label: "6–24 hours",
 
      minHours: 6,
 
      maxHours: 24,
 
    },
 
    {
 
      label: "1–3 days",
 
      minHours: 24,
 
      maxHours: 72,
 
    },
 
    {
 
      label: "3+ days",
 
      minHours: 72,
 
      maxHours: Infinity,
 
    },
 
  ];
 
 
 
  return buckets.map((bucket) => {
 
    const count = filteredAlerts.filter((alert) => {
 
      if (alert.status !== "Pending Review") {
 
        return false;
 
      }
 
 
 
      const hours = getAgeInHours(alert.detectedAt);
 
 
 
      return (
 
        hours >= bucket.minHours &&
 
        hours < bucket.maxHours
 
      );
 
    }).length;
 
 
 
    return {
 
      ...bucket,
 
      count,
 
    };
 
  });
 
}, [filteredAlerts]);
 
 
 
{/* =========================================================
 
   TOP RISK IN-CHARGES — CALCULATION
 
   ========================================================= */}
 
 
 
const topRiskInCharges = useMemo(() => {
 
  const names = new Set<string>();
 
 
 
  filteredAlerts.forEach((alert) => {
 
    if (alert.performedBy) {
 
      names.add(alert.performedBy);
 
    }
 
  });
 
 
 
  return Array.from(names)
 
    .map((name) => {
 
      const personAlerts = filteredAlerts.filter(
 
        (alert) => alert.performedBy === name
 
      );
 
 
 
      const totalAlerts = personAlerts.length;
 
 
 
      const highSeverity = personAlerts.filter(
 
        (alert) => alert.severity === "High"
 
      ).length;
 
 
 
      const pendingReview = personAlerts.filter(
 
        (alert) => alert.status === "Pending Review"
 
      ).length;
 
 
 
      const riskScore =
 
        totalAlerts +
 
        highSeverity * 3 +
 
        pendingReview * 2;
 
 
 
      let riskLevel = "Low";
 
 
 
      if (riskScore >= 10) {
 
        riskLevel = "High";
 
      } else if (riskScore >= 5) {
 
        riskLevel = "Medium";
 
      }
 
 
 
      return {
 
        name,
 
        totalAlerts,
 
        highSeverity,
 
        pendingReview,
 
        riskScore,
 
        riskLevel,
 
      };
 
    })
 
    .sort((a, b) => {
 
      if (b.riskScore !== a.riskScore) {
 
        return b.riskScore - a.riskScore;
 
      }
 
 
 
      return b.totalAlerts - a.totalAlerts;
 
    });
 
}, [filteredAlerts]);
 
 
 
{/* =========================================================
 
   TOP RISK EVENTS — CALCULATION
 
   ========================================================= */}
 
 
 
const topRiskEvents = useMemo(() => {
 
  const eventIds = new Set<string>();
 
 
 
  filteredAlerts.forEach((alert) => {
 
    if (alert.eventId) {
 
      eventIds.add(alert.eventId);
 
    }
 
  });
 
 
 
  return Array.from(eventIds)
 
    .map((eventId) => {
 
      const event = events.find(
 
        (item) => item.id === eventId
 
      );
 
 
 
      const eventAlerts = filteredAlerts.filter(
 
        (alert) => alert.eventId === eventId
 
      );
 
 
 
      const totalAlerts = eventAlerts.length;
 
 
 
      const highSeverity = eventAlerts.filter(
 
        (alert) => alert.severity === "High"
 
      ).length;
 
 
 
      const pendingReview = eventAlerts.filter(
 
        (alert) => alert.status === "Pending Review"
 
      ).length;
 
 
 
      const riskScore =
 
        totalAlerts +
 
        highSeverity * 3 +
 
        pendingReview * 2;
 
 
 
      let riskLevel = "Low";
 
 
 
      if (riskScore >= 10) {
 
        riskLevel = "High";
 
      } else if (riskScore >= 5) {
 
        riskLevel = "Medium";
 
      }
 
 
 
      return {
 
        eventId,
 
        eventName: getEventName(event),
 
        totalAlerts,
 
        highSeverity,
 
        pendingReview,
 
        riskScore,
 
        riskLevel,
 
      };
 
    })
 
    .sort((a, b) => {
 
      if (b.riskScore !== a.riskScore) {
 
        return b.riskScore - a.riskScore;
 
      }
 
 
 
      return b.totalAlerts - a.totalAlerts;
 
    });
 
}, [filteredAlerts, events]);
 
 
 
{/* =========================================================
 
   TOP RISK MATCHES — CALCULATION
 
   ========================================================= */}
 
 
 
const topRiskMatches = useMemo(() => {
 
  const matchIds = new Set<string>();
 
 
 
  filteredAlerts.forEach((alert) => {
 
    if (alert.matchId) {
 
      matchIds.add(alert.matchId);
 
    }
 
  });
 
 
 
  return Array.from(matchIds)
 
    .map((matchId) => {
 
      const match = matches.find(
 
        (item) => item.id === matchId
 
      );
 
 
 
      const matchAlerts = filteredAlerts.filter(
 
        (alert) => alert.matchId === matchId
 
      );
 
 
 
      const totalAlerts = matchAlerts.length;
 
 
 
      const highSeverity = matchAlerts.filter(
 
        (alert) => alert.severity === "High"
 
      ).length;
 
 
 
      const pendingReview = matchAlerts.filter(
 
        (alert) => alert.status === "Pending Review"
 
      ).length;
 
 
 
      const riskScore =
 
        totalAlerts +
 
        highSeverity * 3 +
 
        pendingReview * 2;
 
 
 
      let riskLevel = "Low";
 
 
 
      if (riskScore >= 10) {
 
        riskLevel = "High";
 
      } else if (riskScore >= 5) {
 
        riskLevel = "Medium";
 
      }
 
 
 
      return {
 
        matchId,
 
        matchName: getMatchName(match),
 
        totalAlerts,
 
        highSeverity,
 
        pendingReview,
 
        riskScore,
 
        riskLevel,
 
      };
 
    })
 
    .sort((a, b) => {
 
      if (b.riskScore !== a.riskScore) {
 
        return b.riskScore - a.riskScore;
 
      }
 
 
 
      return b.totalAlerts - a.totalAlerts;
 
    });
 
}, [filteredAlerts, matches]);
 
 
 
  {/* MAPPING EVENTS AND MATCHES */}
 
 
 
  const eventMap = useMemo(() => {
 
    const map = new Map<string, EventItem>();
 
 
 
    events.forEach((event) => {
 
      map.set(event.id, event);
 
    });
 
 
 
    return map;
 
  }, [events]);
 
 
 
  const matchMap = useMemo(() => {
 
    const map = new Map<string, StoredMatch>();
 
 
 
    matches.forEach((match) => {
 
      map.set(match.id, match);
 
    });
 
 
 
    return map;
 
  }, [matches]);
 
 
 
  const severityCounts = useMemo(() => {
 
    return {
 
      Low: filteredAlerts.filter(
 
        (item) => item.severity === "Low"
 
      ).length,
 
 
 
      Medium: filteredAlerts.filter(
 
        (item) => item.severity === "Medium"
 
      ).length,
 
 
 
      High: filteredAlerts.filter(
 
        (item) => item.severity === "High"
 
      ).length,
 
    };
 
  }, [filteredAlerts]);
 
 
 
  const typeCounts = useMemo(() => {
 
    const counts: Record<string, number> = {};
 
 
 
    filteredAlerts.forEach((alert) => {
 
      counts[alert.type] =
 
        (counts[alert.type] || 0) + 1;
 
    });
 
 
 
    return Object.entries(counts).sort(
 
      (a, b) => b[1] - a[1]
 
    );
 
  }, [filteredAlerts]);
 
 
 
  const statusCounts = useMemo(() => {
 
    const counts: Record<string, number> = {};
 
 
 
    filteredAlerts.forEach((alert) => {
 
      counts[alert.status] =
 
        (counts[alert.status] || 0) + 1;
 
    });
 
 
 
    return Object.entries(counts).sort(
 
      (a, b) => b[1] - a[1]
 
    );
 
  }, [filteredAlerts]);
 
 
 
  const inchargeCounts = useMemo(() => {
 
    const counts: Record<string, number> = {};
 
 
 
    filteredAlerts.forEach((alert) => {
 
      counts[alert.performedBy] =
 
        (counts[alert.performedBy] || 0) + 1;
 
    });
 
 
 
    return Object.entries(counts)
 
      .sort((a, b) => b[1] - a[1])
 
      .slice(0, 10);
 
  }, [filteredAlerts]);
 
 
 
  const eventCounts = useMemo(() => {
 
    const counts: Record<string, number> = {};
 
 
 
    filteredAlerts.forEach((alert) => {
 
      const eventId =
 
        alert.eventId ||
 
        matchMap.get(alert.matchId)?.eventId ||
 
        "unknown";
 
 
 
      counts[eventId] =
 
        (counts[eventId] || 0) + 1;
 
    });
 
 
 
    return Object.entries(counts)
 
      .sort((a, b) => b[1] - a[1])
 
      .slice(0, 10);
 
  }, [filteredAlerts, matchMap]);
 
 
 
  const matchCounts = useMemo(() => {
 
    const counts: Record<string, number> = {};
 
 
 
    filteredAlerts.forEach((alert) => {
 
      counts[alert.matchId] =
 
        (counts[alert.matchId] || 0) + 1;
 
    });
 
 
 
    return Object.entries(counts)
 
      .sort((a, b) => b[1] - a[1])
 
      .slice(0, 10);
 
  }, [filteredAlerts]);
 
 
 
  const dateCounts = useMemo(() => {
 
    const counts: Record<string, number> = {};
 
 
 
    filteredAlerts.forEach((alert) => {
 
      const date = new Date(alert.detectedAt);
 
 
 
      if (Number.isNaN(date.getTime())) return;
 
 
 
      const key = date.toLocaleDateString();
 
 
 
      counts[key] =
 
        (counts[key] || 0) + 1;
 
    });
 
 
 
    return Object.entries(counts).sort(
 
      (a, b) =>
 
        new Date(a[0]).getTime() -
 
        new Date(b[0]).getTime()
 
    );
 
  }, [filteredAlerts]);
 
 
 
  const pendingAlerts = useMemo(() => {
 
    return filteredAlerts
 
      .filter(
 
        (alert) =>
 
          alert.status === "Pending Review"
 
      )
 
      .sort(
 
        (a, b) =>
 
          new Date(a.detectedAt).getTime() -
 
          new Date(b.detectedAt).getTime()
 
      );
 
  }, [filteredAlerts]);
 
 
 
  const highSeverityPercentage =
 
    filteredAlerts.length > 0
 
      ? (
 
          (severityCounts.High /
 
            filteredAlerts.length) *
 
          100
 
        ).toFixed(1)
 
      : "0.0";
 
 
 
  const averagePendingAge = useMemo(() => {
 
    if (pendingAlerts.length === 0) return 0;
 
 
 
    const total = pendingAlerts.reduce(
 
      (sum, alert) =>
 
        sum + getAgeInHours(alert.detectedAt),
 
      0
 
    );
 
 
 
    return total / pendingAlerts.length;
 
  }, [pendingAlerts]);
 
 
 
  function applyDateFilter() {
 
    if (dateFrom && dateTo && dateFrom > dateTo) {
 
      alert("Date From cannot be after Date To.");
 
      return;
 
    }
 
 
 
    setAppliedFrom(dateFrom);
 
    setAppliedTo(dateTo);
 
  }
 
 
 
  function applyPreset(preset: string) {
 
  const today = new Date();
 
 
 
  const formatInputDate = (date: Date) => {
 
    const year = date.getFullYear();
 
    const month = String(date.getMonth() + 1).padStart(2, "0");
 
    const day = String(date.getDate()).padStart(2, "0");
 
 
 
    return `${year}-${month}-${day}`;
 
  };
 
 
 
  if (preset === "today") {
 
    const value = formatInputDate(today);
 
 
 
    setDateFrom(value);
 
    setDateTo(value);
 
    setAppliedFrom(value);
 
    setAppliedTo(value);
 
    return;
 
  }
 
 
 
  if (preset === "7days") {
 
    const from = new Date(today);
 
    from.setDate(today.getDate() - 6);
 
 
 
    const fromValue = formatInputDate(from);
 
    const toValue = formatInputDate(today);
 
 
 
    setDateFrom(fromValue);
 
    setDateTo(toValue);
 
    setAppliedFrom(fromValue);
 
    setAppliedTo(toValue);
 
    return;
 
  }
 
 
 
  if (preset === "30days") {
 
    const from = new Date(today);
 
    from.setDate(today.getDate() - 29);
 
 
 
    const fromValue = formatInputDate(from);
 
    const toValue = formatInputDate(today);
 
 
 
    setDateFrom(fromValue);
 
    setDateTo(toValue);
 
    setAppliedFrom(fromValue);
 
    setAppliedTo(toValue);
 
    return;
 
  }
 
 
 
  if (preset === "month") {
 
    const from = new Date(
 
      today.getFullYear(),
 
      today.getMonth(),
 
      1
 
    );
 
 
 
    const fromValue = formatInputDate(from);
 
    const toValue = formatInputDate(today);
 
 
 
    setDateFrom(fromValue);
 
    setDateTo(toValue);
 
    setAppliedFrom(fromValue);
 
    setAppliedTo(toValue);
 
    return;
 
  }
 
 
 
  if (preset === "all") {
 
    clearDateFilter();
 
  }
 
}
 
 
 
  function clearDateFilter() {
 
    setDateFrom("");
 
    setDateTo("");
 
    setAppliedFrom("");
 
    setAppliedTo("");
 
  }
 
   
 
  {/* =========================================================
 
   ANALYTICS CSV EXPORT
 
   ========================================================= */}
 
 
 
function exportAnalyticsCsv() {
 
  const rows = [
 
    ["Metric", "Value"],
 
 
 
    ["Total Alerts", filteredAlerts.length],
 
 
 
    ["High Severity", currentHighSeverity],
 
 
 
    ["Pending Review", currentPendingReview],
 
 
 
    ["Previous Period Alerts", previousPeriodCount],
 
 
 
    ["Period Change", periodChange],
 
 
 
    [
 
      "Period Change %",
 
      `${periodChangePercent.toFixed(1)}%`,
 
    ],
 
 
 
    [
 
      "Peak Alert Day",
 
      peakAlertAnalysis.peakDay?.day || "-",
 
    ],
 
 
 
    [
 
      "Peak Alert Day Count",
 
      peakAlertAnalysis.peakDay?.count || 0,
 
    ],
 
 
 
    [
 
      "Peak Alert Hour",
 
      peakAlertAnalysis.peakHour?.label || "-",
 
    ],
 
 
 
    [
 
      "Peak Alert Hour Count",
 
      peakAlertAnalysis.peakHour?.count || 0,
 
    ],
 
 
 
    [
 
      "Audit Health",
 
      auditHealth.label,
 
    ],
 
 
 
    [
 
      "Audit Health Trend",
 
      auditHealthTrend.label,
 
    ],
 
 
 
    [],
 
 
 
    ["Pending Review Ageing", "Count"],
 
 
 
    ...pendingReviewAgeing.map((item) => [
 
      item.label,
 
      item.count,
 
    ]),
 
 
 
    [],
 
 
 
    [
 
      "Top Risk In-Charge",
 
      "Total Alerts",
 
      "High Severity",
 
      "Pending Review",
 
      "Risk Score",
 
      "Risk Level",
 
    ],
 
 
 
    ...topRiskInCharges.slice(0, 10).map((item) => [
 
      item.name,
 
      item.totalAlerts,
 
      item.highSeverity,
 
      item.pendingReview,
 
      item.riskScore,
 
      item.riskLevel,
 
    ]),
 
 
 
    [],
 
 
 
    [
 
      "Top Risk Event",
 
      "Total Alerts",
 
      "High Severity",
 
      "Pending Review",
 
      "Risk Score",
 
      "Risk Level",
 
    ],
 
 
 
    ...topRiskEvents.slice(0, 10).map((item) => [
 
      item.eventName,
 
      item.totalAlerts,
 
      item.highSeverity,
 
      item.pendingReview,
 
      item.riskScore,
 
      item.riskLevel,
 
    ]),
 
 
 
    [],
 
 
 
    [
 
      "Top Risk Match",
 
      "Total Alerts",
 
      "High Severity",
 
      "Pending Review",
 
      "Risk Score",
 
      "Risk Level",
 
    ],
 
 
 
    ...topRiskMatches.slice(0, 10).map((item) => [
 
      item.matchName,
 
      item.totalAlerts,
 
      item.highSeverity,
 
      item.pendingReview,
 
      item.riskScore,
 
      item.riskLevel,
 
    ]),
 
  ];
 
 
 
  const csv = rows
 
    .map((row) =>
 
      row
 
        .map((value) => {
 
          const text = String(value ?? "");
 
 
 
          return `"${text.replace(/"/g, '""')}"`;
 
        })
 
        .join(",")
 
    )
 
    .join("\n");
 
 
 
  downloadFile(
 
    "isports-alert-analytics.csv",
 
    csv,
 
    "text/csv;charset=utf-8"
 
  );
 
}
 
  
 
  {/* =========================================================
 
   ANALYTICS JSON EXPORT
 
   ========================================================= */}
 
 
 
function exportAnalyticsJson() {
 
  const exportData = {
 
    generatedAt: new Date().toISOString(),
 
 
 
    filters: {
 
      from: appliedFrom || null,
 
      to: appliedTo || null,
 
    },
 
 
 
    summary: {
 
      totalAlerts: filteredAlerts.length,
 
      highSeverity: currentHighSeverity,
 
      pendingReview: currentPendingReview,
 
      previousPeriodAlerts: previousPeriodCount,
 
      periodChange,
 
      periodChangePercent,
 
      auditHealth: auditHealth.label,
 
      auditHealthTrend: auditHealthTrend.label,
 
    },
 
 
 
    peakAlertPeriod: {
 
      day: peakAlertAnalysis.peakDay,
 
      hour: peakAlertAnalysis.peakHour,
 
    },
 
 
 
    pendingReviewAgeing,
 
 
 
    severityComparison,
 
 
 
    alertTypeComparison,
 
 
 
    inChargeComparison,
 
 
 
    eventComparison,
 
 
 
    matchComparison,
 
 
 
    dailyAlertTrend,
 
 
 
    weeklyAlertTrend,
 
 
 
    topRiskInCharges,
 
 
 
    topRiskEvents,
 
 
 
    topRiskMatches,
 
  };
 
 
 
  downloadFile(
 
    "isports-alert-analytics.json",
 
    JSON.stringify(exportData, null, 2),
 
    "application/json;charset=utf-8"
 
  );
 
}
 
 
 
 return (
 
  <main className="min-h-screen overflow-x-hidden bg-gray-50 p-4 sm:p-6">
 
 
 
    {/* =========================================================
 
       RESPONSIVE PAGE CONTAINER
 
       ========================================================= */}
 
 
 
    <div className="mx-auto w-full max-w-7xl space-y-6 px-0 sm:px-2 lg:px-4">
 
 
 
     {/* =========================================================
 
   ANALYTICS DASHBOARD HEADER — RESPONSIVE
 
   ========================================================= */}
 
 
 
<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 
  <div className="min-w-0">
 
    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
 
      Alert Analytics
 
    </h1>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Audit alert trends, severity, activity and pending review analysis.
 
    </p>
 
{lastUpdated && (
 
      <p className="mt-2 text-xs text-gray-400">
 
        Last updated:{" "}
 
        {lastUpdated.toLocaleString()}
 
      </p>
 
    )}
 
  </div>
 
 
 
  <div className="flex w-full flex-wrap gap-2 lg:w-auto">
 
    <a
 
      href="/admin/audit/alerts"
 
      className="flex-1 rounded-lg border bg-white px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 sm:flex-none sm:px-4"
 
    >
 
      Alert Management
 
    </a>
 
 
 
    <a
 
      href="/admin/audit"
 
      className="flex-1 rounded-lg border bg-white px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 sm:flex-none sm:px-4"
 
    >
 
      Audit
 
    </a>
 
 
 
    <button type="button"
 
      onClick={loadAnalytics}
 
      className="flex-1 rounded-lg border bg-white px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 sm:flex-none sm:px-4"
 
    >
 
      Refresh
 
    </button>
 
 
 
    <button type="button"
 
      onClick={exportAnalyticsCsv}
 
      className="flex-1 rounded-lg bg-black px-3 py-2 text-center text-sm font-medium text-white hover:bg-gray-800 sm:flex-none sm:px-4"
 
    >
 
      Export CSV
 
    </button>
 
 
 
    <button type="button"
 
      onClick={exportAnalyticsJson}
 
      className="flex-1 rounded-lg border bg-white px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 sm:flex-none sm:px-4"
 
    >
 
      Export JSON
 
    </button>
 
  </div>
 
</div>
 
 
 
       {/* =========================================================
 
   ANALYTICS FILTERS — RESPONSIVE
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
 
 
 
    <div>
 
      <label className="mb-2 block text-sm font-medium text-gray-700">
 
        Date From
 
      </label>
 
 
 
      <input
 
        type="date"
 
        value={dateFrom}
 
        onChange={(e) =>
 
          setDateFrom(e.target.value)
 
        }
 
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
 
      />
 
    </div>
 
 
 
    <div>
 
      <label className="mb-2 block text-sm font-medium text-gray-700">
 
        Date To
 
      </label>
 
 
 
      <input
 
        type="date"
 
        value={dateTo}
 
        onChange={(e) =>
 
          setDateTo(e.target.value)
 
        }
 
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
 
      />
 
    </div>
 
 
 
    <div className="md:col-span-2">
 
      <p className="mb-2 text-sm font-medium text-gray-700">
 
        Quick Range
 
      </p>
 
 
 
      <div className="flex flex-wrap gap-2">
 
        <button type="button"
 
          onClick={() => applyPreset("today")}
 
          className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:px-4"
 
        >
 
          Today
 
        </button>
 
 
 
        <button type="button"
 
          onClick={() => applyPreset("7days")}
 
          className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:px-4"
 
        >
 
          Last 7 Days
 
        </button>
 
 
 
        <button type="button"
 
          onClick={() => applyPreset("30days")}
 
          className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:px-4"
 
        >
 
          Last 30 Days
 
        </button>
 
 
 
        <button type="button"
 
          onClick={() => applyPreset("month")}
 
          className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:px-4"
 
        >
 
          This Month
 
        </button>
 
 
 
        <button type="button"
 
          onClick={() => applyPreset("all")}
 
          className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:px-4"
 
        >
 
          All Time
 
        </button>
 
      </div>
 
    </div>
 
 
 
    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
 
      <button type="button"
 
        onClick={applyDateFilter}
 
        className="w-full rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
 
      >
 
        Apply Filter
 
      </button>
 
 
 
      <button type="button"
 
        onClick={clearDateFilter}
 
        className="w-full rounded-lg border bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
 
      >
 
        Clear Filter
 
      </button>
 
    </div>
 
 
 
  </div>
 
 
 
  {(appliedFrom || appliedTo) && (
 
    <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
 
      Showing alerts
 
      {appliedFrom
 
        ? ` from ${appliedFrom}`
 
        : ""}
 
      {appliedTo
 
        ? ` to ${appliedTo}`
 
        : ""}
 
    </div>
 
  )}
 
</section>
 
        {/* =========================================================
 
   SUMMARY CARDS — RESPONSIVE GRID
 
   ========================================================= */}
 
 
 
<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
 
 
 
  <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
    <p className="text-sm text-gray-500">
 
      Total Alerts
 
    </p>
 
 
 
    <p className="mt-2 text-2xl font-bold sm:text-3xl">
 
      {filteredAlerts.length}
 
    </p>
 
  </div>
 
 
 
  <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
    <p className="text-sm text-gray-500">
 
      High Severity
 
    </p>
 
 
 
    <p className="mt-2 text-2xl font-bold text-red-600 sm:text-3xl">
 
      {severityCounts.High}
 
    </p>
 
  </div>
 
 
 
  <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
    <p className="text-sm text-gray-500">
 
      High Severity %
 
    </p>
 
 
 
    <p className="mt-2 text-2xl font-bold sm:text-3xl">
 
      {highSeverityPercentage}%
 
    </p>
 
  </div>
 
 
 
  <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
    <p className="text-sm text-gray-500">
 
      Pending Review
 
    </p>
 
 
 
    <p className="mt-2 text-2xl font-bold text-orange-600 sm:text-3xl">
 
      {pendingAlerts.length}
 
    </p>
 
  </div>
 
 
 
  <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
    <p className="text-sm text-gray-500">
 
      Avg Pending Age
 
    </p>
 
 
 
    <p className="mt-2 text-2xl font-bold sm:text-3xl">
 
      {averagePendingAge < 24
 
        ? `${averagePendingAge.toFixed(1)}h`
 
        : `${(
 
            averagePendingAge / 24
 
          ).toFixed(1)}d`}
 
    </p>
 
  </div>
 
 
 
</section>
 
         {/*PERIOD COMPARISON UI */}
 
        <section className="rounded-xl border bg-white p-5 shadow-sm">
 
  <h2 className="text-lg font-semibold text-gray-900">
 
    Period Comparison
 
  </h2>
 
 
 
  <div className="mt-4 grid gap-4 md:grid-cols-3">
 
    <div className="rounded-lg bg-gray-50 p-4">
 
      <p className="text-sm text-gray-500">
 
        Current Period
 
      </p>
 
 
 
      <p className="mt-1 text-2xl font-bold text-gray-900">
 
        {currentPeriodCount}
 
      </p>
 
    </div>
 
 
 
    <div className="rounded-lg bg-gray-50 p-4">
 
      <p className="text-sm text-gray-500">
 
        Previous Period
 
      </p>
 
 
 
      <p className="mt-1 text-2xl font-bold text-gray-900">
 
        {previousPeriodCount}
 
      </p>
 
    </div>
 
 
 
    <div className="rounded-lg bg-gray-50 p-4">
 
      <p className="text-sm text-gray-500">
 
        Change
 
      </p>
 
 
 
      <p className="mt-1 text-2xl font-bold text-gray-900">
 
        {periodChange > 0 ? "+" : ""}
 
        {periodChange}
 
      </p>
 
 
 
      <p className="mt-1 text-sm text-gray-500">
 
        {periodChangePercent > 0 ? "+" : ""}
 
        {periodChangePercent.toFixed(1)}%
 
      </p>
 
    </div>
 
  </div>
 
 
 
  {!appliedFrom && !appliedTo && (
 
    <p className="mt-4 text-sm text-gray-500">
 
      Select a date range or quick range to compare
 
      it with the previous period.
 
    </p>
 
  )}
 
</section>
 
    {/* =========================================================
 
   SEVERITY COMPARISON — RESPONSIVE DASHBOARD TABLE
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Severity Comparison
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Compares alert severity activity with the previous period.
 
    </p>
 
  </div>
 
 
 
  {!appliedFrom && !appliedTo ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      Select a date range or quick range to compare
 
      severity against the previous period.
 
    </p>
 
  ) : (
 
    <div className="mt-4 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[600px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              Severity
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Current
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Previous
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change %
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {severityComparison.map((item) => (
 
            <tr
 
              key={item.severity}
 
              className="border-b last:border-b-0 hover:bg-gray-50"
 
            >
 
              <td className="px-3 py-3 font-medium text-gray-900">
 
                {item.severity}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.current}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.previous}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.change > 0 ? "+" : ""}
 
                {item.change}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.changePercent > 0 ? "+" : ""}
 
                {item.changePercent.toFixed(1)}%
 
              </td>
 
            </tr>
 
          ))}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
   {/* =========================================================
 
   ALERT TYPE COMPARISON — RESPONSIVE DASHBOARD TABLE
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Alert Type Comparison
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Compares alert type activity with the previous period.
 
    </p>
 
  </div>
 
 
 
  {!appliedFrom && !appliedTo ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      Select a date range or quick range to compare
 
      alert types against the previous period.
 
    </p>
 
  ) : (
 
    <div className="mt-4 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[700px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              Alert Type
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Current
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Previous
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change %
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {alertTypeComparison.map((item) => (
 
            <tr
 
              key={item.type}
 
              className="border-b last:border-b-0 hover:bg-gray-50"
 
            >
 
              <td className="px-3 py-3 font-medium text-gray-900">
 
                {item.type}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.current}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.previous}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.change > 0 ? "+" : ""}
 
                {item.change}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.changePercent > 0 ? "+" : ""}
 
                {item.changePercent.toFixed(1)}%
 
              </td>
 
            </tr>
 
          ))}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
{/* =========================================================
 
   IN-CHARGE COMPARISON — RESPONSIVE DASHBOARD TABLE
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      In-Charge Comparison
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Compares In-Charge alert activity with the previous period.
 
    </p>
 
  </div>
 
 
 
  {!appliedFrom && !appliedTo ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      Select a date range or quick range to compare
 
      In-Charge activity against the previous period.
 
    </p>
 
  ) : inChargeComparison.length === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No In-Charge alert activity found for this period.
 
    </p>
 
  ) : (
 
    <div className="mt-4 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[700px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              In-Charge
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Current
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Previous
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change %
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {inChargeComparison.map((item) => (
 
            <tr
 
              key={item.name}
 
              className="border-b last:border-b-0 hover:bg-gray-50"
 
            >
 
              <td className="px-3 py-3 font-medium text-gray-900">
 
                {item.name}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.current}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.previous}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.change > 0 ? "+" : ""}
 
                {item.change}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.changePercent > 0 ? "+" : ""}
 
                {item.changePercent.toFixed(1)}%
 
              </td>
 
            </tr>
 
          ))}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
 
 
{/* =========================================================
 
   EVENT COMPARISON — RESPONSIVE DASHBOARD TABLE
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Event Comparison
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Compares event alert activity with the previous period.
 
    </p>
 
  </div>
 
 
 
  {!appliedFrom && !appliedTo ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      Select a date range or quick range to compare
 
      event activity against the previous period.
 
    </p>
 
  ) : eventComparison.length === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No event alert activity found for this period.
 
    </p>
 
  ) : (
 
    <div className="mt-4 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[750px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              Event
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Current
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Previous
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change %
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {eventComparison.map((item) => (
 
            <tr
 
              key={item.eventId}
 
              className="border-b last:border-b-0 hover:bg-gray-50"
 
            >
 
              <td className="px-3 py-3">
 
                <div className="font-medium text-gray-900">
 
                  {item.eventName}
 
                </div>
 
 
 
                <div className="mt-1 text-xs text-gray-500">
 
                  {item.eventId}
 
                </div>
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.current}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.previous}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.change > 0 ? "+" : ""}
 
                {item.change}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.changePercent > 0 ? "+" : ""}
 
                {item.changePercent.toFixed(1)}%
 
              </td>
 
            </tr>
 
          ))}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
 
 
{/* =========================================================
 
   MATCH COMPARISON — RESPONSIVE DASHBOARD TABLE
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Match Comparison
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Compares match alert activity with the previous period.
 
    </p>
 
  </div>
 
 
 
  {!appliedFrom && !appliedTo ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      Select a date range or quick range to compare
 
      match activity against the previous period.
 
    </p>
 
  ) : matchComparison.length === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No match alert activity found for this period.
 
    </p>
 
  ) : (
 
    <div className="mt-4 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[750px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              Match
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Current
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Previous
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Change %
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {matchComparison.map((item) => (
 
            <tr
 
              key={item.matchId}
 
              className="border-b last:border-b-0 hover:bg-gray-50"
 
            >
 
              <td className="px-3 py-3">
 
                <div className="font-medium text-gray-900">
 
                  {item.matchName}
 
                </div>
 
 
 
                <div className="mt-1 text-xs text-gray-500">
 
                  {item.matchId}
 
                </div>
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.current}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.previous}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.change > 0 ? "+" : ""}
 
                {item.change}
 
              </td>
 
 
 
              <td
 
                className={`px-3 py-3 font-medium ${
 
                  item.change > 0
 
                    ? "text-red-600"
 
                    : item.change < 0
 
                      ? "text-green-600"
 
                      : "text-gray-600"
 
                }`}
 
              >
 
                {item.changePercent > 0 ? "+" : ""}
 
                {item.changePercent.toFixed(1)}%
 
              </td>
 
            </tr>
 
          ))}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
{/* =========================================================
 
   COMPARISON SUMMARY — RESPONSIVE DASHBOARD CARDS
 
   ========================================================= */}
 
 
 
<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 
 
 
  <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
    <p className="text-sm font-medium text-gray-500">
 
      Alert Change
 
    </p>
 
 
 
    <p
 
      className={`mt-2 text-2xl font-bold sm:text-3xl ${
 
        periodChange > 0
 
          ? "text-red-600"
 
          : periodChange < 0
 
            ? "text-green-600"
 
            : "text-gray-900"
 
      }`}
 
    >
 
      {periodChange > 0 ? "+" : ""}
 
      {periodChange}
 
    </p>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      {periodChangePercent > 0 ? "+" : ""}
 
      {periodChangePercent.toFixed(1)}%
 
      {" "}vs previous period
 
    </p>
 
  </div>
 
 
 
  <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
    <p className="text-sm font-medium text-gray-500">
 
      High Severity Change
 
    </p>
 
 
 
    <p
 
      className={`mt-2 text-2xl font-bold sm:text-3xl ${
 
        highSeverityChange > 0
 
          ? "text-red-600"
 
          : highSeverityChange < 0
 
            ? "text-green-600"
 
            : "text-gray-900"
 
      }`}
 
    >
 
      {highSeverityChange > 0 ? "+" : ""}
 
      {highSeverityChange}
 
    </p>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Current: {currentHighSeverity}
 
      {" · "}
 
      Previous: {previousHighSeverity}
 
    </p>
 
  </div>
 
 
 
  <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
    <p className="text-sm font-medium text-gray-500">
 
      Pending Review Change
 
    </p>
 
 
 
    <p
 
      className={`mt-2 text-2xl font-bold sm:text-3xl ${
 
        pendingReviewChange > 0
 
          ? "text-red-600"
 
          : pendingReviewChange < 0
 
            ? "text-green-600"
 
            : "text-gray-900"
 
      }`}
 
    >
 
      {pendingReviewChange > 0 ? "+" : ""}
 
      {pendingReviewChange}
 
    </p>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Current: {currentPendingReview}
 
      {" · "}
 
      Previous: {previousPendingReview}
 
    </p>
 
  </div>
 
 
 
</section>
 
{/* =========================================================
 
   AUDIT HEALTH INDICATOR — RESPONSIVE DASHBOARD
 
   ========================================================= */}
 
 
 
<section
 
  className={`rounded-xl border p-4 shadow-sm sm:p-5 ${auditHealth.className}`}
 
>
 
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 
    <div className="min-w-0">
 
      <p className="text-sm font-medium opacity-80">
 
        Audit Health
 
      </p>
 
 
 
      <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
 
        {auditHealth.label}
 
      </h2>
 
 
 
      <p className="mt-1 text-sm">
 
        {auditHealth.description}
 
      </p>
 
    </div>
 
 
 
    <div className="w-full rounded-lg border bg-white/60 px-4 py-3 text-sm sm:w-auto sm:min-w-[220px]">
 
      <div>
 
        High Severity:{" "}
 
        <strong>
 
          {
 
            filteredAlerts.filter(
 
              (alert) => alert.severity === "High"
 
            ).length
 
          }
 
        </strong>
 
      </div>
 
 
 
      <div className="mt-1">
 
        Pending Review:{" "}
 
        <strong>
 
          {
 
            filteredAlerts.filter(
 
              (alert) =>
 
                alert.status === "Pending Review"
 
            ).length
 
          }
 
        </strong>
 
      </div>
 
    </div>
 
  </div>
 
</section>
 
 
 
{/* =========================================================
 
   AUDIT HEALTH — CURRENT VS PREVIOUS PERIOD
 
   ========================================================= */}
 
 
 
<section
 
  className={`rounded-xl border p-4 shadow-sm sm:p-5 ${auditHealth.className}`}
 
>
 
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 
    <div className="min-w-0">
 
      <p className="text-sm font-medium opacity-80">
 
        Audit Health
 
      </p>
 
 
 
      <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
 
        {auditHealth.label}
 
      </h2>
 
 
 
      <p className="mt-1 text-sm">
 
        {auditHealth.description}
 
      </p>
 
    </div>
 
 
 
    <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[520px]">
 
      <div className="rounded-lg border bg-white/60 px-4 py-3">
 
        <p className="text-xs opacity-70">
 
          Current
 
        </p>
 
 
 
        <p className="mt-1 font-semibold">
 
          {auditHealth.label}
 
        </p>
 
      </div>
 
 
 
      <div className="rounded-lg border bg-white/60 px-4 py-3">
 
        <p className="text-xs opacity-70">
 
          Previous
 
        </p>
 
 
 
        <p className="mt-1 font-semibold">
 
          {previousAuditHealth}
 
        </p>
 
      </div>
 
 
 
      <div className="rounded-lg border bg-white/60 px-4 py-3">
 
        <p className="text-xs opacity-70">
 
          Trend
 
        </p>
 
 
 
        <p
 
          className={`mt-1 font-semibold ${auditHealthTrend.className}`}
 
        >
 
          {auditHealthTrend.label}
 
        </p>
 
      </div>
 
    </div>
 
  </div>
 
</section>
 
 
 
{/* =========================================================
 
   DAILY ALERT TREND — RESPONSIVE DASHBOARD TABLE
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Daily Alert Trend
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Alerts detected on each day in the selected period.
 
    </p>
 
  </div>
 
 
 
  {dailyAlertTrend.length === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No alerts found for the selected period.
 
    </p>
 
  ) : (
 
    <div className="mt-4 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[500px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              Date
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Alerts
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Share of Period
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {dailyAlertTrend.map((item) => {
 
            const share =
 
              currentPeriodCount === 0
 
                ? 0
 
                : (item.count /
 
                    currentPeriodCount) *
 
                  100;
 
 
 
            return (
 
              <tr
 
                key={item.date}
 
                className="border-b last:border-b-0 hover:bg-gray-50"
 
              >
 
                <td className="px-3 py-3 font-medium text-gray-900">
 
                  {item.date}
 
                </td>
 
 
 
                <td className="px-3 py-3">
 
                  {item.count}
 
                </td>
 
 
 
                <td className="px-3 py-3">
 
                  <div className="flex min-w-[180px] items-center gap-3">
 
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
 
                      <div
 
                        className="h-full rounded-full bg-gray-800"
 
                        style={{
 
                          width: `${Math.min(
 
                            share,
 
                            100
 
                          )}%`,
 
                        }}
 
                      />
 
                    </div>
 
 
 
                    <span className="text-xs text-gray-500">
 
                      {share.toFixed(1)}%
 
                    </span>
 
                  </div>
 
                </td>
 
              </tr>
 
            );
 
          })}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
 
 
{/* =========================================================
 
   WEEKLY ALERT TREND — RESPONSIVE DASHBOARD TABLE
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Weekly Alert Trend
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Alerts grouped by the week starting Monday.
 
    </p>
 
  </div>
 
 
 
  {weeklyAlertTrend.length === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No alerts found for the selected period.
 
    </p>
 
  ) : (
 
    <div className="mt-4 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[500px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              Week Starting
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Alerts
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Share of Period
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {weeklyAlertTrend.map((item) => {
 
            const share =
 
              currentPeriodCount === 0
 
                ? 0
 
                : (item.count /
 
                    currentPeriodCount) *
 
                  100;
 
 
 
            return (
 
              <tr
 
                key={item.weekStart}
 
                className="border-b last:border-b-0 hover:bg-gray-50"
 
              >
 
                <td className="px-3 py-3 font-medium text-gray-900">
 
                  {item.weekStart}
 
                </td>
 
 
 
                <td className="px-3 py-3">
 
                  {item.count}
 
                </td>
 
 
 
                <td className="px-3 py-3">
 
                  <div className="flex min-w-[180px] items-center gap-3">
 
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
 
                      <div
 
                        className="h-full rounded-full bg-gray-800"
 
                        style={{
 
                          width: `${Math.min(
 
                            share,
 
                            100
 
                          )}%`,
 
                        }}
 
                      />
 
                    </div>
 
 
 
                    <span className="text-xs text-gray-500">
 
                      {share.toFixed(1)}%
 
                    </span>
 
                  </div>
 
                </td>
 
              </tr>
 
            );
 
          })}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
 
 
{/* =========================================================
 
   PEAK ALERT DAY / TIME — RESPONSIVE DASHBOARD
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Peak Alert Period
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Identifies the day and hour with the highest
 
      concentration of audit alerts.
 
    </p>
 
  </div>
 
 
 
  {filteredAlerts.length === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No alerts found for the selected period.
 
    </p>
 
  ) : (
 
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
 
      <div className="rounded-lg border bg-gray-50 p-4 sm:p-5">
 
        <p className="text-sm font-medium text-gray-500">
 
          Peak Alert Day
 
        </p>
 
 
 
        <p className="mt-2 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
 
          {peakAlertAnalysis.peakDay?.day || "-"}
 
        </p>
 
 
 
        <p className="mt-1 text-sm text-gray-500">
 
          {peakAlertAnalysis.peakDay?.count || 0} alerts
 
        </p>
 
      </div>
 
 
 
      <div className="rounded-lg border bg-gray-50 p-4 sm:p-5">
 
        <p className="text-sm font-medium text-gray-500">
 
          Peak Alert Hour
 
        </p>
 
 
 
        <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
 
          {peakAlertAnalysis.peakHour?.label || "-"}
 
        </p>
 
 
 
        <p className="mt-1 text-sm text-gray-500">
 
          {peakAlertAnalysis.peakHour?.count || 0} alerts
 
        </p>
 
      </div>
 
    </div>
 
  )}
 
</section>
 
{/* =========================================================
 
   PENDING REVIEW AGEING — RESPONSIVE DASHBOARD
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Pending Review Ageing
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Shows how long pending audit alerts have been
 
      waiting for review.
 
    </p>
 
  </div>
 
 
 
  {currentPendingReview === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No pending review alerts found.
 
    </p>
 
  ) : (
 
    <div className="mt-5 space-y-4">
 
      {pendingReviewAgeing.map((bucket) => {
 
        const share =
 
          currentPendingReview === 0
 
            ? 0
 
            : (bucket.count /
 
                currentPendingReview) *
 
              100;
 
 
 
        return (
 
          <div
 
            key={bucket.label}
 
            className="rounded-lg border bg-gray-50 p-3 sm:p-4"
 
          >
 
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
 
              <span className="text-sm font-medium text-gray-700">
 
                {bucket.label}
 
              </span>
 
 
 
              <span className="text-sm font-semibold text-gray-900">
 
                {bucket.count}
 
              </span>
 
            </div>
 
 
 
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
 
              <div
 
                className="h-full rounded-full bg-gray-800"
 
                style={{
 
                  width: `${Math.min(
 
                    share,
 
                    100
 
                  )}%`,
 
                }}
 
              />
 
            </div>
 
 
 
            <p className="mt-2 text-xs text-gray-500">
 
              {share.toFixed(1)}% of pending alerts
 
            </p>
 
          </div>
 
        );
 
      })}
 
    </div>
 
  )}
 
</section>
 
 
 
{/* =========================================================
 
   TOP RISK IN-CHARGES — RESPONSIVE DASHBOARD
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Top Risk In-Charges
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      In-charges ranked by alert activity, high-severity
 
      alerts, and pending reviews.
 
    </p>
 
  </div>
 
 
 
  {topRiskInCharges.length === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No in-charge alert data found for the selected period.
 
    </p>
 
  ) : (
 
    <div className="mt-5 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[700px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              In-Charge
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Total Alerts
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              High Severity
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Pending Review
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Risk Score
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Risk Level
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {topRiskInCharges.map((item) => (
 
            <tr
 
              key={item.name}
 
              className="border-b last:border-b-0 hover:bg-gray-50"
 
            >
 
              <td className="px-3 py-3 font-medium text-gray-900">
 
                {item.name}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.totalAlerts}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.highSeverity}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.pendingReview}
 
              </td>
 
 
 
              <td className="px-3 py-3 font-semibold">
 
                {item.riskScore}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                <span
 
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
 
                    item.riskLevel === "High"
 
                      ? "border-red-200 bg-red-50 text-red-700"
 
                      : item.riskLevel === "Medium"
 
                        ? "border-yellow-200 bg-yellow-50 text-yellow-700"
 
                        : "border-green-200 bg-green-50 text-green-700"
 
                  }`}
 
                >
 
                  {item.riskLevel}
 
                </span>
 
              </td>
 
            </tr>
 
          ))}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
 
 
{/* =========================================================
 
   TOP RISK EVENTS — RESPONSIVE DASHBOARD
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Top Risk Events
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Events ranked by audit alert activity and severity.
 
    </p>
 
  </div>
 
 
 
  {topRiskEvents.length === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No event alert data found for the selected period.
 
    </p>
 
  ) : (
 
    <div className="mt-5 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[700px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              Event
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Alerts
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              High Severity
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Pending
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Risk Score
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Risk
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {topRiskEvents.slice(0, 10).map((item) => (
 
            <tr
 
              key={item.eventId}
 
              className="border-b last:border-b-0 hover:bg-gray-50"
 
            >
 
              <td className="px-3 py-3 font-medium text-gray-900">
 
                {item.eventName}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.totalAlerts}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.highSeverity}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.pendingReview}
 
              </td>
 
 
 
              <td className="px-3 py-3 font-semibold">
 
                {item.riskScore}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                <span
 
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
 
                    item.riskLevel === "High"
 
                      ? "border-red-200 bg-red-50 text-red-700"
 
                      : item.riskLevel === "Medium"
 
                        ? "border-yellow-200 bg-yellow-50 text-yellow-700"
 
                        : "border-green-200 bg-green-50 text-green-700"
 
                  }`}
 
                >
 
                  {item.riskLevel}
 
                </span>
 
              </td>
 
            </tr>
 
          ))}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
 
 
{/* =========================================================
 
   TOP RISK MATCHES — RESPONSIVE DASHBOARD
 
   ========================================================= */}
 
 
 
<section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
 
  <div>
 
    <h2 className="text-lg font-semibold text-gray-900">
 
      Top Risk Matches
 
    </h2>
 
 
 
    <p className="mt-1 text-sm text-gray-500">
 
      Matches ranked by audit alert activity and severity.
 
    </p>
 
  </div>
 
 
 
  {topRiskMatches.length === 0 ? (
 
    <p className="mt-4 text-sm text-gray-500">
 
      No match alert data found for the selected period.
 
    </p>
 
  ) : (
 
    <div className="mt-5 overflow-x-auto rounded-lg border">
 
      <table className="w-full min-w-[700px] text-left text-sm">
 
        <thead className="bg-gray-50">
 
          <tr className="border-b text-gray-500">
 
            <th className="px-3 py-3 font-medium">
 
              Match
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Alerts
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              High Severity
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Pending
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Risk Score
 
            </th>
 
 
 
            <th className="px-3 py-3 font-medium">
 
              Risk
 
            </th>
 
          </tr>
 
        </thead>
 
 
 
        <tbody>
 
          {topRiskMatches.slice(0, 10).map((item) => (
 
            <tr
 
              key={item.matchId}
 
              className="border-b last:border-b-0 hover:bg-gray-50"
 
            >
 
              <td className="px-3 py-3 font-medium text-gray-900">
 
                {item.matchName}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.totalAlerts}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.highSeverity}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                {item.pendingReview}
 
              </td>
 
 
 
              <td className="px-3 py-3 font-semibold">
 
                {item.riskScore}
 
              </td>
 
 
 
              <td className="px-3 py-3">
 
                <span
 
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
 
                    item.riskLevel === "High"
 
                      ? "border-red-200 bg-red-50 text-red-700"
 
                      : item.riskLevel === "Medium"
 
                        ? "border-yellow-200 bg-yellow-50 text-yellow-700"
 
                        : "border-green-200 bg-green-50 text-green-700"
 
                  }`}
 
                >
 
                  {item.riskLevel}
 
                </span>
 
              </td>
 
            </tr>
 
          ))}
 
        </tbody>
 
      </table>
 
    </div>
 
  )}
 
</section>
 
 
 
        {/* Severity / Status */}
 
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 
 
 
          <div className="rounded-xl border bg-white p-5 shadow-sm">
 
            <h2 className="text-lg font-semibold">
 
              Alerts by Severity
 
            </h2>
 
 
 
            <div className="mt-5 space-y-4">
 
              {(
 
                [
 
                  ["High", severityCounts.High],
 
                  ["Medium", severityCounts.Medium],
 
                  ["Low", severityCounts.Low],
 
                ] as [string, number][]
 
              ).map(([severity, count]) => {
 
                const percentage =
 
                  filteredAlerts.length > 0
 
                    ? (count /
 
                        filteredAlerts.length) *
 
                      100
 
                    : 0;
 
 
 
                return (
 
                  <div key={severity}>
 
                    <div className="mb-1 flex justify-between text-sm">
 
                      <span>{severity}</span>
 
                      <span className="font-medium">
 
                        {count}
 
                      </span>
 
                    </div>
 
 
 
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
 
                      <div
 
                        className="h-full rounded-full bg-black"
 
                        style={{
 
                          width: `${percentage}%`,
 
                        }}
 
                      />
 
                    </div>
 
                  </div>
 
                );
 
              })}
 
            </div>
 
          </div>
 
 
 
          <div className="rounded-xl border bg-white p-5 shadow-sm">
 
            <h2 className="text-lg font-semibold">
 
              Alerts by Status
 
            </h2>
 
 
 
            <div className="mt-5 space-y-3">
 
              {statusCounts.length === 0 ? (
 
                <p className="text-sm text-gray-500">
 
                  No alert data available.
 
                </p>
 
              ) : (
 
                statusCounts.map(
 
                  ([status, count]) => (
 
                    <div
 
                      key={status}
 
                      className="flex items-center justify-between rounded-lg border p-3"
 
                    >
 
                      <span>{status}</span>
 
 
 
                      <span className="font-bold">
 
                        {count}
 
                      </span>
 
                    </div>
 
                  )
 
                )
 
              )}
 
            </div>
 
          </div>
 
        </section>
 
 
 
        {/* Alert Types */}
 
        <section className="rounded-xl border bg-white p-5 shadow-sm">
 
          <h2 className="text-lg font-semibold">
 
            Alerts by Type
 
          </h2>
 
 
 
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
 
            {typeCounts.length === 0 ? (
 
              <p className="text-sm text-gray-500">
 
                No alert data available.
 
              </p>
 
            ) : (
 
              typeCounts.map(([type, count]) => (
 
                <div
 
                  key={type}
 
                  className="rounded-lg border p-4"
 
                >
 
                  <p className="text-sm text-gray-500">
 
                    {type}
 
                  </p>
 
 
 
                  <p className="mt-2 text-2xl font-bold">
 
                    {count}
 
                  </p>
 
                </div>
 
              ))
 
            )}
 
          </div>
 
        </section>
 
      </div>
    </main>
  );
}
