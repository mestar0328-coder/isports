export type RegistrationType = "team" | "individual";

export type CompetitionCategory =
| "athletics"
| "individual"
| "team"
| "racket"
| "goal"
| "race"
| "distance-height"
| "bat-ball"
| "combat"
| "judged"
| "target"
| "strength"
| "multi-event"
| "winter-board"
| "esports"
| "other";

export type GenderCategory = "men" | "women" | "mixed" | "open";

export type ScoringMethod =
| "time"
| "distance"
| "height"
| "points"
| "goals"
| "runs"
| "sets"
| "win-draw-loss"
| "manual"
| "rally-points"
| "innings"
| "cricket"
| "combat-points"
| "judge-rounds"
| "judged-performance"
| "target-shots"
| "bowling-frames"
| "golf-strokes"
| "strength-repetitions"
| "multi-event"
| "match-play"
| "digital-match";

export type ScoringEngine =
| "goal-points"
| "rally-sets"
| "time-race"
| "distance-height"
| "cricket"
| "inning-runs"
| "combat-points"
| "judge-rounds"
| "judged-performance"
| "target-precision"
| "bowling"
| "golf"
| "strength-performance"
| "multi-event"
| "digital-match"
| "custom";

export type SportEvent = {
id: string;
name: string;
sport: string;
sportId?: string;

description: string;
date: string;
venue: string;

rules: string[];
eligibility: string[];

minAge?: number;
maxAge?: number;

registrationDeadline: string;
registrationType: RegistrationType;
teamSize?: number;

category?: CompetitionCategory;
genderCategory?: GenderCategory;
ageGroup?: string;

scoringMethod?: ScoringMethod;
scoringEngine?: ScoringEngine;
scoringUnit?: string;
higherScoreWins?: boolean;

// Optional sport-specific configuration.
scoringConfig?: Record<string, unknown>;
};