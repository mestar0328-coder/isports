import {
  getScoreAudit,
  type ScoreAudit,
} from "./scoreAudit";

import {
  addAuditAlert,
  getAuditAlerts,
  type AuditAlert,
} from "./auditAlertStorage";

const REPEATED_CORRECTION_LIMIT = 3;
const HIGH_ACTIVITY_LIMIT = 5;
const RAPID_CORRECTION_WINDOW =
  10 * 60 * 1000;

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

function createAlertId(
  type: string,
  matchId: string,
  performedBy: string
) {
  return `ALERT-${type
    .replaceAll(" ", "-")
    .toUpperCase()}-${matchId}-${performedBy}`;
}

function sortByDate(
  audits: ScoreAudit[]
) {
  return [...audits].sort((a, b) => {
    const dateA =
      parseAuditDate(a.timestamp)?.getTime() ||
      0;

    const dateB =
      parseAuditDate(b.timestamp)?.getTime() ||
      0;

    return dateA - dateB;
  });
}

export function detectAuditAlerts(): AuditAlert[] {
  const audits = getScoreAudit();

  if (!audits.length) {
    return getAuditAlerts();
  }

  const corrections = audits.filter(
    (audit) =>
      audit.action === "Score Corrected"
  );

  const existingAlerts = getAuditAlerts();

  const existingIds = new Set(
    existingAlerts.map(
      (alert) => alert.id
    )
  );

  const newAlerts: AuditAlert[] = [];

  /*
   * --------------------------------------------------
   * 1. REPEATED CORRECTIONS
   * --------------------------------------------------
   */

  const correctionsByMatch =
    new Map<string, ScoreAudit[]>();

  corrections.forEach((audit) => {
    const current =
      correctionsByMatch.get(
        audit.matchId
      ) || [];

    current.push(audit);

    correctionsByMatch.set(
      audit.matchId,
      current
    );
  });

  correctionsByMatch.forEach(
    (matchAudits, matchId) => {
      if (
        matchAudits.length <
        REPEATED_CORRECTION_LIMIT
      ) {
        return;
      }

      const sorted =
        sortByDate(matchAudits);

      const latest =
        sorted[sorted.length - 1];

      const alertId =
        createAlertId(
          "Repeated Corrections",
          matchId,
          latest.performedBy
        );

      if (existingIds.has(alertId)) {
        return;
      }

      const alert: AuditAlert = {
        id: alertId,
        type:
          "Repeated Corrections",
        severity: "High",
        matchId,
        performedBy:
          latest.performedBy,
        reason:
          `${matchAudits.length} score corrections were detected for this match.`,
        detectedAt:
          new Date().toISOString(),
        status:
          "Pending Review",
      };

      addAuditAlert(alert);

      newAlerts.push(alert);

      existingIds.add(alertId);
    }
  );

  /*
   * --------------------------------------------------
   * 2. RAPID CORRECTIONS
   *
   * Only corrections made by the SAME
   * In-Charge within 10 minutes are flagged.
   * --------------------------------------------------
   */

  const correctionsByMatchAndUser =
    new Map<
      string,
      ScoreAudit[]
    >();

  corrections.forEach((audit) => {
    const key =
      `${audit.matchId}::${audit.performedBy}`;

    const current =
      correctionsByMatchAndUser.get(
        key
      ) || [];

    current.push(audit);

    correctionsByMatchAndUser.set(
      key,
      current
    );
  });

  correctionsByMatchAndUser.forEach(
    (matchAudits, key) => {
      const [
        matchId,
        performedBy,
      ] = key.split("::");

      const sorted =
        sortByDate(matchAudits);

      for (
        let i = 1;
        i < sorted.length;
        i++
      ) {
        const previous =
          parseAuditDate(
            sorted[i - 1].timestamp
          );

        const current =
          parseAuditDate(
            sorted[i].timestamp
          );

        if (!previous || !current) {
          continue;
        }

        const difference =
          current.getTime() -
          previous.getTime();

        if (
          difference <=
          RAPID_CORRECTION_WINDOW
        ) {
          const alertId =
            createAlertId(
              "Rapid Corrections",
              matchId,
              performedBy
            );

          if (
            !existingIds.has(alertId)
          ) {
            const alert: AuditAlert = {
              id: alertId,
              type:
                "Rapid Corrections",
              severity: "Medium",
              matchId,
              performedBy,
              reason:
                "Multiple score corrections were detected by the same In-Charge within a 10-minute period.",
              detectedAt:
                new Date().toISOString(),
              status:
                "Pending Review",
            };

            addAuditAlert(alert);

            newAlerts.push(alert);

            existingIds.add(
              alertId
            );
          }

          break;
        }
      }
    }
  );

  /*
   * --------------------------------------------------
   * 3. HIGH CORRECTION ACTIVITY
   * --------------------------------------------------
   */

  const correctionsByUser =
    new Map<
      string,
      ScoreAudit[]
    >();

  corrections.forEach((audit) => {
    const current =
      correctionsByUser.get(
        audit.performedBy
      ) || [];

    current.push(audit);

    correctionsByUser.set(
      audit.performedBy,
      current
    );
  });

  correctionsByUser.forEach(
    (userAudits, performedBy) => {
      if (
        userAudits.length <
        HIGH_ACTIVITY_LIMIT
      ) {
        return;
      }

      const sorted =
        sortByDate(userAudits);

      const firstMatch =
        sorted[0]?.matchId ||
        "unknown";

      const alertId =
        createAlertId(
          "High Correction Activity",
          firstMatch,
          performedBy
        );

      if (
        existingIds.has(alertId)
      ) {
        return;
      }

      const alert: AuditAlert = {
        id: alertId,
        type:
          "High Correction Activity",
        severity: "High",
        matchId: firstMatch,
        performedBy,
        reason:
          `${userAudits.length} score corrections were performed by this In-Charge.`,
        detectedAt:
          new Date().toISOString(),
        status:
          "Pending Review",
      };

      addAuditAlert(alert);

      newAlerts.push(alert);

      existingIds.add(alertId);
    }
  );

  return [
    ...existingAlerts,
    ...newAlerts,
  ];
}