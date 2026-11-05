export type ScoreAuditAction = "Score Saved" | "Score Submitted" | "Score Corrected" | "Score Locked";

export type ScoreAuditDetails = {
  eventId?: string;
  scoreRecordId?: string;
  athleteId?: string;
  actorId?: string;
  scoringEngine?: string;
  status?: string;
  scoreData?: unknown;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
};

export type ScoreAudit = {
  id: string;
  // Event-only score references use `event:<eventId>`; existing match IDs are unchanged.
  matchId: string;
  action: ScoreAuditAction;
  performedBy: string;
  timestamp: string;
  eventId?: string;
  scoreRecordId?: string;
  athleteId?: string;
  actorId?: string;
  scoringEngine?: string;
  status?: string;
  scoreData?: unknown;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
};

const STORAGE_KEY = "isports_score_audit";
function createId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getScoreAudit(): ScoreAudit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((x): x is ScoreAudit =>
      !!x && typeof x === "object" &&
      typeof (x as ScoreAudit).id === "string" &&
      typeof (x as ScoreAudit).matchId === "string" &&
      typeof (x as ScoreAudit).action === "string" &&
      typeof (x as ScoreAudit).performedBy === "string" &&
      typeof (x as ScoreAudit).timestamp === "string"
    );
  } catch (e) {
    console.error("Unable to read score audit:", e);
    return [];
  }
}

function save(entries: ScoreAudit[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
  catch (e) {
    console.error("Unable to save score audit:", e);
    throw new Error("Unable to save the score audit record.");
  }
}

export function addScoreAudit(
  matchId: string, action: ScoreAuditAction, performedBy: string, details: ScoreAuditDetails = {}
): ScoreAudit[] {
  if (!matchId.trim() || !performedBy.trim()) throw new Error("Audit reference and actor name are required.");
  const entry: ScoreAudit = {
    id: createId(), matchId, action, performedBy,
    timestamp: new Date().toISOString(), ...details,
  };
  const updated = [entry, ...getScoreAudit()];
  save(updated);
  return updated;
}

export function clearScoreAudit(): void {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}