import type { ScoringMethod } from "@/types/events";
import type { Sport, SportScoringEngine, SportScoringMethod } from "@/data/sportsStorage";
import { SCORING_ENGINES } from "@/lib/scoring/registry";

export type SportScoringProfile = Pick<
  Sport,
  | "scoringMethod"
  | "scoringEngine"
  | "scoringUnit"
  | "higherScoreWins"
  | "scoringConfig"
>;

const normalizeName = (name: string): string => {
  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");

  // Support the alternate spelling "Kabbadi".
  if (normalized === "kabbadi") {
    return "kabaddi";
  }

  return normalized;
};

const METHOD_ENGINE: Record<ScoringMethod, SportScoringEngine> = {
  time: "time-race",
  distance: "distance-height",
  height: "distance-height",
  points: "goal-points",
  goals: "goal-points",
  runs: "inning-runs",
  sets: "rally-sets",
  "win-draw-loss": "goal-points",
  manual: "custom",
  "rally-points": "rally-sets",
  innings: "inning-runs",
  cricket: "cricket",
  "combat-points": "combat-points",
  "judge-rounds": "judge-rounds",
  "judged-performance": "judged-performance",
  "target-shots": "target-precision",
  "bowling-frames": "bowling",
  "golf-strokes": "golf",
  "strength-repetitions": "strength-performance",
  "multi-event": "multi-event",
  "match-play": "golf",
  "digital-match": "digital-match",
};

export function getScoringEngineForMethod(
  method: ScoringMethod | SportScoringMethod,
  sportName?: string
): SportScoringEngine {
  const normalizedSport = sportName ? normalizeName(sportName) : "";

  // Sport-specific handling for sports that use innings or runs.
  if (method === "runs" || method === "innings") {
    if (normalizedSport === "cricket") {
      return "cricket";
    }

    return "inning-runs";
  }

  return METHOD_ENGINE[method];
}

const ENGINE_DEFAULTS: Record<
  SportScoringEngine,
  {
    method: SportScoringMethod;
    unit: string;
    higherScoreWins: boolean;
  }
> = {
  "goal-points": {
    method: "points",
    unit: "points",
    higherScoreWins: true,
  },
  "rally-sets": {
    method: "sets",
    unit: "sets",
    higherScoreWins: true,
  },
  "time-race": {
    method: "time",
    unit: "seconds",
    higherScoreWins: false,
  },
  "distance-height": {
    method: "distance",
    unit: "metres",
    higherScoreWins: true,
  },
  cricket: {
    method: "cricket",
    unit: "runs",
    higherScoreWins: true,
  },
  "inning-runs": {
    method: "innings",
    unit: "runs",
    higherScoreWins: true,
  },
  "combat-points": {
    method: "combat-points",
    unit: "points",
    higherScoreWins: true,
  },
  "judge-rounds": {
    method: "judge-rounds",
    unit: "points",
    higherScoreWins: true,
  },
  "judged-performance": {
    method: "judged-performance",
    unit: "points",
    higherScoreWins: true,
  },
  "target-precision": {
    method: "target-shots",
    unit: "points",
    higherScoreWins: true,
  },
  bowling: {
    method: "bowling-frames",
    unit: "pins",
    higherScoreWins: true,
  },
  golf: {
    method: "golf-strokes",
    unit: "strokes",
    higherScoreWins: false,
  },
  "strength-performance": {
    method: "strength-repetitions",
    unit: "kg",
    higherScoreWins: true,
  },
  "multi-event": {
    method: "multi-event",
    unit: "points",
    higherScoreWins: true,
  },
  "digital-match": {
    method: "digital-match",
    unit: "points",
    higherScoreWins: true,
  },
  custom: {
    method: "manual",
    unit: "points",
    higherScoreWins: true,
  },
};

const SPORT_METHOD_OVERRIDES: Record<
  string,
  Partial<SportScoringProfile>
> = {
  cricket: {
    scoringMethod: "cricket",
    scoringEngine: "cricket",
    scoringUnit: "runs",
    higherScoreWins: true,
  },
  baseball: {
    scoringMethod: "innings",
    scoringEngine: "inning-runs",
    scoringUnit: "runs",
    higherScoreWins: true,
  },
  softball: {
    scoringMethod: "innings",
    scoringEngine: "inning-runs",
    scoringUnit: "runs",
    higherScoreWins: true,
  },
  archery: {
    scoringMethod: "target-shots",
    scoringEngine: "target-precision",
    scoringUnit: "points",
    higherScoreWins: true,
    scoringConfig: {
      roundsCount: 5,
      arrowsPerRound: 3,
      minArrowScore: 0,
      maxArrowScore: 10,
    },
  },
  shooting: {
    scoringMethod: "target-shots",
    scoringEngine: "target-precision",
    scoringUnit: "points",
    higherScoreWins: true,
  },
  darts: {
    scoringMethod: "target-shots",
    scoringEngine: "target-precision",
    scoringUnit: "points",
    higherScoreWins: true,
  },
  golf: {
    scoringMethod: "golf-strokes",
    scoringEngine: "golf",
    scoringUnit: "strokes",
    higherScoreWins: false,
  },
  "long jump": {
    scoringMethod: "distance",
    scoringEngine: "distance-height",
    scoringUnit: "metres",
    higherScoreWins: true,
  },
  "triple jump": {
    scoringMethod: "distance",
    scoringEngine: "distance-height",
    scoringUnit: "metres",
    higherScoreWins: true,
  },
  "high jump": {
    scoringMethod: "height",
    scoringEngine: "distance-height",
    scoringUnit: "metres",
    higherScoreWins: true,
  },
  "pole vault": {
    scoringMethod: "height",
    scoringEngine: "distance-height",
    scoringUnit: "metres",
    higherScoreWins: true,
  },
};

export function getSportScoringProfile(
  sportName: string
): SportScoringProfile | undefined {
  const normalizedName = normalizeName(sportName);

  if (!normalizedName) {
    return undefined;
  }

  // Apply explicit sport-specific settings first.
  const override = SPORT_METHOD_OVERRIDES[normalizedName];

  if (override) {
    const engine = override.scoringEngine ?? "custom";
    const defaults = ENGINE_DEFAULTS[engine];

    return {
      scoringMethod: override.scoringMethod ?? defaults.method,
      scoringEngine: engine,
      scoringUnit: override.scoringUnit ?? defaults.unit,
      higherScoreWins:
        override.higherScoreWins ?? defaults.higherScoreWins,
      scoringConfig: override.scoringConfig ?? {},
    };
  }

  // Otherwise find the sport in the scoring engine registry.
  const engineDefinition = SCORING_ENGINES.find((engine) =>
    engine.sports.some(
      (registeredSport) =>
        normalizeName(registeredSport) === normalizedName
    )
  );

  if (!engineDefinition) {
    return undefined;
  }

  const engine = engineDefinition.id;
  const defaults = ENGINE_DEFAULTS[engine];

  return {
    scoringMethod: defaults.method,
    scoringEngine: engine,
    scoringUnit: defaults.unit,
    higherScoreWins: defaults.higherScoreWins,
    scoringConfig: {},
  };
}
