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
import { addScoreAudit } from "../scoreAudit";
import * as scorePreparation from "../../lib/scoring/prepareEventScore";

const STORAGE_KEY = "isports_event_scores";

type AthleteScoreRecord = EventScoreRecord & {
  athleteId?: string;
  matchId?: string;
};

type PreparedEventScore = {
  eventId: string;
  matchId?: string;
  athleteId?: string;
  sportId?: string;
  scoringEngine: EventScoreRecord["scoringEngine"];
  data: SportScoreData;
};

type EventScorePreparer = (
  event: SportEvent,
  options?: { matchId: string; athleteId: string }
) => PreparedEventScore;

const prepareEventScore = (() => {
  const exports = scorePreparation as unknown as Record<string, unknown>;
  const candidate =
    exports.prepareEventScore ??
    exports.default ??
    Object.values(exports).find((value) => typeof value === "function");

  if (typeof candidate !== "function") {
    throw new Error("No event score preparation function is available.");
  }

  return candidate as EventScorePreparer;
})();

function getScoreAthleteId(score: EventScoreRecord): string | undefined {
  return (score as AthleteScoreRecord).athleteId;
}

function getScoreMatchId(score: EventScoreRecord): string | undefined {
  return (score as AthleteScoreRecord).matchId;
}

export const SCORE_CORRECTION_WINDOW_MS = 45 * 60 * 1000;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readScores(): EventScoreRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as EventScoreRecord[]) : [];
  } catch (error) {
    console.error("Unable to read scores:", error);
    return [];
  }
}

function writeScores(scores: EventScoreRecord[]): void {
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

function requireActor(actorId: string, actorName: string): void {
  if (!actorId?.trim() || !actorName?.trim()) {
    throw new Error("The acting user's ID and name are required.");
  }
}

function requireEventAccess(eventId: string): void {
  if (!canScoreEvent(eventId)) {
    throw new Error(
      "Access denied. You must be an active, unexpired In-Charge assigned to this event."
    );
  }
}

function canScoreEventForCurrentUser(
  access: NonNullable<ReturnType<typeof getCurrentInchargeAccess>>
): boolean {
  return (
    access.role === "Scoring Incharge" &&
    access.accessType === "Temporary" &&
    access.active &&
    !access.expired
  );
}

function requireCurrentActor(actorId: string, actorName: string): void {
  requireActor(actorId, actorName);
  const access = getCurrentInchargeAccess();

  if (
    !access ||
    !canScoreEventForCurrentUser(access) ||
    access.userName.trim().toLowerCase() !== actorName.trim().toLowerCase()
  ) {
    throw new Error("The current In-Charge is not authorized to score.");
  }
}

function createAuditEntry(
  entry: Omit<ScoreAuditEntry, "id" | "timestamp">
): ScoreAuditEntry {
  return {
    ...entry,
    id: createId(),
    timestamp: new Date().toISOString(),
  };
}

/*
 * Store a snapshot in the central Admin Audit record.
 * The score record's auditLog remains the detailed source of truth.
 */
function recordAdminAudit(
  score: EventScoreRecord,
  action: "Score Saved" | "Score Submitted" | "Score Corrected" | "Score Locked",
  actorName: string
): void {
  const matchId = getScoreMatchId(score);
  if (!matchId) return;

  const latestEntry = score.auditLog[score.auditLog.length - 1];

  try {
    addScoreAudit(matchId, action, actorName, {
      eventId: score.eventId,
      scoreRecordId: score.id,
      athleteId: getScoreAthleteId(score),
      scoringEngine: String(score.scoringEngine),
      status: score.status,
      // Snapshot the data at the time of this audit action.
      scoreData: score.data,
      previousValue: latestEntry?.previousValue,
      newValue: latestEntry?.newValue,
      reason: latestEntry?.reason,
    });
  } catch (error) {
    // Do not discard a successfully persisted score if the summary log fails.
    console.error("Unable to write central Admin Audit entry:", error);
  }
}

function requireCorrectionWindow(score: EventScoreRecord): void {
  if (score.status !== "submitted" || !score.submittedAt) {
    throw new Error("Only submitted scores can be corrected.");
  }

  const submittedTime = new Date(score.submittedAt).getTime();

  if (
    !Number.isFinite(submittedTime) ||
    Date.now() - submittedTime >= SCORE_CORRECTION_WINDOW_MS
  ) {
    throw new Error("The 45-minute score correction window has expired.");
  }
}

// READ FUNCTIONS

export function getAllScores(): EventScoreRecord[] {
  return readScores();
}

export function getScoresByEvent(eventId: string): EventScoreRecord[] {
  return readScores().filter((score) => score.eventId === eventId);
}

export function getScoresByMatch(matchId: string): EventScoreRecord[] {
  return readScores().filter((score) => getScoreMatchId(score) === matchId);
}

export function getScoresByAthlete(
  eventId: string,
  athleteId: string
): EventScoreRecord[] {
  return readScores().filter(
    (score) =>
      score.eventId === eventId &&
      getScoreAthleteId(score) === athleteId
  );
}

export function getScoreByMatchAndAthlete(
  matchId: string,
  athleteId: string
): EventScoreRecord | null {
  return (
    readScores().find(
      (score) =>
        getScoreMatchId(score) === matchId &&
        getScoreAthleteId(score) === athleteId
    ) ?? null
  );
}

export function getScoreById(scoreId: string): EventScoreRecord | null {
  return readScores().find((score) => score.id === scoreId) ?? null;
}

// CREATE SCORES

type CreateScoreInput = {
  eventId: string;
  scoringEngine: EventScoreRecord["scoringEngine"];
  data: SportScoreData;
  sportId?: string;
  matchId?: string;
  athleteId?: string;
  actorId: string;
  actorName: string;
};

export function createScore(input: CreateScoreInput): EventScoreRecord {
  if (typeof window === "undefined") {
    throw new Error("Scores can only be created in the browser.");
  }

  requireCurrentActor(input.actorId, input.actorName);
  requireEventAccess(input.eventId);

  const matchId = input.matchId?.trim() || undefined;
  const athleteId = input.athleteId?.trim() || undefined;
  const scores = readScores();

  if (
    matchId &&
    athleteId &&
    scores.some(
      (score) =>
        getScoreMatchId(score) === matchId &&
        getScoreAthleteId(score) === athleteId
    )
  ) {
    throw new Error(
      "A score record already exists for this athlete in this match."
    );
  }

  const now = new Date().toISOString();

  const record: AthleteScoreRecord = {
    id: createId(),
    eventId: input.eventId,
    matchId,
    athleteId,
    sportId: input.sportId,
    scoringEngine: input.scoringEngine,
    status: "draft",
    data: input.data,
    createdAt: now,
    updatedAt: now,
    auditLog: [
      createAuditEntry({
        action: "score_created",
        actorId: input.actorId,
        actorName: input.actorName,
        newValue: input.data,
      }),
    ],
  };

  writeScores([...scores, record]);
  recordAdminAudit(record, "Score Saved", input.actorName);
  return record;
}

export function createScoreForEvent(
  event: SportEvent,
  actorId: string,
  actorName: string
): EventScoreRecord {
  requireEventAccess(event.id);
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

export function createScoreForMatchAthlete(
  event: SportEvent,
  matchId: string,
  athleteId: string,
  actorId: string,
  actorName: string
): EventScoreRecord {
  if (!matchId.trim()) throw new Error("A match ID is required.");
  if (!athleteId.trim()) throw new Error("An athlete ID is required.");

  requireEventAccess(event.id);
  const prepared = prepareEventScore(event, { matchId, athleteId });

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

// UPDATE DRAFT SCORE

export function updateDraftScore(
  scoreId: string,
  data: SportScoreData,
  actorId: string,
  actorName: string,
  reason: string
): EventScoreRecord {
  requireCurrentActor(actorId, actorName);

  if (!reason?.trim()) {
    throw new Error("Please provide a reason for the score change.");
  }

  const scores = readScores();
  const index = scores.findIndex((score) => score.id === scoreId);
  if (index === -1) throw new Error("Score record not found.");

  const current = scores[index];
  requireEventAccess(current.eventId);

  if (current.status !== "draft") {
    throw new Error("Only draft scores can be edited here.");
  }

  const updated: EventScoreRecord = {
    ...current,
    data,
    updatedAt: new Date().toISOString(),
    auditLog: [
      ...current.auditLog,
      createAuditEntry({
        action: "draft_score_updated",
        actorId,
        actorName,
        previousValue: current.data,
        newValue: data,
        reason: reason.trim(),
      }),
    ],
  };

  scores[index] = updated;
  writeScores(scores);
  recordAdminAudit(updated, "Score Saved", actorName);
  return updated;
}

// SUBMIT SCORE

export function submitScore(
  scoreId: string,
  actorId: string,
  actorName: string
): EventScoreRecord {
  requireCurrentActor(actorId, actorName);

  const scores = readScores();
  const index = scores.findIndex((score) => score.id === scoreId);
  if (index === -1) throw new Error("Score record not found.");

  const current = scores[index];
  requireEventAccess(current.eventId);

  if (current.status !== "draft") {
    throw new Error("Only draft scores can be submitted.");
  }

  const now = new Date().toISOString();

  const updated: EventScoreRecord = {
    ...current,
    status: "submitted",
    submittedAt: now,
    submittedBy: actorId,
    updatedAt: now,
    auditLog: [
      ...current.auditLog,
      createAuditEntry({
        action: "score_submitted",
        actorId,
        actorName,
        previousValue: current.status,
        newValue: "submitted",
      }),
    ],
  };

  scores[index] = updated;
  writeScores(scores);
  recordAdminAudit(updated, "Score Submitted", actorName);
  return updated;
}

// CORRECT SUBMITTED SCORE

export function correctSubmittedScore(
  scoreId: string,
  data: SportScoreData,
  actorId: string,
  actorName: string,
  reason: string
): EventScoreRecord {
  requireCurrentActor(actorId, actorName);

  if (!reason?.trim()) {
    throw new Error("Please provide a reason for the correction.");
  }

  const scores = readScores();
  const index = scores.findIndex((score) => score.id === scoreId);
  if (index === -1) throw new Error("Score record not found.");

  const current = scores[index];
  requireEventAccess(current.eventId);
  requireCorrectionWindow(current);

  const updated: EventScoreRecord = {
    ...current,
    data,
    updatedAt: new Date().toISOString(),
    auditLog: [
      ...current.auditLog,
      createAuditEntry({
        action: "submitted_score_corrected",
        actorId,
        actorName,
        previousValue: current.data,
        newValue: data,
        reason: reason.trim(),
      }),
    ],
  };

  scores[index] = updated;
  writeScores(scores);
  recordAdminAudit(updated, "Score Corrected", actorName);
  return updated;
}

// LOCK SCORE

export function lockScore(
  scoreId: string,
  actorId: string,
  actorName: string
): EventScoreRecord {
  requireCurrentActor(actorId, actorName);

  const scores = readScores();
  const index = scores.findIndex((score) => score.id === scoreId);
  if (index === -1) throw new Error("Score record not found.");

  const current = scores[index];
  requireEventAccess(current.eventId);

  if (current.status !== "submitted") {
    throw new Error("Only submitted scores can be locked.");
  }

  const now = new Date().toISOString();

  const updated: EventScoreRecord = {
    ...current,
    status: "locked",
    lockedAt: now,
    lockedBy: actorId,
    updatedAt: now,
    auditLog: [
      ...current.auditLog,
      createAuditEntry({
        action: "score_locked",
        actorId,
        actorName,
        previousValue: current.status,
        newValue: "locked",
      }),
    ],
  };

  scores[index] = updated;
  writeScores(scores);
  recordAdminAudit(updated, "Score Locked", actorName);
  return updated;
}

// AUDIT AND STATUS

export function getScoreAuditLog(scoreId: string): ScoreAuditEntry[] {
  return getScoreById(scoreId)?.auditLog ?? [];
}

export function getScoresByStatus(status: ScoreStatus): EventScoreRecord[] {
  return readScores().filter((score) => score.status === status);
}
