import type {
  ScoringEngine,
  SportEvent,
} from "@/types/events";

import {
  findScoringEngineForSport,
  getScoringEngineById,
} from "@/lib/scoring/registry";

import {
  getScoringEngineForMethod,
} from "@/lib/scoring/configuration";

// --------------------------------------------------
// CENTRALIZED ENGINE RESOLUTION
// --------------------------------------------------

export function resolveScoringEngine(
  event: Pick<
    SportEvent,
    "sport" | "scoringEngine" | "scoringMethod"
  >
): ScoringEngine {
  const sportName = event.sport?.trim() ?? "";

  // 1. Respect an explicitly configured supported engine.
  if (event.scoringEngine) {
    const registeredEngine = getScoringEngineById(
      event.scoringEngine
    );

    if (registeredEngine) {
      return registeredEngine.id;
    }
  }

  // 2. Resolve using the centralized scoring configuration.
  if (event.scoringMethod) {
    const configuredEngine = getScoringEngineForMethod(
      event.scoringMethod,
      sportName
    );

    const registeredEngine = getScoringEngineById(
      configuredEngine
    );

    if (registeredEngine) {
      return registeredEngine.id;
    }
  }

  // 3. Resolve from the registered sport configuration.
  const sportEngine = findScoringEngineForSport(sportName);

  if (sportEngine) {
    return sportEngine.id;
  }

  // 4. Safe fallback for unsupported or unconfigured sports.
  return "custom";
}