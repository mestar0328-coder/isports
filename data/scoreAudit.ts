export type ScoreAuditAction =
| "Score Saved"
| "Score Submitted"
| "Score Corrected"
| "Score Locked";

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
// Event-only score references use "event:<eventId>"; existing match IDs are unchanged.
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
return typeof crypto !== "undefined" &&
typeof crypto.randomUUID === "function"
? crypto.randomUUID()
: `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getScoreAudit(): ScoreAudit[] {
if (typeof window === "undefined") return [];

try {
const raw: unknown = JSON.parse(
localStorage.getItem(STORAGE_KEY) || "[]"
);

if (!Array.isArray(raw)) return [];

return raw.filter(
  (x): x is ScoreAudit =>
    !!x &&
    typeof x === "object" &&
    typeof (x as ScoreAudit).id === "string" &&
    typeof (x as ScoreAudit).matchId === "string" &&
    typeof (x as ScoreAudit).action === "string" &&
    typeof (x as ScoreAudit).performedBy === "string" &&
    typeof (x as ScoreAudit).timestamp === "string"
);

} catch (error) {
console.error("Unable to read score audit:", error);
return [];
}
}

function save(entries: ScoreAudit[]): void {
if (typeof window === "undefined") return;

try {
localStorage.setItem(
STORAGE_KEY,
JSON.stringify(entries)
);
} catch (error) {
console.error("Unable to save score audit:", error);
throw new Error("Unable to save the score audit record.");
}
}

/**

* Adds an audit entry using a caller-provided stable ID.
* If that ID already exists, the entry is not duplicated.
* This makes retrying an interrupted scoring operation safe.
  */
  export function addScoreAuditWithId(
  auditId: string,
  matchId: string,
  action: ScoreAuditAction,
  performedBy: string,
  details: ScoreAuditDetails = {}
  ): ScoreAudit[] {
  if (!auditId.trim()) {
  throw new Error("An audit entry ID is required.");
  }

if (!matchId.trim() || !performedBy.trim()) {
throw new Error(
"Audit reference and actor name are required."
);
}

const existing = getScoreAudit();

if (existing.some((entry) => entry.id === auditId)) {
return existing;
}

const entry: ScoreAudit = {
id: auditId,
matchId,
action,
performedBy,
timestamp: new Date().toISOString(),
...details,
};

const updated = [entry, ...existing];

save(updated);

return updated;
}

export function addScoreAudit(
matchId: string,
action: ScoreAuditAction,
performedBy: string,
details: ScoreAuditDetails = {}
): ScoreAudit[] {
return addScoreAuditWithId(
createId(),
matchId,
action,
performedBy,
details
);
}

export function clearScoreAudit(): void {
if (typeof window !== "undefined") {
localStorage.removeItem(STORAGE_KEY);
}
}