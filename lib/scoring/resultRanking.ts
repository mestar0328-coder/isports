export type RankableResult = {
  total: number | null;
  elapsedMilliseconds: number | null;
  higherScoreWins: boolean;
};

/**
 * Determines whether the results belong to a time-based competition.
 */
export function isTimeRace<T extends RankableResult>(
  results: T[]
): boolean {
  return results.some(
    (result) => result.elapsedMilliseconds !== null
  );
}

/**
 * Checks whether a result has a valid score.
 */
export function hasResult(
  result: RankableResult,
  timeRace: boolean
): boolean {
  return timeRace
    ? result.elapsedMilliseconds !== null
    : result.total !== null;
}

/**
 * Compares two results.
 * Time races: lower time wins.
 * Other competitions: higher or lower score wins according to configuration.
 * Results without scores are placed last.
 */
export function compareResults(
  a: RankableResult,
  b: RankableResult,
  timeRace: boolean
): number {
  if (timeRace) {
    if (a.elapsedMilliseconds === null) return 1;
    if (b.elapsedMilliseconds === null) return -1;

    return a.elapsedMilliseconds - b.elapsedMilliseconds;
  }

  if (a.total === null) return 1;
  if (b.total === null) return -1;

  return a.higherScoreWins
    ? b.total - a.total
    : a.total - b.total;
}

/**
 * Returns a sorted copy without modifying the original results.
 */
export function sortResults<T extends RankableResult>(
  results: T[],
  timeRace: boolean
): T[] {
  return [...results].sort((a, b) =>
    compareResults(a, b, timeRace)
  );
}

/**
 * Gets the value used for ranking.
 */
export function getRankingValue(
  result: RankableResult,
  timeRace: boolean
): number | null {
  return timeRace
    ? result.elapsedMilliseconds
    : result.total;
}

/**
 * Calculates competition ranking.
 *
 * Example:
 * Scores: 100, 100, 90, 80
 * Ranks:  1,   1,   3,  4
 *
 * Scores: 100, 100, 100, 80
 * Ranks:  1,   1,   1,   4
 */
export function getCompetitionRank(
  index: number,
  currentValue: number | null,
  firstMatchingIndex: number,
  hasValidResult: boolean
): number | null {
  if (!hasValidResult || currentValue === null) {
    return null;
  }

  return firstMatchingIndex + 1;
}