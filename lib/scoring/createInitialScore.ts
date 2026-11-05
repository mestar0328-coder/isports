import type { ScoringEngine } from "@/types/events";
import type { SportScoreData } from "@/types/scoring";

// --------------------------------------------------
// CONFIGURATION HELPERS
// --------------------------------------------------

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function positiveInteger(
  value: unknown,
  fallback: number
): number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  )
    ? value
    : fallback;
}

function nonNegativeNumber(
  value: unknown,
  fallback: number
): number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  )
    ? value
    : fallback;
}

function numberArray(
  value: unknown,
  fallback: number[]
): number[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  if (
    !value.every(
      (item) =>
        typeof item === "number" &&
        Number.isFinite(item) &&
        item >= 0
    )
  ) {
    return [...fallback];
  }

  return [...value];
}

// --------------------------------------------------
// INITIAL SCORE GENERATOR
// --------------------------------------------------

export function createInitialScore(
  engine: ScoringEngine,
  configuration: Record<string, unknown> = {}
): SportScoreData {
  const config = isRecord(configuration)
    ? configuration
    : {};

  switch (engine) {

    // ----------------------------------------------
    // CRICKET
    // ----------------------------------------------

    case "cricket":
      return {
        ...config,
        innings: Array.isArray(config.innings)
          ? config.innings
          : [],
        totalOvers: nonNegativeNumber(
          config.totalOvers,
          0
        ),
      } as SportScoreData;

    // ----------------------------------------------
    // INNING RUNS
    // ----------------------------------------------

    case "inning-runs": {
      const inningsCount = positiveInteger(
        config.inningsCount,
        9
      );

      return {
        ...config,
        inningsCount,
        teamA: numberArray(
          config.teamA,
          Array(inningsCount).fill(0)
        ),
        teamB: numberArray(
          config.teamB,
          Array(inningsCount).fill(0)
        ),
      } as SportScoreData;
    }

    // ----------------------------------------------
    // COMBAT POINTS
    // ----------------------------------------------

    case "combat-points":
      return {
        ...config,
        teamOrAthleteA: nonNegativeNumber(
          config.teamOrAthleteA,
          0
        ),
        teamOrAthleteB: nonNegativeNumber(
          config.teamOrAthleteB,
          0
        ),
        penaltiesA: nonNegativeNumber(
          config.penaltiesA,
          0
        ),
        penaltiesB: nonNegativeNumber(
          config.penaltiesB,
          0
        ),
        disqualifiedA:
          typeof config.disqualifiedA === "boolean"
            ? config.disqualifiedA
            : false,
        disqualifiedB:
          typeof config.disqualifiedB === "boolean"
            ? config.disqualifiedB
            : false,
      } as SportScoreData;

    // ----------------------------------------------
    // JUDGE ROUNDS
    // ----------------------------------------------

    case "judge-rounds":
      return {
        ...config,
        rounds: Array.isArray(config.rounds)
          ? config.rounds
          : [],
      } as SportScoreData;

    // ----------------------------------------------
    // JUDGED PERFORMANCE
    // ----------------------------------------------

    case "judged-performance":
      return {
        ...config,
        difficulty: nonNegativeNumber(
          config.difficulty,
          0
        ),
        execution: nonNegativeNumber(
          config.execution,
          0
        ),
        deductions: nonNegativeNumber(
          config.deductions,
          0
        ),
        finalScore: nonNegativeNumber(
          config.finalScore,
          0
        ),
      } as SportScoreData;

    // ----------------------------------------------
    // ARCHERY / TARGET PRECISION
    // ----------------------------------------------

    case "target-precision": {
      const roundsCount = positiveInteger(
        config.roundsCount,
        1
      );

      const arrowsPerRound = positiveInteger(
        config.arrowsPerRound,
        1
      );

      const rounds = Array.from(
        { length: roundsCount },
        () => Array(arrowsPerRound).fill(0)
      );

      return {
        athleteId:
          typeof config.athleteId === "string"
            ? config.athleteId
            : "",
        rounds,
        total: 0,
      };
    }

    // ----------------------------------------------
    // BOWLING
    // ----------------------------------------------

    case "bowling":
      return {
        ...config,
        frames: Array.isArray(config.frames)
          ? config.frames
          : Array.from(
              { length: 10 },
              () => ({
                rolls: [],
                score: 0,
              })
            ),
        total: nonNegativeNumber(
          config.total,
          0
        ),
      } as SportScoreData;

    // ----------------------------------------------
    // GOLF
    // ----------------------------------------------

    case "golf": {
      const strokesByHole = numberArray(
        config.strokesByHole,
        Array(18).fill(0)
      );

      const parByHole = numberArray(
        config.parByHole,
        Array(18).fill(4)
      );

      const totalStrokes = nonNegativeNumber(
        config.totalStrokes,
        0
      );

      const totalPar = nonNegativeNumber(
        config.totalPar,
        72
      );

      return {
        ...config,
        mode:
          config.mode === "match-play"
            ? "match-play"
            : "stroke-play",
        strokesByHole,
        parByHole,
        totalStrokes,
        totalPar,
        relativeToPar: nonNegativeNumber(
          config.relativeToPar,
          0
        ),
      } as SportScoreData;
    }

    // ----------------------------------------------
    // TIME-RACE
    // ----------------------------------------------

    case "time-race":
      return {
        ...config,
        athleteId:
          typeof config.athleteId === "string"
            ? config.athleteId
            : "",
        elapsedMilliseconds: nonNegativeNumber(
          config.elapsedMilliseconds,
          0
        ),
        ...(typeof config.finishPosition === "number" &&
        Number.isInteger(config.finishPosition) &&
        config.finishPosition > 0
          ? { finishPosition: config.finishPosition }
          : {}),
      } as SportScoreData;

    // ----------------------------------------------
    // DISTANCE / HEIGHT
    // ----------------------------------------------

    case "distance-height":
      return {
        ...config,
        athleteId:
          typeof config.athleteId === "string"
            ? config.athleteId
            : "",
        attempts: numberArray(
          config.attempts,
          []
        ),
        bestResult: nonNegativeNumber(
          config.bestResult,
          0
        ),
      } as SportScoreData;

    // ----------------------------------------------
    // RALLY / SETS
    // ----------------------------------------------

    case "rally-sets":
      return {
        ...config,
        sets: Array.isArray(config.sets)
          ? config.sets
          : [],
        gamesWonA: nonNegativeNumber(
          config.gamesWonA,
          0
        ),
        gamesWonB: nonNegativeNumber(
          config.gamesWonB,
          0
        ),
      } as SportScoreData;

    // ----------------------------------------------
    // STRENGTH PERFORMANCE
    // ----------------------------------------------

    case "strength-performance":
      return {
        ...config,
        athleteId:
          typeof config.athleteId === "string"
            ? config.athleteId
            : "",
        attempts: numberArray(
          config.attempts,
          []
        ),
        bestResult: nonNegativeNumber(
          config.bestResult,
          0
        ),
      } as SportScoreData;

    // ----------------------------------------------
    // MULTI-EVENT
    // ----------------------------------------------

    case "multi-event":
      return {
        ...config,
        athleteId:
          typeof config.athleteId === "string"
            ? config.athleteId
            : "",
        eventScores: Array.isArray(config.eventScores)
          ? config.eventScores
          : [],
        totalPoints: nonNegativeNumber(
          config.totalPoints,
          0
        ),
      } as SportScoreData;

    // ----------------------------------------------
    // GOALS / POINTS / DIGITAL / CUSTOM
    // ----------------------------------------------

    case "goal-points":
    case "digital-match":
    case "custom":
    default:
      return {
        ...config,
        values: isRecord(config.values)
          ? config.values
          : {},
        sides: Array.isArray(config.sides)
          ? config.sides
          : [
              {
                id: "A",
                name: "Side A",
                score: 0,
              },
              {
                id: "B",
                name: "Side B",
                score: 0,
              },
            ],
      } as SportScoreData;
  }
}