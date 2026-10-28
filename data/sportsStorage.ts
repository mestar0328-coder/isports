export type SportCategory =
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

export type SportGender =
| "men"
| "women"
| "mixed"
| "open";

export type SportScoringMethod =
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

export type SportScoringEngine =
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

export type Sport = {
id: string;
name: string;
icon: string;

category: SportCategory;
genderCategories: SportGender[];

registrationType: "individual" | "team";

scoringMethod: SportScoringMethod;
scoringEngine?: SportScoringEngine;
scoringUnit: string;
higherScoreWins: boolean;

// Optional settings for the selected sport.
scoringConfig?: Record<string, unknown>;
};

const STORAGE_KEY = "isports_sports";

const VALID_CATEGORIES: SportCategory[] = [
"athletics",
"individual",
"team",
"racket",
"goal",
"race",
"distance-height",
"bat-ball",
"combat",
"judged",
"target",
"strength",
"multi-event",
"winter-board",
"esports",
"other",
];

const VALID_GENDERS: SportGender[] = [
"men",
"women",
"mixed",
"open",
];

const VALID_METHODS: SportScoringMethod[] = [
"time",
"distance",
"height",
"points",
"goals",
"runs",
"sets",
"win-draw-loss",
"manual",
"rally-points",
"innings",
"cricket",
"combat-points",
"judge-rounds",
"judged-performance",
"target-shots",
"bowling-frames",
"golf-strokes",
"strength-repetitions",
"multi-event",
"match-play",
"digital-match",
];

const VALID_ENGINES: SportScoringEngine[] = [
"goal-points",
"rally-sets",
"time-race",
"distance-height",
"cricket",
"inning-runs",
"combat-points",
"judge-rounds",
"judged-performance",
"target-precision",
"bowling",
"golf",
"strength-performance",
"multi-event",
"digital-match",
"custom",
];

const normalizeId = (name: string): string =>
name
.toLowerCase()
.trim()
.replace(/[^a-z0-9]+/g, "-")
.replace(/^-+|-+$/g, "");

export const getCustomSports = (): Sport[] => {
if (typeof window === "undefined") return [];

try {
const stored = localStorage.getItem(STORAGE_KEY);
if (!stored) return [];

const parsed: unknown = JSON.parse(stored);
if (!Array.isArray(parsed)) return [];

return parsed
  .filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" &&
      item !== null &&
      typeof item.name === "string"
  )
  .map((item): Sport => {
    const name = String(item.name);

    const category = VALID_CATEGORIES.includes(
      item.category as SportCategory
    )
      ? (item.category as SportCategory)
      : "individual";

    const genderCategories: SportGender[] = Array.isArray(item.genderCategories)
      ? item.genderCategories.filter(
          (gender): gender is SportGender =>
            VALID_GENDERS.includes(gender as SportGender)
        )
      : ["men", "women", "mixed", "open"];

    const scoringMethod = VALID_METHODS.includes(
      item.scoringMethod as SportScoringMethod
    )
      ? (item.scoringMethod as SportScoringMethod)
      : "points";

    const scoringEngine = VALID_ENGINES.includes(
      item.scoringEngine as SportScoringEngine
    )
      ? (item.scoringEngine as SportScoringEngine)
      : undefined;

    return {
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id
          : normalizeId(name),

      name,
      icon: typeof item.icon === "string" ? item.icon : "🏅",
      category,
      genderCategories,
      registrationType:
        item.registrationType === "team" ? "team" : "individual",
      scoringMethod,
      scoringEngine,
      scoringUnit:
        typeof item.scoringUnit === "string"
          ? item.scoringUnit
          : "points",
      higherScoreWins:
        typeof item.higherScoreWins === "boolean"
          ? item.higherScoreWins
          : true,
      scoringConfig:
        typeof item.scoringConfig === "object" &&
        item.scoringConfig !== null &&
        !Array.isArray(item.scoringConfig)
          ? (item.scoringConfig as Record<string, unknown>)
          : undefined,
    };
  });

} catch {
return [];
}
};

export const getAllSports = (): Sport[] => getCustomSports();

export const addCustomSport = (sport: Sport): void => {
if (typeof window === "undefined") return;

const existing = getCustomSports();

const duplicate = existing.some(
(item) =>
item.id === sport.id ||
item.name.trim().toLowerCase() === sport.name.trim().toLowerCase()
);

if (duplicate) {
throw new Error("This sport already exists.");
}

localStorage.setItem(
STORAGE_KEY,
JSON.stringify([...existing, sport])
);
};

export const updateCustomSport = (updatedSport: Sport): void => {
if (typeof window === "undefined") return;

const existing = getCustomSports();

const duplicate = existing.some(
(item) =>
item.id !== updatedSport.id &&
item.name.trim().toLowerCase() ===
updatedSport.name.trim().toLowerCase()
);

if (duplicate) {
throw new Error("Another sport already uses this name.");
}

const found = existing.some((item) => item.id === updatedSport.id);

if (!found) {
throw new Error("Sport not found.");
}

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(
existing.map((item) =>
item.id === updatedSport.id ? updatedSport : item
)
)
);
};

export const deleteCustomSport = (id: string): void => {
if (typeof window === "undefined") return;

const updated = getCustomSports().filter((sport) => sport.id !== id);

localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};