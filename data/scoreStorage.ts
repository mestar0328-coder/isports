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
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveScores(scores: StoredScore[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(scores)
  );
}

export function saveScore(score: StoredScore) {
  const scores = getScores();

  const existingIndex = scores.findIndex(
    (item) => item.matchId === score.matchId
  );

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
  const scores = getScores();

  return scores.find(
    (score) => score.matchId === matchId
  );
}

export function deleteScore(matchId: string) {
  const scores = getScores();

  const updatedScores = scores.filter(
    (score) => score.matchId !== matchId
  );

  saveScores(updatedScores);
}