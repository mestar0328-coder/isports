import type { ScoringEngine, SportEvent } from "@/types/events";
import {
  getScoringEngineById,
} from "@/lib/scoring/registry";
import {
  getScoringEngineForMethod,
  getSportScoringProfile,
} from "@/lib/scoring/configuration";

export class ScoringConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScoringConfigurationError";
  }
}

type ScoringEventConfiguration = Pick<
  SportEvent,
  "sport" | "scoringMethod" | "scoringEngine"
>;

export function resolveScoringEngine(
  event: ScoringEventConfiguration
): ScoringEngine {
  const sportName = event.sport?.trim() ?? "";
  const method = event.scoringMethod;

  // The selected scoring method is authoritative.
  // Never allow a previously saved engine to override it.
  if (method) {
    const engine = getScoringEngineForMethod(method, sportName);
    const registeredEngine = getScoringEngineById(engine);

    if (!registeredEngine) {
      throw new ScoringConfigurationError(
        `The scoring method "${method}" for "${sportName || "this sport"}" does not have a supported scoring engine. Please correct the sport's scoring configuration.`
      );
    }

    return registeredEngine.id;
  }

  // Legacy events without a saved method may use their registered
  // sport profile to recover the intended scoring configuration.
  if (sportName) {
    const profile = getSportScoringProfile(sportName);

    if (profile?.scoringEngine) {
      const registeredEngine = getScoringEngineById(
        profile.scoringEngine
      );

      if (registeredEngine) {
        return registeredEngine.id;
      }
    }
  }

  // Do not silently turn unknown or unconfigured sports into
  // generic custom-scoring events.
  throw new ScoringConfigurationError(
    `No scoring method is configured for "${sportName || "this sport"}". Select a supported scoring method in the sport or event configuration before continuing.`
  );
}
