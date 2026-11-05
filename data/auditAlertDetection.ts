import {
  getScoreAudit,
  type ScoreAudit,
} from "./scoreAudit";

import {
  getAuditAlerts,
  saveAuditAlerts,
  type AuditAlert,
} from "./auditAlertStorage";

const REPEATED = 3;
const HIGH_ACTIVITY = 5;
const RAPID_MS = 10 * 60 * 1000;

const time = (value: string): number | null => {
  const result = new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
};

const actor = (a: ScoreAudit) =>
  a.actorId || a.performedBy.trim().toLowerCase();

const scope = (a: ScoreAudit) =>
  `${a.eventId || "no-event"}::${a.matchId || "event-only"}`;

function alertIdentity(
  alert: Pick<
    AuditAlert,
    "type" | "eventId" | "matchId" | "actorId" | "performedBy"
  >
): string {
  const event = alert.eventId || "no-event";
  const match = alert.matchId || "event-only";

  if (alert.type === "Repeated Corrections") {
    return `${alert.type}::${event}::${match}`;
  }

  if (alert.type === "Rapid Corrections") {
    const actorKey =
      alert.actorId || alert.performedBy.trim().toLowerCase();

    return `${alert.type}::${event}::${match}::${actorKey}`;
  }

  const actorKey =
    alert.actorId || alert.performedBy.trim().toLowerCase();

  return `${alert.type}::${actorKey}`;
}

function createAlertId(identity: string): string {
  const type = identity.split("::")[0]
    .replaceAll(" ", "-")
    .toUpperCase();

  return `ALERT-${type}-${encodeURIComponent(identity)}`;
}

export function detectAuditAlerts(): AuditAlert[] {
  const corrections = getScoreAudit().filter(
    (a) => a.action === "Score Corrected"
  );

  const existing = getAuditAlerts();

  // Consolidate previously stored duplicates.
  const alertMap = new Map<string, AuditAlert>();

  for (const alert of existing) {
    const identity = alertIdentity(alert);
    const previous = alertMap.get(identity);

    if (!previous) {
      alertMap.set(identity, alert);
      continue;
    }

    // Preserve an existing review decision.
    const reviewed =
      previous.status !== "Pending Review"
        ? previous
        : alert.status !== "Pending Review"
          ? alert
          : previous;

    alertMap.set(identity, {
      ...previous,
      status: reviewed.status,
      reviewedAt: reviewed.reviewedAt,
      reviewedBy: reviewed.reviewedBy,
      detectedAt:
        previous.detectedAt < alert.detectedAt
          ? previous.detectedAt
          : alert.detectedAt,
    });
  }

  const emit = (
    items: ScoreAudit[],
    type: AuditAlert["type"],
    severity: AuditAlert["severity"],
    reason: string
  ) => {
    if (!items.length) return;

    const latest = [...items].sort(
      (a, b) =>
        (time(a.timestamp) ?? 0) -
        (time(b.timestamp) ?? 0)
    ).at(-1);

    if (!latest) return;

    const candidate: AuditAlert = {
      id: "",
      type,
      severity,
      matchId: latest.matchId,
      eventId: latest.eventId,
      actorId: latest.actorId,
      performedBy: latest.performedBy,
      reason,
      detectedAt: new Date().toISOString(),
      status: "Pending Review",
    };

    const identity = alertIdentity(candidate);
    const previous = alertMap.get(identity);

    candidate.id = createAlertId(identity);

    alertMap.set(identity, {
      ...candidate,
      id: candidate.id,

      // Keep original detection time and review decision.
      detectedAt: previous?.detectedAt ?? candidate.detectedAt,
      status: previous?.status ?? "Pending Review",
      reviewedAt: previous?.reviewedAt,
      reviewedBy: previous?.reviewedBy,
    });
  };

  // 1. Repeated corrections per event/match.
  const byScope = new Map<string, ScoreAudit[]>();

  for (const correction of corrections) {
    const key = scope(correction);

    if (!byScope.has(key)) {
      byScope.set(key, []);
    }

    byScope.get(key)!.push(correction);
  }

  for (const [, items] of byScope) {
    if (items.length >= REPEATED) {
      emit(
        items,
        "Repeated Corrections",
        "High",
        `${items.length} score corrections were detected in this event/match scope.`
      );
    }
  }

  // 2. Rapid corrections by the same actor.
  const byActorScope = new Map<string, ScoreAudit[]>();

  for (const correction of corrections) {
    const key = `${scope(correction)}::${actor(correction)}`;

    if (!byActorScope.has(key)) {
      byActorScope.set(key, []);
    }

    byActorScope.get(key)!.push(correction);
  }

  for (const [, items] of byActorScope) {
    const sorted = [...items].sort(
      (a, b) =>
        (time(a.timestamp) ?? 0) -
        (time(b.timestamp) ?? 0)
    );

    const rapid = sorted.some((item, index) => {
      if (index === 0) return false;

      const current = time(item.timestamp);
      const previous = time(sorted[index - 1].timestamp);

      return (
        current !== null &&
        previous !== null &&
        current - previous <= RAPID_MS
      );
    });

    if (rapid) {
      emit(
        items,
        "Rapid Corrections",
        "Medium",
        "Multiple score corrections were detected by the same In-Charge within a 10-minute period."
      );
    }
  }

  // 3. High correction activity across events/matches.
  const byActor = new Map<string, ScoreAudit[]>();

  for (const correction of corrections) {
    const key = actor(correction);

    if (!byActor.has(key)) {
      byActor.set(key, []);
    }

    byActor.get(key)!.push(correction);
  }

  for (const [, items] of byActor) {
    if (items.length >= HIGH_ACTIVITY) {
      emit(
        items,
        "High Correction Activity",
        "High",
        `${items.length} score corrections were performed by this In-Charge across events/matches.`
      );
    }
  }

  const result = Array.from(alertMap.values());

  saveAuditAlerts(result);

  return result;
}