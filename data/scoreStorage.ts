export type ScoreStatus =
| "Draft"
| "Submitted"
| "Locked";

export type StoredScore = {
matchId: string;
teamA: string;
teamB: string;
scoreA: number;
scoreB: number;
status: ScoreStatus;
updatedAt: string;
};

const STORAGE_KEY = "isports_scores";

export function getScores(): StoredScore[] {
if (typeof window === "undefined") return [];

try {
const stored = localStorage.getItem(STORAGE_KEY);
if (!stored) return [];

const parsed: unknown = JSON.parse(stored);
if (!Array.isArray(parsed)) return [];

return parsed.filter(
  (item): item is StoredScore =>
    !!item &&
    typeof item === "object" &&
    typeof item.matchId === "string" &&
    typeof item.scoreA === "number" &&
    typeof item.scoreB === "number" &&
    ["Draft", "Submitted", "Locked"].includes(item.status)
);

} catch (error) {
console.error("Unable to read scores:", error);
return [];
}
}

export function saveScores(scores: StoredScore[]) {
if (typeof window === "undefined") return;

localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

export function saveScore(score: StoredScore) {
if (typeof window === "undefined") {
throw new Error("Scores can only be saved in the browser.");
}

if (!score.matchId.trim()) {
throw new Error("A valid match ID is required.");
}

const scores = getScores();

const existingIndex = scores.findIndex(
(item) => item.matchId === score.matchId
);

const existing = existingIndex >= 0
? scores[existingIndex]
: undefined;

if (existing?.status === "Locked") {
throw new Error("This score is locked and cannot be modified.");
}

if (existingIndex >= 0) {
scores[existingIndex] = score;
} else {
scores.push(score);
}

saveScores(scores);
}

export function getScoreByMatchId(
matchId: string
): StoredScore | undefined {
return getScores().find(
(score) => score.matchId === matchId
);
}

export function deleteScore(matchId: string) {
const scores = getScores();

const existing = scores.find(
(score) => score.matchId === matchId
);

if (existing?.status === "Locked") {
throw new Error("A locked score cannot be deleted.");
}

saveScores(
scores.filter((score) => score.matchId !== matchId)
);
}