import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const authMocks = vi.hoisted(() => ({
  canScoreEvent: vi.fn(),
  getCurrentInchargeAccess: vi.fn(),
}));

vi.mock("@/data/inchargeAuth", () => authMocks);

import {
  createScore,
  updateDraftScore,
  submitScore,
  correctSubmittedScore,
  getAllScores,
  getScoreAuditLog,
  lockScore,
  SCORE_CORRECTION_WINDOW_MS,
} from "@/data/data/scoringStorage";

import {
  getScoreAudit,
} from "@/data/scoreAudit";

const ACTOR_ID = "incharge-1";
const ACTOR_NAME = "Test In-Charge";
const EVENT_ID = "event-1";

const SCORE_KEY = "isports_event_scores";
const AUDIT_KEY = "isports_score_audit";
const RECOVERY_KEY = "isports_score_recovery";

function createStorageMock() {
  const values = new Map<string, string>();
  let failingKey: string | null = null;

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },

    setItem(key: string, value: string) {
      if (key === failingKey) {
        throw new Error("Simulated storage failure");
      }

      values.set(key, String(value));
    },

    removeItem(key: string) {
      values.delete(key);
    },

    clear() {
      values.clear();
    },

    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },

    get length() {
      return values.size;
    },

    failOn(key: string | null) {
      failingKey = key;
    },
  };
}

const storage = createStorageMock();

function validRaceScore(elapsedMilliseconds = 12500) {
  return {
    athleteId: "athlete-1",
    elapsedMilliseconds,
  };
}

function createDraft() {
  return createScore({
    eventId: EVENT_ID,
    scoringEngine: "time-race",
    data: validRaceScore(),
    athleteId: "athlete-1",
    actorId: ACTOR_ID,
    actorName: ACTOR_NAME,
  });
}

describe("Scoring workflow", () => {
  beforeEach(() => {
    storage.clear();

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-06T04:00:00.000Z"));

    authMocks.canScoreEvent.mockReturnValue(true);

    authMocks.getCurrentInchargeAccess.mockReturnValue({
      userId: ACTOR_ID,
      userName: ACTOR_NAME,
      username: "test-incharge",
      role: "Scoring Incharge",
      assignedEventIds: [EVENT_ID],
      accessType: "Temporary",
      active: true,
      expired: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("does not start a new score operation when pending recovery fails", () => {
    const pendingOperation = {
      auditId: "recovery-first",
      scores: [],
      matchId: "event:event-1",
      action: "Score Saved",
      performedBy: "Previous In-Charge",
      details: {
        eventId: "event-1",
        scoreRecordId: "previous-score",
        actorId: "previous-user",
        status: "draft",
      },
    };

    storage.setItem(
      RECOVERY_KEY,
      JSON.stringify(pendingOperation)
    );

    const originalJournal = storage.getItem(RECOVERY_KEY);

    storage.failOn(AUDIT_KEY);

    expect(() => createDraft()).toThrow(
      "Unable to save the score audit record."
    );

    expect(storage.getItem(RECOVERY_KEY)).toBe(originalJournal);

    expect(
      JSON.parse(storage.getItem(SCORE_KEY) || "[]")
    ).toEqual([]);

    storage.failOn(null);

    // Recover the original operation successfully.
    getAllScores();

    expect(getScoreAudit()).toHaveLength(1);
    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
  });

  it("creates a draft score and records its audit entry", () => {
    const score = createDraft();

    expect(score.status).toBe("draft");
    expect(score.eventId).toBe(EVENT_ID);
    expect(score.scoringEngine).toBe("time-race");
    expect(score.data).toEqual(validRaceScore());

    const saved = getAllScores();

    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(score.id);

    expect(getScoreAuditLog(score.id)).toHaveLength(1);
    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
  });

  it("updates a draft score when a reason is provided", () => {
    const score = createDraft();

    const updated = updateDraftScore(
      score.id,
      validRaceScore(11000),
      ACTOR_ID,
      ACTOR_NAME,
      "Corrected timing entry"
    );

    expect(updated.status).toBe("draft");
    expect(updated.data).toEqual(validRaceScore(11000));

    expect(updated.auditLog).toHaveLength(2);
    expect(updated.auditLog[1].reason).toBe(
      "Corrected timing entry"
    );
  });

  it("rejects a draft update without a reason", () => {
    const score = createDraft();

    expect(() =>
      updateDraftScore(
        score.id,
        validRaceScore(11000),
        ACTOR_ID,
        ACTOR_NAME,
        "   "
      )
    ).toThrow("Please provide a reason for the score change.");

    expect(getAllScores()[0].data).toEqual(validRaceScore());
  });

  it("submits a draft score and records submission details", () => {
    const score = createDraft();

    const submitted = submitScore(
      score.id,
      ACTOR_ID,
      ACTOR_NAME
    );

    expect(submitted.status).toBe("submitted");
    expect(submitted.submittedAt).toBeDefined();
    expect(submitted.submittedBy).toBe(ACTOR_ID);

    expect(submitted.auditLog.at(-1)?.action).toBe(
      "score_submitted"
    );
  });

  it("rejects submitting a score that is already submitted", () => {
    const score = createDraft();

    submitScore(score.id, ACTOR_ID, ACTOR_NAME);

    expect(() =>
      submitScore(score.id, ACTOR_ID, ACTOR_NAME)
    ).toThrow("Only draft scores can be submitted.");
  });

  it("corrects a submitted score within the 45-minute window", () => {
    const score = createDraft();

    submitScore(score.id, ACTOR_ID, ACTOR_NAME);

    vi.advanceTimersByTime(
      SCORE_CORRECTION_WINDOW_MS - 1000
    );

    const corrected = correctSubmittedScore(
      score.id,
      validRaceScore(10500),
      ACTOR_ID,
      ACTOR_NAME,
      "Timing correction"
    );

    expect(corrected.status).toBe("submitted");
    expect(corrected.data).toEqual(validRaceScore(10500));

    expect(corrected.auditLog.at(-1)?.action).toBe(
      "submitted_score_corrected"
    );

    expect(corrected.auditLog.at(-1)?.reason).toBe(
      "Timing correction"
    );
  });

  it("rejects correction without a reason", () => {
    const score = createDraft();

    submitScore(score.id, ACTOR_ID, ACTOR_NAME);

    expect(() =>
      correctSubmittedScore(
        score.id,
        validRaceScore(10500),
        ACTOR_ID,
        ACTOR_NAME,
        " "
      )
    ).toThrow(
      "Please provide a reason for the score correction."
    );
  });

  it("automatically locks a submitted score after 45 minutes", () => {
    const score = createDraft();

    submitScore(score.id, ACTOR_ID, ACTOR_NAME);

    vi.advanceTimersByTime(SCORE_CORRECTION_WINDOW_MS);

    const saved = getAllScores();

    expect(saved[0].status).toBe("locked");
    expect(saved[0].lockedBy).toBe("system");
    expect(saved[0].lockedAt).toBeDefined();

    expect(saved[0].auditLog.at(-1)?.action).toBe(
      "score_locked"
    );
  });

  it("rejects correction after the correction window expires", () => {
    const score = createDraft();

    submitScore(score.id, ACTOR_ID, ACTOR_NAME);

    vi.advanceTimersByTime(SCORE_CORRECTION_WINDOW_MS);

    expect(() =>
      correctSubmittedScore(
        score.id,
        validRaceScore(10500),
        ACTOR_ID,
        ACTOR_NAME,
        "Late correction"
      )
    ).toThrow("Only submitted scores can be corrected.");
  });

  it("manually locks a submitted score", () => {
    const score = createDraft();

    submitScore(score.id, ACTOR_ID, ACTOR_NAME);

    const locked = lockScore(
      score.id,
      ACTOR_ID,
      ACTOR_NAME
    );

    expect(locked.status).toBe("locked");
    expect(locked.lockedBy).toBe(ACTOR_ID);

    expect(locked.auditLog.at(-1)?.action).toBe(
      "score_locked"
    );
  });

  it("rejects editing a locked score", () => {
    const score = createDraft();

    submitScore(score.id, ACTOR_ID, ACTOR_NAME);

    lockScore(score.id, ACTOR_ID, ACTOR_NAME);

    expect(() =>
      updateDraftScore(
        score.id,
        validRaceScore(10500),
        ACTOR_ID,
        ACTOR_NAME,
        "Attempted edit"
      )
    ).toThrow("Only draft scores can be edited here.");
  });

  it("rejects scoring when the In-Charge is not assigned to the event", () => {
    authMocks.canScoreEvent.mockReturnValue(false);

    expect(() => createDraft()).toThrow(
      "Access denied. You must be an active, unexpired In-Charge assigned to this event."
    );

    expect(getAllScores()).toHaveLength(0);
  });

  it("rejects a mismatched In-Charge identity", () => {
    authMocks.getCurrentInchargeAccess.mockReturnValue({
      userId: "another-user",
      userName: "Another User",
      username: "another",
      role: "Scoring Incharge",
      assignedEventIds: [EVENT_ID],
      accessType: "Temporary",
      active: true,
      expired: false,
    });

    expect(() => createDraft()).toThrow(
      "The current In-Charge identity does not match the active account."
    );

    expect(getAllScores()).toHaveLength(0);
  });

  it("rejects invalid score data", () => {
    expect(() =>
      createScore({
        eventId: EVENT_ID,
        scoringEngine: "time-race",
        data: {
          athleteId: "athlete-1",
          elapsedMilliseconds: -100,
        },
        actorId: ACTOR_ID,
        actorName: ACTOR_NAME,
      })
    ).toThrow();
  });

  it("rejects duplicate team scores in the same match", () => {
    const teamScore = { values: {} };

    createScore({
      eventId: EVENT_ID,
      scoringEngine: "goal-points",
      data: teamScore,
      matchId: "team-match-1",
      actorId: ACTOR_ID,
      actorName: ACTOR_NAME,
    });

    expect(() =>
      createScore({
        eventId: EVENT_ID,
        scoringEngine: "goal-points",
        data: teamScore,
        matchId: "team-match-1",
        actorId: ACTOR_ID,
        actorName: ACTOR_NAME,
      })
    ).toThrow(
      "A team score record already exists for this match."
    );
  });

  it("rejects duplicate athlete scores in the same match", () => {
    createScore({
      eventId: EVENT_ID,
      scoringEngine: "time-race",
      data: validRaceScore(),
      matchId: "match-1",
      athleteId: "athlete-1",
      actorId: ACTOR_ID,
      actorName: ACTOR_NAME,
    });

    expect(() =>
      createScore({
        eventId: EVENT_ID,
        scoringEngine: "time-race",
        data: validRaceScore(13000),
        matchId: "match-1",
        athleteId: "athlete-1",
        actorId: ACTOR_ID,
        actorName: ACTOR_NAME,
      })
    ).toThrow(
      "A score record already exists for this athlete in this match."
    );
  });
});
