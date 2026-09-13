export type ScoreAuditAction =
  | "Score Saved"
  | "Score Submitted"
  | "Score Corrected"
  | "Score Locked";

export type ScoreAudit = {
  id: string;
  matchId: string;
  action: ScoreAuditAction;
  performedBy: string;
  timestamp: string;
};

const AUDIT_KEY = "isports_score_audit";

export function getScoreAudit(): ScoreAudit[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(AUDIT_KEY);

  if (!stored) {
    return [];
  }

  return JSON.parse(stored);
}

export function addScoreAudit(
  matchId: string,
  action: ScoreAuditAction,
  performedBy: string
) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = getScoreAudit();

  const newAudit: ScoreAudit = {
    id: `AUDIT-${Date.now()}`,
    matchId,
    action,
    performedBy,
    timestamp: new Date().toLocaleString(),
  };

  localStorage.setItem(
    AUDIT_KEY,
    JSON.stringify([...existing, newAudit])
  );
}