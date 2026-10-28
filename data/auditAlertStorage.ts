export type AuditAlertSeverity =
  | "Low"
  | "Medium"
  | "High";

export type AuditAlertStatus =
  | "Pending Review"
  | "Reviewed"
  | "Dismissed";

export type AuditAlertType =
  | "Repeated Corrections"
  | "Rapid Corrections"
  | "High Correction Activity";

export type AuditAlert = {
  id: string;
  type: AuditAlertType;
  severity: AuditAlertSeverity;

  matchId: string;
  eventId?: string;

  performedBy: string;

  reason: string;

  detectedAt: string;

  status: AuditAlertStatus;

  reviewedAt?: string;
  reviewedBy?: string;
};

const STORAGE_KEY =
  "isports_audit_alerts";

export function getAuditAlerts(): AuditAlert[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveAuditAlerts(
  alerts: AuditAlert[]
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(alerts)
  );
}

export function addAuditAlert(
  alert: AuditAlert
) {
  const existing =
    getAuditAlerts();

  /*
   * Prevent duplicate alerts
   * with the same ID.
   */
  const alreadyExists =
    existing.some(
      (item) =>
        item.id === alert.id
    );

  if (alreadyExists) {
    return existing;
  }

  const updated = [
    ...existing,
    alert,
  ];

  saveAuditAlerts(updated);

  return updated;
}

export function updateAuditAlert(
  id: string,
  updates: Partial<AuditAlert>
) {
  const existing =
    getAuditAlerts();

  const updated =
    existing.map(
      (alert) =>
        alert.id === id
          ? {
              ...alert,
              ...updates,
            }
          : alert
    );

  saveAuditAlerts(updated);

  return updated;
}

export function deleteAuditAlert(
  id: string
) {
  const existing =
    getAuditAlerts();

  const updated =
    existing.filter(
      (alert) =>
        alert.id !== id
    );

  saveAuditAlerts(updated);

  return updated;
}

export function clearAuditAlerts() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );
}