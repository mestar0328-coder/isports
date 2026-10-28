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
import { prepareEventScore } from "../../lib/scoring/prepareEventScore";

const STORAGE_KEY = "isports_scores";
export const SCORE_CORRECTION_WINDOW_MS = 45 * 60 * 1000;

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
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
    return Array.isArray(parsed)
      ? (parsed as EventScoreRecord[])
      : [];
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

function requireCurrentActor(
  actorId: string,
  actorName: string
): void {
  requireActor(actorId, actorName);

  const access = getCurrentInchargeAccess();

  if (
    !access ||
    !canScoreEventForCurrentUser(access) ||
    access.userName.trim().toLowerCase() !==
      actorName.trim().toLowerCase()
  ) {
    throw new Error("The current In-Charge is not authorized to score.");
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

function createAuditEntry(
  entry: Omit<ScoreAuditEntry, "id" | "timestamp">
): ScoreAuditEntry {
  return {
    ...entry,
    id: createId(),
    timestamp: new Date().toISOString(),
  };
}

function requireCorrectionWindow(
  score: EventScoreRecord
): void {
  if (score.status !== "submitted" || !score.submittedAt) {
    throw new Error("Only submitted scores can be corrected.");
  }

  const submittedTime = new Date(score.submittedAt).getTime();

  if (
    !Number.isFinite(submittedTime) ||
    Date.now() - submittedTime >= SCORE_CORRECTION_WINDOW_MS
  ) {
    throw new Error(
      "The 45-minute score correction window has expired."
    );
  }
}

export function getAllScores(): EventScoreRecord[] {
  return readScores();
}

export function getScoresByEvent(
  eventId: string
): EventScoreRecord[] {
  return readScores().filter((score) => score.eventId === eventId);
}

export function getScoreById(
  scoreId: string
): EventScoreRecord | null {
  return readScores().find((score) => score.id === scoreId) ?? null;
}

type CreateScoreInput = {
  eventId: string;
  scoringEngine: EventScoreRecord["scoringEngine"];
  data: SportScoreData;
  sportId?: string;
  actorId: string;
  actorName: string;
};

export function createScore(
  input: CreateScoreInput
): EventScoreRecord {
  if (typeof window === "undefined") {
    throw new Error("Scores can only be created in the browser.");
  }

  requireCurrentActor(input.actorId, input.actorName);
  requireEventAccess(input.eventId);

  const scores = readScores();

  const now = new Date().toISOString();

  const record: EventScoreRecord = {
    id: createId(),
    eventId: input.eventId,
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

  const now = new Date().toISOString();

  const updated: EventScoreRecord = {
    ...current,
    data,
    updatedAt: now,
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
  return updated;
}

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
  return updated;
}

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

  const now = new Date().toISOString();

  const updated: EventScoreRecord = {
    ...current,
    data,
    updatedAt: now,
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
  return updated;
}

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
  return updated;
}

export function getScoreAuditLog(
  scoreId: string
): ScoreAuditEntry[] {
  return getScoreById(scoreId)?.auditLog ?? [];
}

export function getScoresByStatus(
  status: ScoreStatus
): EventScoreRecord[] {
  return readScores().filter((score) => score.status === status);
}