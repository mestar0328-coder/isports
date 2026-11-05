export type AuditAlertSeverity = "Low" | "Medium" | "High";
export type AuditAlertStatus = "Pending Review" | "Reviewed" | "Dismissed";
export type AuditAlertType = "Repeated Corrections" | "Rapid Corrections" | "High Correction Activity";
export type AuditAlert = {
  id: string; type: AuditAlertType; severity: AuditAlertSeverity;
  // Existing match alerts retain their IDs; event-only alerts use event:<eventId>.
  matchId: string; eventId?: string; actorId?: string; performedBy: string;
  reason: string; detectedAt: string; status: AuditAlertStatus;
  reviewedAt?: string; reviewedBy?: string;
};
const STORAGE_KEY = "isports_audit_alerts";
export function getAuditAlerts(): AuditAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const v: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(v) ? v as AuditAlert[] : [];
  } catch { return []; }
}
export function saveAuditAlerts(items: AuditAlert[]): void {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
export function addAuditAlert(alert: AuditAlert): AuditAlert[] {
  const old = getAuditAlerts();
  if (old.some(x => x.id === alert.id)) return old;
  const next = [...old, alert]; saveAuditAlerts(next); return next;
}
export function updateAuditAlert(id: string, updates: Partial<AuditAlert>): AuditAlert[] {
  const next = getAuditAlerts().map(x => x.id === id ? { ...x, ...updates } : x);
  saveAuditAlerts(next); return next;
}
export function deleteAuditAlert(id: string): AuditAlert[] {
  const next = getAuditAlerts().filter(x => x.id !== id); saveAuditAlerts(next); return next;
}
export function clearAuditAlerts(): void {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}
