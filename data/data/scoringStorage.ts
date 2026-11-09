import type { SportEvent } from "@/types/events";
import type {
EventScoreRecord,
ScoreAuditEntry,
ScoreStatus,
SportScoreData,
} from "@/types/scoring";

import {
canScoreEvent,
getCurrentInchargeAccess,
} from "../inchargeAuth";

import {
addScoreAuditWithId,
type ScoreAuditAction,
type ScoreAuditDetails,
} from "../scoreAudit";

import { prepareEventScore } from "../../lib/scoring/prepareEventScore";
import { validateScore } from "../../lib/validateScore";

const STORAGE_KEY = "isports_event_scores";
const RECOVERY_KEY = "isports_score_recovery";

type ExtendedScore = EventScoreRecord & {
athleteId?: string;
matchId?: string;
};

type PendingScoreOperation = {
auditId: string;
scores: EventScoreRecord[];
matchId: string;
action: ScoreAuditAction;
performedBy: string;
details: ScoreAuditDetails;
};

export const SCORE_CORRECTION_WINDOW_MS = 45 * 60 * 1000;

// --------------------------------------------------
// ID GENERATION
// --------------------------------------------------

function id(): string {
return typeof crypto !== "undefined" &&
typeof crypto.randomUUID === "function"
? crypto.randomUUID()
: `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const athleteId = (s: EventScoreRecord) =>
(s as ExtendedScore).athleteId;

const matchId = (s: EventScoreRecord) =>
(s as ExtendedScore).matchId;

// --------------------------------------------------
// SCORE STORAGE
// --------------------------------------------------

function read(): EventScoreRecord[] {
if (typeof window === "undefined") return [];

try {
const value: unknown = JSON.parse(
localStorage.getItem(STORAGE_KEY) || "[]"
);

return Array.isArray(value)
  ? (value as EventScoreRecord[])
  : [];

} catch (error) {
console.error("Unable to read scores:", error);
throw new Error(
"Unable to read saved scores. Please check browser storage before continuing."
);
}
}

function write(scores: EventScoreRecord[]): void {
if (typeof window === "undefined") {
throw new Error("Scores can only be saved in the browser.");
}

try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
} catch (error) {
console.error("Unable to save scores:", error);
throw new Error("Unable to save scores in browser storage.");
}
}

// --------------------------------------------------
// RECOVERY JOURNAL
// --------------------------------------------------

function readPendingOperation(): PendingScoreOperation | null {
if (typeof window === "undefined") return null;

let raw: string | null;

try {
raw = localStorage.getItem(RECOVERY_KEY);
} catch (error) {
console.error("Unable to access score recovery journal:", error);
throw new Error("Unable to access the score recovery journal.");
}

if (!raw) return null;

try {
const value: unknown = JSON.parse(raw);

if (
  !value ||
  typeof value !== "object" ||
  !("auditId" in value) ||
  typeof value.auditId !== "string" ||
  !("scores" in value) ||
  !Array.isArray(value.scores) ||
  !("matchId" in value) ||
  typeof value.matchId !== "string" ||
  !("action" in value) ||
  typeof value.action !== "string" ||
  !("performedBy" in value) ||
  typeof value.performedBy !== "string" ||
  !("details" in value) ||
  !value.details ||
  typeof value.details !== "object"
) {
  throw new Error("Invalid recovery journal structure.");
}

return value as PendingScoreOperation;

} catch (error) {
console.error("Invalid score recovery journal:", error);
throw new Error(
"A pending score recovery record is damaged. Scoring is paused to protect score and audit data."
);
}
}

function savePendingOperation(
  operation: PendingScoreOperation
): void {
  if (typeof window === "undefined") {
    throw new Error("Score recovery is only available in the browser.");
  }

  // Never overwrite an operation that has not been recovered.
  const existingOperation = readPendingOperation();

  if (existingOperation) {
    throw new Error(
      "A previous score operation is still pending recovery. Please recover it before starting another operation."
    );
  }

  try {
    localStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify(operation)
    );
  } catch (error) {
    console.error("Unable to save score recovery journal:", error);
    throw new Error(
      "Unable to prepare score recovery. No score update was attempted."
    );
  }
}

function clearPendingOperation(): void {
if (typeof window === "undefined") return;

try {
localStorage.removeItem(RECOVERY_KEY);
} catch (error) {
console.error("Unable to clear score recovery journal:", error);
throw new Error(
"The score operation was saved, but its recovery journal could not be cleared."
);
}
}

/**

* Replays an interrupted operation.
*
* The stable audit ID prevents duplicate central audit entries
* if recovery runs more than once.
  */
  function recoverPendingOperation(): void {
  const pending = readPendingOperation();

if (!pending) return;

write(pending.scores);

addScoreAuditWithId(
pending.auditId,
pending.matchId,
pending.action,
pending.performedBy,
pending.details
);

clearPendingOperation();
}

/**

* Saves the recovery journal before changing scores.
* The journal is cleared only after both score storage
* and central audit storage have succeeded.
  */
  function commitScoresAndAudit(
  scores: EventScoreRecord[],
  score: EventScoreRecord,
  action: ScoreAuditAction,
  actorId: string,
  actorName: string,
  reason?: string
  ): void {
  const auditLog = Array.isArray(score.auditLog)
  ? score.auditLog
  : [];

const last = auditLog[auditLog.length - 1];

const operation: PendingScoreOperation = {
auditId: id(),
scores,
matchId: matchId(score)?.trim() || `event:${score.eventId}`,
action,
performedBy: actorName,
details: {
eventId: score.eventId,
scoreRecordId: score.id,
athleteId: athleteId(score),
actorId,
scoringEngine: String(score.scoringEngine),
status: score.status,
scoreData: score.data,
previousValue: last?.previousValue,
newValue: last?.newValue,
reason: reason?.trim() || last?.reason,
},
};

savePendingOperation(operation);

recoverPendingOperation();
}

// --------------------------------------------------
// ACTOR AND EVENT AUTHORIZATION
// --------------------------------------------------

function requireActor(
actorId: string,
actorName: string
): void {
if (!actorId?.trim() || !actorName?.trim()) {
throw new Error(
"The acting user's ID and name are required."
);
}

const access = getCurrentInchargeAccess();

if (
!access ||
access.userId !== actorId ||
access.userName.trim().toLowerCase() !==
actorName.trim().toLowerCase()
) {
throw new Error(
"The current In-Charge identity does not match the active account."
);
}
}

function requireEvent(eventId: string): void {
if (!canScoreEvent(eventId)) {
throw new Error(
"Access denied. You must be an active, unexpired In-Charge assigned to this event."
);
}
}

// --------------------------------------------------
// CENTRALIZED SCORE VALIDATION
// --------------------------------------------------

function requireValidScore(
  scoringEngine: EventScoreRecord["scoringEngine"],
  data: SportScoreData
): void {
  const result = validateScore(scoringEngine, data);

  if (!result.valid) {
    throw new Error(
      `Invalid ${scoringEngine} score:\n${result.errors.join("\n")}`
    );
  }
}

// --------------------------------------------------
// INTERNAL AUDIT LOG
// --------------------------------------------------

function entry(
data: Omit<ScoreAuditEntry, "id" | "timestamp">
): ScoreAuditEntry {
return {
...data,
id: id(),
timestamp: new Date().toISOString(),
};
}

// --------------------------------------------------
// CORRECTION WINDOW
// --------------------------------------------------

function correctionWindow(s: EventScoreRecord): void {
if (s.status !== "submitted" || !s.submittedAt) {
throw new Error(
"Only submitted scores can be corrected."
);
}

const submittedTime = new Date(s.submittedAt).getTime();

if (!Number.isFinite(submittedTime)) {
throw new Error(
"Invalid score submission timestamp."
);
}

const elapsed = Date.now() - submittedTime;

if (
elapsed < 0 ||
elapsed >= SCORE_CORRECTION_WINDOW_MS
) {
throw new Error(
"The 45-minute score correction window has expired or is invalid."
);
}
}

// --------------------------------------------------
// AUTOMATIC SCORE LOCKING
// --------------------------------------------------

function reconcileLocks(): EventScoreRecord[] {
let scores = read();
const now = Date.now();

for (let index = 0; index < scores.length; index++) {
const score = scores[index];

if (
  score.status !== "submitted" ||
  !score.submittedAt
) {
  continue;
}

const submittedTime = new Date(
  score.submittedAt
).getTime();

if (!Number.isFinite(submittedTime)) {
  continue;
}

if (
  now - submittedTime <
  SCORE_CORRECTION_WINDOW_MS
) {
  continue;
}

const when = new Date(now).toISOString();

const locked: EventScoreRecord = {
  ...score,
  status: "locked",
  lockedAt: when,
  lockedBy: "system",
  updatedAt: when,
  auditLog: [
    ...(Array.isArray(score.auditLog)
      ? score.auditLog
      : []),
    entry({
      action: "score_locked",
      actorId: "system",
      actorName: "System (automatic lock)",
      previousValue: "submitted",
      newValue: "locked",
      reason: "45-minute correction window elapsed.",
    }),
  ],
};

scores[index] = locked;

commitScoresAndAudit(
  scores,
  locked,
  "Score Locked",
  "system",
  "System (automatic lock)",
  "45-minute correction window elapsed."
);

}

return scores;
}

// --------------------------------------------------
// SCORE READ FUNCTIONS
// --------------------------------------------------

export function getAllScores(): EventScoreRecord[] {
recoverPendingOperation();
return reconcileLocks();
}

export function getScoresByEvent(
eventId: string
): EventScoreRecord[] {
return getAllScores().filter(
(score) => score.eventId === eventId
);
}

export function getScoresByMatch(
id: string
): EventScoreRecord[] {
return getAllScores().filter(
(score) => matchId(score) === id
);
}

export function getScoresByAthlete(
eventId: string,
athlete: string
): EventScoreRecord[] {
return getAllScores().filter(
(score) =>
score.eventId === eventId &&
athleteId(score) === athlete
);
}

export function getScoreByMatchAndAthlete(
match: string,
athlete: string
): EventScoreRecord | null {
return (
getAllScores().find(
(score) =>
matchId(score) === match &&
athleteId(score) === athlete
) ?? null
);
}

export function getScoreById(
scoreId: string
): EventScoreRecord | null {
return (
getAllScores().find(
(score) => score.id === scoreId
) ?? null
);
}

// --------------------------------------------------
// CREATE SCORE
// --------------------------------------------------

type CreateInput = {
eventId: string;
scoringEngine: EventScoreRecord["scoringEngine"];
data: SportScoreData;
sportId?: string;
matchId?: string;
athleteId?: string;
actorId: string;
actorName: string;
};

export function createScore(
input: CreateInput
): EventScoreRecord {
requireActor(input.actorId, input.actorName);
requireEvent(input.eventId);

requireValidScore(
input.scoringEngine,
input.data
);

const match = input.matchId?.trim() || undefined;
const athlete = input.athleteId?.trim() || undefined;

const scores = getAllScores();

if (
  match &&
  scores.some(
    (score) =>
      matchId(score) === match &&
      (
        athlete
          ? athleteId(score) === athlete
          : !athleteId(score)
      )
  )
) {
  throw new Error(
    athlete
      ? "A score record already exists for this athlete in this match."
      : "A team score record already exists for this match."
  );
}

const now = new Date().toISOString();

const record: ExtendedScore = {
id: id(),
eventId: input.eventId,
matchId: match,
athleteId: athlete,
sportId: input.sportId,
scoringEngine: input.scoringEngine,
status: "draft",
data: input.data,
createdAt: now,
updatedAt: now,
auditLog: [
entry({
action: "score_created",
actorId: input.actorId,
actorName: input.actorName,
newValue: input.data,
}),
],
};

commitScoresAndAudit(
[...scores, record],
record,
"Score Saved",
input.actorId,
input.actorName
);

return record;
}

// --------------------------------------------------
// CREATE SCORE FOR EVENT
// --------------------------------------------------

export function createScoreForEvent(
event: SportEvent,
actorId: string,
actorName: string
): EventScoreRecord {
requireEvent(event.id);

const prepared = prepareEventScore(event);

return createScore({
eventId: prepared.eventId,
sportId: prepared.sportId,
scoringEngine: prepared.scoringEngine,
data: prepared.data,
actorId,
actorName,
});
}

// --------------------------------------------------
// CREATE SCORE FOR MATCH

export function createScoreForMatch(
  event: SportEvent,
  match: string,
  actorId: string,
  actorName: string
): EventScoreRecord {
  if (!match.trim()) {
    throw new Error("A match ID is required.");
  }

  requireEvent(event.id);

  const prepared = prepareEventScore(event, {
    matchId: match,
  });

  return createScore({
    eventId: prepared.eventId,
    matchId: prepared.matchId,
    sportId: prepared.sportId,
    scoringEngine: prepared.scoringEngine,
    data: prepared.data,
    actorId,
    actorName,
  });
}

// --------------------------------------------------
// CREATE SCORE FOR MATCH

// --------------------------------------------------
// CREATE SCORE FOR MATCH AND ATHLETE
// --------------------------------------------------

export function createScoreForMatchAthlete(
event: SportEvent,
match: string,
athlete: string,
actorId: string,
actorName: string
): EventScoreRecord {
if (!match.trim() || !athlete.trim()) {
throw new Error(
"A match ID and athlete ID are required."
);
}

requireEvent(event.id);

const prepared = prepareEventScore(event, {
matchId: match,
athleteId: athlete,
});

return createScore({
eventId: prepared.eventId,
matchId: prepared.matchId,
athleteId: prepared.athleteId,
sportId: prepared.sportId,
scoringEngine: prepared.scoringEngine,
data: prepared.data,
actorId,
actorName,
});
}

// --------------------------------------------------
// UPDATE DRAFT SCORE
// --------------------------------------------------

export function updateDraftScore(
scoreId: string,
data: SportScoreData,
actorId: string,
actorName: string,
reason: string
): EventScoreRecord {
requireActor(actorId, actorName);

if (!reason.trim()) {
throw new Error(
"Please provide a reason for the score change."
);
}

const scores = getAllScores();

const index = scores.findIndex(
(score) => score.id === scoreId
);

if (index < 0) {
throw new Error("Score record not found.");
}

const old = scores[index];

requireEvent(old.eventId);

if (old.status !== "draft") {
throw new Error(
"Only draft scores can be edited here."
);
}

requireValidScore(old.scoringEngine, data);

const updated: EventScoreRecord = {
...old,
data,
updatedAt: new Date().toISOString(),
auditLog: [
...old.auditLog,
entry({
action: "draft_score_updated",
actorId,
actorName,
previousValue: old.data,
newValue: data,
reason: reason.trim(),
}),
],
};

scores[index] = updated;

commitScoresAndAudit(
scores,
updated,
"Score Saved",
actorId,
actorName,
reason.trim()
);

return updated;
}

// --------------------------------------------------
// SUBMIT SCORE
// --------------------------------------------------

export function submitScore(
scoreId: string,
actorId: string,
actorName: string
): EventScoreRecord {
requireActor(actorId, actorName);

const scores = getAllScores();

const index = scores.findIndex(
(score) => score.id === scoreId
);

if (index < 0) {
throw new Error("Score record not found.");
}

const old = scores[index];

requireEvent(old.eventId);

if (old.status !== "draft") {
throw new Error(
"Only draft scores can be submitted."
);
}

requireValidScore(old.scoringEngine, old.data);

const now = new Date().toISOString();

const updated: EventScoreRecord = {
...old,
status: "submitted",
submittedAt: now,
submittedBy: actorId,
updatedAt: now,
auditLog: [
...old.auditLog,
entry({
action: "score_submitted",
actorId,
actorName,
previousValue: old.status,
newValue: "submitted",
}),
],
};

scores[index] = updated;

commitScoresAndAudit(
scores,
updated,
"Score Submitted",
actorId,
actorName
);

return updated;
}

// --------------------------------------------------
// CORRECT SUBMITTED SCORE
// --------------------------------------------------

export function correctSubmittedScore(
scoreId: string,
data: SportScoreData,
actorId: string,
actorName: string,
reason: string
): EventScoreRecord {
requireActor(actorId, actorName);

if (!reason.trim()) {
throw new Error(
"Please provide a reason for the score correction."
);
}

const scores = getAllScores();

const index = scores.findIndex(
(score) => score.id === scoreId
);

if (index < 0) {
throw new Error("Score record not found.");
}

const old = scores[index];

requireEvent(old.eventId);
correctionWindow(old);

requireValidScore(old.scoringEngine, data);

const updated: EventScoreRecord = {
...old,
data,
updatedAt: new Date().toISOString(),
auditLog: [
...old.auditLog,
entry({
action: "submitted_score_corrected",
actorId,
actorName,
previousValue: old.data,
newValue: data,
reason: reason.trim(),
}),
],
};

scores[index] = updated;

commitScoresAndAudit(
scores,
updated,
"Score Corrected",
actorId,
actorName,
reason.trim()
);

return updated;
}

// --------------------------------------------------
// MANUAL SCORE LOCK
// --------------------------------------------------

export function lockScore(
scoreId: string,
actorId: string,
actorName: string
): EventScoreRecord {
requireActor(actorId, actorName);

const scores = getAllScores();

const index = scores.findIndex(
(score) => score.id === scoreId
);

if (index < 0) {
throw new Error("Score record not found.");
}

const old = scores[index];

requireEvent(old.eventId);

if (old.status !== "submitted") {
throw new Error(
"Only submitted scores can be locked."
);
}

const now = new Date().toISOString();

const updated: EventScoreRecord = {
...old,
status: "locked",
lockedAt: now,
lockedBy: actorId,
updatedAt: now,
auditLog: [
...old.auditLog,
entry({
action: "score_locked",
actorId,
actorName,
previousValue: old.status,
newValue: "locked",
}),
],
};

scores[index] = updated;

commitScoresAndAudit(
scores,
updated,
"Score Locked",
actorId,
actorName
);

return updated;
}

// --------------------------------------------------
// SCORE AUDIT READ
// --------------------------------------------------

export function getScoreAuditLog(
scoreId: string
): ScoreAuditEntry[] {
return getScoreById(scoreId)?.auditLog ?? [];
}

// --------------------------------------------------
// FILTER SCORES BY STATUS
// --------------------------------------------------

export function getScoresByStatus(
status: ScoreStatus
): EventScoreRecord[] {
return getAllScores().filter(
(score) => score.status === status
);
}
