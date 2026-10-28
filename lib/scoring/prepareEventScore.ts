import type { SportEvent } from "@/types/events";
import type { SportScoreData } from "@/types/scoring";
import { resolveScoringEngine } from "@/lib/scoring/resolveEngine";
import { createInitialScore } from "@/lib/scoring/createInitialScore";

export type PreparedEventScore = {
eventId: string;
sportId?: string;
scoringEngine: ReturnType<typeof resolveScoringEngine>;
data: SportScoreData;
};

export function prepareEventScore(
event: SportEvent
): PreparedEventScore {
if (!event.id.trim()) {
throw new Error("An event ID is required.");
}

const scoringEngine = resolveScoringEngine(event);

return {
eventId: event.id,
sportId: event.sportId,
scoringEngine,
data: createInitialScore(
scoringEngine,
event.scoringConfig ?? {}
),
};
}