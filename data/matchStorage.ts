export type MatchStatus = "Upcoming" | "Live" | "Completed";

export type StoredMatch = {
  id: string;
  eventId: string;
  teamA: string;
  teamB: string;
  date: string;
  status: MatchStatus;
};

const STORAGE_KEY = "isports_matches";

export function getMatches(): StoredMatch[] {
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

export function saveMatches(matches: StoredMatch[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(matches)
  );
}

export function saveMatch(match: StoredMatch) {
  const matches = getMatches();

  const existingIndex = matches.findIndex(
    (item) => item.id === match.id
  );

  if (existingIndex >= 0) {
    matches[existingIndex] = match;
  } else {
    matches.push(match);
  }

  saveMatches(matches);
}