import type { SportEvent } from "@/types/events";
import type {
  SportScoreData,
  TargetScore,
} from "@/types/scoring";

import { resolveScoringEngine } from "@/lib/scoring/resolveEngine";
import { createInitialScore } from "@/lib/scoring/createInitialScore";

export type PrepareEventScoreOptions = {
  matchId?: string;
  athleteId?: string;
};

export type PreparedEventScore = {
  eventId: string;
  matchId?: string;
  athleteId?: string;
  sportId?: string;
  scoringEngine: ReturnType<typeof resolveScoringEngine>;
  data: SportScoreData;
};

export function prepareEventScore(
  event: SportEvent,
  options: PrepareEventScoreOptions = {}
): PreparedEventScore {
  if (!event.id?.trim()) {
    throw new Error("An event ID is required.");
  }

  const matchId = options.matchId?.trim() || undefined;
  const athleteId = options.athleteId?.trim() || undefined;

  const scoringEngine = resolveScoringEngine(event);

  const data: SportScoreData = createInitialScore(
    scoringEngine,
    event.scoringConfig ?? {}
  );

  // Initialize the individual athlete's Archery score.
  if (scoringEngine === "target-precision") {
    const targetScore = data as TargetScore;

    targetScore.athleteId = athleteId ?? "";

    targetScore.rounds = targetScore.rounds.map(
      (round) => [...round]
    );

    targetScore.total = targetScore.rounds
      .flat()
      .reduce((sum, arrowScore) => sum + arrowScore, 0);
  }

  return {
    eventId: event.id,
    matchId,
    athleteId,
    sportId: event.sportId,
    scoringEngine,
    data,
  };
}