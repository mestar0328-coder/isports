export type BracketMatch = {
  id: string;
  eventId: string;
  teamA: string;
  teamB: string;
  sourceMatchA?: string;
  sourceMatchB?: string;
  status: "Waiting" | "Ready" | "Completed";
  winner?: string;
};

export type TournamentBracket = {
  eventId: string;
  matches: BracketMatch[];
  tournamentWinner?: string;
  updatedAt: string;
};

const STORAGE_KEY = "isports_brackets";

export function getBrackets(): TournamentBracket[] {
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

export function saveBrackets(brackets: TournamentBracket[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(brackets)
  );
}

export function getBracketByEventId(
  eventId: string
): TournamentBracket | undefined {
  const brackets = getBrackets();

  return brackets.find(
    (bracket) => bracket.eventId === eventId
  );
}

export function saveBracket(
  bracket: TournamentBracket
) {
  const brackets = getBrackets();

  const existingIndex = brackets.findIndex(
    (item) => item.eventId === bracket.eventId
  );

  if (existingIndex >= 0) {
    brackets[existingIndex] = bracket;
  } else {
    brackets.push(bracket);
  }

  saveBrackets(brackets);
}

export function deleteBracket(eventId: string) {
  const brackets = getBrackets();

  const updatedBrackets = brackets.filter(
    (bracket) => bracket.eventId !== eventId
  );

  saveBrackets(updatedBrackets);
}