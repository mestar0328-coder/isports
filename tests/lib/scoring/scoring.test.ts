import { describe, expect, it } from "vitest";

import {
  SCORING_ENGINES,
  getScoringEngines,
  getScoringEngineById,
  findScoringEngineForSport,
  isSupportedScoringEngine,
  getScoringEngineName,
} from "@/lib/scoring/registry";

import {
  resolveScoringEngine,
  ScoringConfigurationError,
} from "@/lib/scoring/resolveEngine";

import {
  isTimeRace,
  hasResult,
  compareResults,
  sortResults,
  getRankingValue,
  getCompetitionRank,
  type RankableResult,
} from "@/lib/scoring/resultRanking";

type EngineEvent = Parameters<typeof resolveScoringEngine>[0];

describe("Scoring engine registry", () => {
  it("contains all 16 scoring engines", () => {
    expect(SCORING_ENGINES).toHaveLength(16);
  });

  it("finds an engine by its ID", () => {
    expect(getScoringEngineById("cricket")?.name).toBe("Cricket");
  });

  it("returns undefined for an unknown engine ID", () => {
    expect(getScoringEngineById("unknown-engine")).toBeUndefined();
  });

  it("finds a sport without case sensitivity", () => {
    expect(findScoringEngineForSport("football")?.id).toBe(
      "goal-points"
    );
  });

  it("ignores extra spaces around a sport name", () => {
    expect(findScoringEngineForSport("  Cricket  ")?.id).toBe(
      "cricket"
    );
  });

  it("returns undefined for an empty sport name", () => {
    expect(findScoringEngineForSport("   ")).toBeUndefined();
  });

  it("recognizes supported engines", () => {
    expect(isSupportedScoringEngine("rally-sets")).toBe(true);
    expect(isSupportedScoringEngine("unknown-engine")).toBe(false);
  });

  it("returns the registered engine name", () => {
    expect(getScoringEngineName("golf")).toBe("Golf");
  });

  it("uses a fallback name for unknown engines", () => {
    expect(getScoringEngineName("unknown-engine")).toBe(
      "Custom Scoring"
    );
  });

  it("returns a defensive copy of the engine registry", () => {
    const engines = getScoringEngines();

    engines[0].sports.push("Test Sport");

    expect(
      findScoringEngineForSport("Test Sport")
    ).toBeUndefined();
  });
});

describe("Scoring engine resolution", () => {
  it("prioritizes the scoring method over a stale saved engine", () => {
    const event = {
      sport: "Football",
      scoringEngine: "cricket",
      scoringMethod: "points",
    } as EngineEvent;

    expect(resolveScoringEngine(event)).toBe("goal-points");
  });

  it("resolves a supported method for a custom sport", () => {
    const event = {
      sport: "Unknown Sport",
      scoringEngine: undefined,
      scoringMethod: "time",
    } as EngineEvent;

    expect(resolveScoringEngine(event)).toBe("time-race");
  });

  it("uses the cricket engine for cricket events", () => {
    const event = {
      sport: "Cricket",
      scoringEngine: undefined,
      scoringMethod: "runs",
    } as EngineEvent;

    expect(resolveScoringEngine(event)).toBe("cricket");
  });

  it("uses the selected method when a sport has a different default", () => {
    const event = {
      sport: "Badminton",
      scoringEngine: "goal-points",
      scoringMethod: "time",
    } as EngineEvent;

    expect(resolveScoringEngine(event)).toBe("time-race");
  });

  it("uses the registered sport profile for a legacy event without a method", () => {
    const event = {
      sport: "Badminton",
      scoringEngine: undefined,
      scoringMethod: undefined,
    } as EngineEvent;

    expect(resolveScoringEngine(event)).toBe("rally-sets");
  });

  it("uses custom scoring when manual scoring is explicitly selected", () => {
    const event = {
      sport: "Unknown Sport",
      scoringEngine: undefined,
      scoringMethod: "manual",
    } as EngineEvent;

    expect(resolveScoringEngine(event)).toBe("custom");
  });

  it("does not silently use custom scoring for an unknown sport", () => {
    const event = {
      sport: "Unknown Sport",
      scoringEngine: undefined,
      scoringMethod: undefined,
    } as EngineEvent;

    expect(() => resolveScoringEngine(event)).toThrow(
      ScoringConfigurationError
    );

    expect(() => resolveScoringEngine(event)).toThrow(
      /No scoring method is configured/
    );
  });

  it("rejects an unsupported runtime scoring method", () => {
    const event = {
      sport: "Football",
      scoringEngine: "goal-points",
      scoringMethod: "unsupported-method",
    } as unknown as EngineEvent;

    expect(() => resolveScoringEngine(event)).toThrow(
      ScoringConfigurationError
    );
  });
});

describe("Result ranking", () => {
  const result = (
    total: number | null,
    elapsedMilliseconds: number | null = null,
    higherScoreWins = true
  ): RankableResult => ({
    total,
    elapsedMilliseconds,
    higherScoreWins,
  });

  it("detects time-based competitions", () => {
    expect(
      isTimeRace([
        result(10, 12000),
        result(8, 13000),
      ])
    ).toBe(true);
  });

  it("detects non-time-based competitions", () => {
    expect(
      isTimeRace([
        result(10),
        result(8),
      ])
    ).toBe(false);
  });

  it("recognizes a result with a score", () => {
    expect(hasResult(result(25), false)).toBe(true);
    expect(hasResult(result(null), false)).toBe(false);
  });

  it("recognizes a result with a race time", () => {
    expect(hasResult(result(25, 12000), true)).toBe(true);
    expect(hasResult(result(25, null), true)).toBe(false);
  });

  it("ranks higher scores first when higher scores win", () => {
    expect(
      compareResults(result(100), result(90), false)
    ).toBeLessThan(0);
  });

  it("ranks lower scores first when lower scores win", () => {
    expect(
      compareResults(
        result(40, null, false),
        result(50, null, false),
        false
      )
    ).toBeLessThan(0);
  });

  it("ranks faster times first", () => {
    expect(
      compareResults(result(10, 12000), result(10, 13000), true)
    ).toBeLessThan(0);
  });

  it("places results without scores last", () => {
    expect(
      compareResults(result(null), result(10), false)
    ).toBeGreaterThan(0);
  });

  it("sorts results without modifying the original array", () => {
    const original = [
      result(50),
      result(100),
      result(75),
    ];

    const sorted = sortResults(original, false);

    expect(sorted.map((item) => item.total)).toEqual([
      100,
      75,
      50,
    ]);

    expect(original.map((item) => item.total)).toEqual([
      50,
      100,
      75,
    ]);
  });

  it("returns the correct ranking value", () => {
    expect(getRankingValue(result(90, 12000), false)).toBe(90);
    expect(getRankingValue(result(90, 12000), true)).toBe(12000);
  });

  it("returns null for an invalid result rank", () => {
    expect(getCompetitionRank(0, null, 0, false)).toBeNull();
  });

  it("calculates competition ranking with ties", () => {
    const values = [100, 100, 90, 80];

    const ranks = values.map((value, index) => {
      const firstMatchingIndex = values.indexOf(value);

      return getCompetitionRank(
        index,
        value,
        firstMatchingIndex,
        true
      );
    });

    expect(ranks).toEqual([1, 1, 3, 4]);
  });

  it("supports three-way ties", () => {
    const values = [100, 100, 100, 80];

    const ranks = values.map((value, index) =>
      getCompetitionRank(
        index,
        value,
        values.indexOf(value),
        true
      )
    );

    expect(ranks).toEqual([1, 1, 1, 4]);
  });
});
