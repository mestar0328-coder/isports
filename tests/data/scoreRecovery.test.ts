import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getAllScores,
} from "@/data/data/scoringStorage";

import {
  addScoreAuditWithId,
  clearScoreAudit,
  getScoreAudit,
} from "@/data/scoreAudit";

const SCORE_KEY = "isports_event_scores";
const AUDIT_KEY = "isports_score_audit";
const RECOVERY_KEY = "isports_score_recovery";

function createStorageMock() {
  const values = new Map<string, string>();

  let failingKey: string | null = null;

  const storage = {
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

  return storage;
}

type TestStorage = ReturnType<typeof createStorageMock>;

let storage: TestStorage;

function preparePendingOperation(
  overrides: Record<string, unknown> = {}
) {
  const operation = {
    auditId: "recovery-test-audit-1",
    scores: [],
    matchId: "event:event-1",
    action: "Score Saved",
    performedBy: "Test In-Charge",
    details: {
      eventId: "event-1",
      scoreRecordId: "score-1",
      actorId: "user-1",
      status: "draft",
    },
    ...overrides,
  };

  storage.setItem(
    RECOVERY_KEY,
    JSON.stringify(operation)
  );

  return operation;
}

describe("Score audit storage", () => {
  beforeEach(() => {
    storage = createStorageMock();

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);

    clearScoreAudit();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a central audit entry with a stable ID", () => {
    const entries = addScoreAuditWithId(
      "audit-stable-1",
      "event:event-1",
      "Score Saved",
      "Test In-Charge",
      {
        eventId: "event-1",
        scoreRecordId: "score-1",
        actorId: "user-1",
      }
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("audit-stable-1");
    expect(entries[0].action).toBe("Score Saved");
    expect(entries[0].performedBy).toBe("Test In-Charge");
  });

  it("does not duplicate an audit entry when the same ID is retried", () => {
    addScoreAuditWithId(
      "audit-stable-2",
      "event:event-1",
      "Score Saved",
      "Test In-Charge"
    );

    const entries = addScoreAuditWithId(
      "audit-stable-2",
      "event:event-1",
      "Score Saved",
      "Test In-Charge"
    );

    expect(entries).toHaveLength(1);
    expect(getScoreAudit()).toHaveLength(1);
  });

  it("rejects an empty audit ID", () => {
    expect(() =>
      addScoreAuditWithId(
        "",
        "event:event-1",
        "Score Saved",
        "Test In-Charge"
      )
    ).toThrow("An audit entry ID is required.");
  });

  it("rejects an empty audit reference", () => {
    expect(() =>
      addScoreAuditWithId(
        "audit-test",
        "",
        "Score Saved",
        "Test In-Charge"
      )
    ).toThrow("Audit reference and actor name are required.");
  });
});

describe("Score recovery journal", () => {
  beforeEach(() => {
    storage = createStorageMock();

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing when there is no pending operation", () => {
    const scores = getAllScores();

    expect(scores).toEqual([]);
    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
  });

  it("recovers a pending operation and creates its audit entry", () => {
    preparePendingOperation();

    const scores = getAllScores();

    expect(scores).toEqual([]);

    const audit = getScoreAudit();

    expect(audit).toHaveLength(1);
    expect(audit[0].id).toBe("recovery-test-audit-1");
    expect(audit[0].eventId).toBe("event-1");
    expect(audit[0].scoreRecordId).toBe("score-1");

    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
    expect(storage.getItem(SCORE_KEY)).toBe("[]");
  });

  it("preserves the complete score snapshot and change details during recovery", () => {
    const scoreSnapshot = {
      athleteId: "athlete-1",
      elapsedMilliseconds: 10500,
      status: "submitted",
    };

    const previousValue = {
      elapsedMilliseconds: 12500,
    };

    const newValue = {
      elapsedMilliseconds: 10500,
    };

    preparePendingOperation({
      details: {
        eventId: "event-1",
        scoreRecordId: "score-1",
        actorId: "user-1",
        status: "submitted",
        scoreData: scoreSnapshot,
        previousValue,
        newValue,
        reason: "Timing correction",
      },
    });

    getAllScores();

    const audit = getScoreAudit();

    expect(audit).toHaveLength(1);
    expect(audit[0].scoreData).toEqual(scoreSnapshot);
    expect(audit[0].previousValue).toEqual(previousValue);
    expect(audit[0].newValue).toEqual(newValue);
    expect(audit[0].reason).toBe("Timing correction");
    expect(audit[0].status).toBe("submitted");

    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
  });

  it("does not duplicate the audit entry when recovery is repeated", () => {
    preparePendingOperation();

    getAllScores();
    getAllScores();

    expect(getScoreAudit()).toHaveLength(1);
    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
  });

  it("preserves the recovery journal if audit storage fails", () => {
    preparePendingOperation();

    storage.failOn(AUDIT_KEY);

    expect(() => getAllScores()).toThrow(
      "Unable to save the score audit record."
    );

    expect(storage.getItem(RECOVERY_KEY)).not.toBeNull();

    storage.failOn(null);

    getAllScores();

    expect(getScoreAudit()).toHaveLength(1);
    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
  });

  it("preserves the recovery journal if score storage fails", () => {
    preparePendingOperation();

    storage.failOn(SCORE_KEY);

    expect(() => getAllScores()).toThrow(
      "Unable to save scores in browser storage."
    );

    expect(storage.getItem(RECOVERY_KEY)).not.toBeNull();
    expect(storage.getItem(AUDIT_KEY)).toBeNull();

    storage.failOn(null);

    getAllScores();

    expect(getScoreAudit()).toHaveLength(1);
    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
    expect(storage.getItem(SCORE_KEY)).toBe("[]");
  });

  it("pauses scoring when the recovery journal is damaged", () => {
    storage.setItem(RECOVERY_KEY, "{invalid-json");

    expect(() => getAllScores()).toThrow(
      "A pending score recovery record is damaged. Scoring is paused to protect score and audit data."
    );

    expect(storage.getItem(RECOVERY_KEY)).toBe("{invalid-json");
  });

  it("rejects a recovery journal with missing required fields", () => {
    storage.setItem(
      RECOVERY_KEY,
      JSON.stringify({
        auditId: "incomplete-operation",
        scores: [],
      })
    );

    expect(() => getAllScores()).toThrow(
      "A pending score recovery record is damaged. Scoring is paused to protect score and audit data."
    );
  });
});
