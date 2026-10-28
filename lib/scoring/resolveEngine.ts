import type { ScoringEngine, SportEvent } from "@/types/events";
import {
findScoringEngineForSport,
getScoringEngineById,
} from "@/lib/scoring/registry";

export function resolveScoringEngine(
event: SportEvent
): ScoringEngine {
// 1. Use the engine explicitly selected for this event.
if (event.scoringEngine) {
const registeredEngine = getScoringEngineById(
event.scoringEngine
);

if (registeredEngine) {
  return registeredEngine.id;
}

return "custom";

}

// 2. Use the event's configured scoring method when possible.
if (event.scoringMethod) {
const methodToEngine: Partial<
Record<NonNullable<SportEvent["scoringMethod"]>, ScoringEngine>
> = {
time: "time-race",
distance: "distance-height",
height: "distance-height",
points: "goal-points",
goals: "goal-points",
runs: event.sport.trim().toLowerCase() === "cricket"
? "cricket"
: "inning-runs",
sets: "rally-sets",
"win-draw-loss": "goal-points",
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

const resolvedMethod = methodToEngine[event.scoringMethod];

if (resolvedMethod) {
  return resolvedMethod;
}

}

// 3. Fall back to the registry's sport mapping.
const matchingEngine = findScoringEngineForSport(event.sport);

if (matchingEngine) {
return matchingEngine.id;
}

// 4. Unknown or newly created sports use configurable scoring.
return "custom";
}