export type ScoreAuditAction =
  | "Score Saved"
  | "Score Submitted"
  | "Score Corrected"
  | "Score Locked";

export type ScoreAuditDetails = {
  eventId?: string;
  scoreRecordId?: string;
  athleteId?: string;
  scoringEngine?: string;
  status?: string;
  scoreData?: unknown;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
};

export type ScoreAudit = {
  id: string;
  matchId: string;
  action: ScoreAuditAction;
  performedBy: string;
  timestamp: string;
  // Optional fields keep older localStorage records compatible.
  eventId?: string;
  scoreRecordId?: string;
  athleteId?: string;
  scoringEngine?: string;
  status?: string;
  scoreData?: unknown;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
};

const STORAGE_KEY = "isports_score_audit";

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getScoreAudit(): ScoreAudit[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is ScoreAudit =>
        item !== null &&
        typeof item === "object" &&
        typeof (item as ScoreAudit).id === "string" &&
        typeof (item as ScoreAudit).matchId === "string" &&
        typeof (item as ScoreAudit).action === "string" &&
        typeof (item as ScoreAudit).performedBy === "string" &&
        typeof (item as ScoreAudit).timestamp === "string"
    );
  } catch (error) {
    console.error("Unable to read score audit:", error);
    return [];
  }
}

function saveScoreAudit(entries: ScoreAudit[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Unable to save score audit:", error);
    throw new Error("Unable to save the score audit record.");
  }
}

export function addScoreAudit(
  matchId: string,
  action: ScoreAuditAction,
  performedBy: string,
  details: ScoreAuditDetails = {}
): ScoreAudit[] {
  if (!matchId.trim() || !performedBy.trim()) {
    throw new Error("Match ID and actor name are required.");
  }

  const entry: ScoreAudit = {
    id: createId(),
    matchId,
    action,
    performedBy,
    timestamp: new Date().toISOString(),
    ...details,
  };

  const updated = [entry, ...getScoreAudit()];
  saveScoreAudit(updated);
  return updated;
}

export function clearScoreAudit(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}