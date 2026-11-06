"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getScores,
  type StoredScore,
} from "@/data/scoreStorage";

import { getEvents } from "@/data/eventsStorage";
import { getMatches } from "@/data/matchStorage";
import { getAllScores } from "@/data/data/scoringStorage";

import type { EventScoreRecord } from "@/types/scoring";

import {
  getCompetitionRank,
  getRankingValue,
  hasResult,
  isTimeRace as detectTimeRace,
  sortResults,
} from "@/lib/scoring/resultRanking";

type IndividualResult = {
  id: string;
  matchId: string;
  eventId: string;
  eventName: string;
  athleteName: string;
  total: number | null;
  elapsedMilliseconds: number | null;
  status: string;
  rounds: number[][];
  higherScoreWins: boolean;
};

type TeamResult = StoredScore & {
  eventName: string;
};

type IndividualMatchGroup = {
  key: string;
  eventId: string;
  matchId: string;
  results: IndividualResult[];
};

function isPublishedStatus(status: unknown): boolean {
  if (typeof status !== "string") return false;

  const normalized = status.trim().toLowerCase();

  return normalized === "submitted" || normalized === "locked";
}

function getWinner(score: StoredScore): string {
  if (score.scoreA > score.scoreB) return score.teamA;
  if (score.scoreB > score.scoreA) return score.teamB;

  return "Draw";
}

function formatRaceTime(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(2)} sec`;
}

export default function ResultsPage() {
  const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
  const [individualResults, setIndividualResults] = useState<
    IndividualResult[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadResults = () => {
      try {
        const events = getEvents();
        const matches = getMatches();

        // Only publish team scores with Submitted or Locked status.
        // Ignore scores whose match record no longer exists.
        const completedTeamScores = getScores().filter((score) => {
          return (
            isPublishedStatus(score.status) &&
            matches.some((match) => match.id === score.matchId)
          );
        });

        const mappedTeamResults: TeamResult[] =
          completedTeamScores.map((score) => {
            const match = matches.find(
              (item) => item.id === score.matchId
            );

            const event = events.find(
              (item) => item.id === match?.eventId
            );

            return {
              ...score,
              eventName: event?.name ?? "Tournament Event",
            };
          });

        // Only Submitted and Locked advanced scores are public.
        const completedIndividualScores = getAllScores().filter(
          (score: EventScoreRecord) =>
            isPublishedStatus(score.status)
        );

        const mappedIndividualResults: IndividualResult[] = [];

        completedIndividualScores.forEach((score: EventScoreRecord) => {
          if (!score.matchId || !score.athleteId) return;

          const match = matches.find(
            (item) => item.id === score.matchId
          );

          if (!match || match.matchType !== "individual") return;

          // Ensure the score belongs to the same event as the match.
          if (match.eventId !== score.eventId) return;

          const event = events.find(
            (item) => item.id === score.eventId
          );

          const participant = match.participants?.find(
            (item) => item.registrationId === score.athleteId
          );

          const scoreData = score.data as unknown as {
            total?: number;
            rounds?: number[][];
            elapsedMilliseconds?: number;
          };

          mappedIndividualResults.push({
            id: score.id,
            matchId: score.matchId,
            eventId: score.eventId,
            eventName: event?.name ?? "Tournament Event",
            athleteName: participant?.name ?? "Unknown Athlete",

            total:
              typeof scoreData.total === "number" &&
              Number.isFinite(scoreData.total)
                ? scoreData.total
                : null,

            elapsedMilliseconds:
              typeof scoreData.elapsedMilliseconds === "number" &&
              Number.isFinite(scoreData.elapsedMilliseconds)
                ? scoreData.elapsedMilliseconds
                : null,

            status: score.status,

            rounds: Array.isArray(scoreData.rounds)
              ? scoreData.rounds.filter(
                  (round): round is number[] =>
                    Array.isArray(round) &&
                    round.every(
                      (value) =>
                        typeof value === "number" &&
                        Number.isFinite(value)
                    )
                )
              : [],

            higherScoreWins: event?.higherScoreWins !== false,
          });
        });

        if (isMounted) {
          setTeamResults(mappedTeamResults);
          setIndividualResults(mappedIndividualResults);
        }
      } catch (error) {
        console.error("Unable to load results:", error);

        if (isMounted) {
          setTeamResults([]);
          setIndividualResults([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      isMounted = false;
    };
  }, []);

  // Group individual results by both event ID and match ID.
  const individualMatchGroups: IndividualMatchGroup[] = Array.from(
    individualResults
      .reduce((groups, result) => {
        const key = JSON.stringify([
          result.eventId,
          result.matchId,
        ]);

        const existing = groups.get(key);

        if (existing) {
          existing.results.push(result);
        } else {
          groups.set(key, {
            key,
            eventId: result.eventId,
            matchId: result.matchId,
            results: [result],
          });
        }

        return groups;
      }, new Map<string, IndividualMatchGroup>())
      .values()
  );

  return (
    <main className="min-h-screen bg-[#080a0f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* PAGE HEADER */}

        <section>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-400">
            iSports Tournament
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Match Results
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            View published team scores, individual athlete results and rankings.
          </p>
        </section>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-gray-900 p-8 text-center text-gray-400">
            Loading results...
          </div>
        ) : (
          <>
            {/* TEAM RESULTS */}

            <section className="mt-8 rounded-2xl border border-white/10 bg-gray-900/70 p-5 shadow-xl sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                    Team Competitions
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    Team Match Results
                  </h2>
                </div>

                <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-400">
                  {teamResults.length} Results
                </span>
              </div>

              {teamResults.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-500">
                  No submitted team results yet.
                </p>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {teamResults.map((match) => {
                    const winner = getWinner(match);

                    return (
                      <article
                        key={match.matchId}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              {match.eventName}
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-500">
                              {match.matchId}
                            </p>
                          </div>

                          <span className="rounded-full border border-green-800 bg-green-950/40 px-3 py-1 text-xs font-bold uppercase text-green-400">
                            {match.status}
                          </span>
                        </div>

                        <div className="space-y-3 p-5">
                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-gray-900 p-4">
                            <span className="font-bold">
                              {match.teamA}
                            </span>

                            <span className="text-3xl font-black">
                              {match.scoreA}
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-gray-900 p-4">
                            <span className="font-bold">
                              {match.teamB}
                            </span>

                            <span className="text-3xl font-black">
                              {match.scoreB}
                            </span>
                          </div>

                          <div className="rounded-xl border border-green-500/20 bg-green-950/20 p-4 text-center">
                            <p className="text-xs font-bold uppercase text-green-500">
                              Match Winner
                            </p>

                            <p className="mt-1 text-lg font-black text-green-300">
                              {winner}
                            </p>
                          </div>

                          <Link
                            href={`/scoring/matches/${match.matchId}`}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600/10 px-5 py-3 text-sm font-bold text-blue-400 hover:bg-blue-600 hover:text-white"
                          >
                            View Match →
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* INDIVIDUAL RESULTS */}

            <section className="mt-8 rounded-2xl border border-white/10 bg-gray-900/70 p-5 shadow-xl sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
                    Individual Competitions
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    Athlete Leaderboards
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Submitted individual scores ranked according to the event scoring rule.
                  </p>
                </div>

                <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-400">
                  {individualResults.length} Scores
                </span>
              </div>

              {individualMatchGroups.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-500">
                  No submitted individual results yet.
                </p>
              ) : (
                <div className="mt-6 space-y-6">
                  {individualMatchGroups.map((group) => {
                    // Detect time-based competitions.
                    const isTimeRace = detectTimeRace(group.results);

                    // Sort using the shared ranking utility.
                    const matchResults = sortResults(
                      group.results,
                      isTimeRace
                    );

                    const firstResult = matchResults[0];

                    return (
                      <div
                        key={group.key}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                              {isTimeRace
                                ? "Athletics - Time Race"
                                : "Individual Competition"}
                            </p>

                            <p className="mt-1 font-bold">
                              {firstResult?.eventName}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Match ID: {group.matchId}
                            </p>
                          </div>

                          <Link
                            href={`/scoring/matches/${group.matchId}?eventId=${encodeURIComponent(group.eventId)}`}
                            className="rounded-lg border border-blue-500/30 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white"
                          >
                            View Match →
                          </Link>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[500px] text-left">
                            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-gray-500">
                              <tr>
                                <th className="px-5 py-3">
                                  Rank
                                </th>

                                <th className="px-5 py-3">
                                  Athlete
                                </th>

                                <th className="px-5 py-3">
                                  {isTimeRace
                                    ? "Finishing Time"
                                    : "Total"}
                                </th>

                                <th className="px-5 py-3">
                                  Status
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {matchResults.map((result, index) => {
                                const resultHasScore = hasResult(
                                  result,
                                  isTimeRace
                                );

                                const currentValue = getRankingValue(
                                  result,
                                  isTimeRace
                                );

                                // Find the first position with this value.
                                // This handles two-way and multi-way ties.
                                const firstMatchingIndex =
                                  currentValue === null
                                    ? index
                                    : matchResults.findIndex(
                                        (candidate) =>
                                          getRankingValue(
                                            candidate,
                                            isTimeRace
                                          ) === currentValue
                                      );

                                const rank = getCompetitionRank(
                                  index,
                                  currentValue,
                                  firstMatchingIndex,
                                  resultHasScore
                                );

                                return (
                                  <tr
                                    key={result.id}
                                    className="border-t border-white/5"
                                  >
                                    <td className="px-5 py-4 font-black text-purple-300">
                                      {rank !== null
                                        ? `#${rank}`
                                        : "—"}
                                    </td>

                                    <td className="px-5 py-4 font-bold text-gray-200">
                                      {result.athleteName}
                                    </td>

                                    <td className="px-5 py-4 text-xl font-black text-white">
                                      {isTimeRace
                                        ? result.elapsedMilliseconds !== null
                                          ? formatRaceTime(
                                              result.elapsedMilliseconds
                                            )
                                          : "—"
                                        : result.total ?? "—"}
                                    </td>

                                    <td className="px-5 py-4">
                                      <span className="rounded-full border border-green-800 bg-green-950/40 px-3 py-1 text-xs font-bold uppercase text-green-400">
                                        {result.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* ARCHERY ROUND SCORES */}

                        {!isTimeRace &&
                          matchResults.some(
                            (result) => result.rounds.length > 0
                          ) && (
                            <div className="border-t border-white/10 p-5">
                              <h3 className="mb-3 text-sm font-black text-gray-300">
                                Round Scores
                              </h3>

                              <div className="space-y-3">
                                {matchResults
                                  .filter(
                                    (result) =>
                                      result.rounds.length > 0
                                  )
                                  .map((result) => (
                                    <div
                                      key={result.id}
                                      className="rounded-xl border border-white/10 bg-gray-900/70 p-4"
                                    >
                                      <p className="mb-2 text-sm font-bold text-gray-200">{result.athleteName}
                                      </p>

                                      <div className="flex flex-wrap gap-2">
                                        {result.rounds.map(
                                          (round, roundIndex) => (
                                            <div
                                              key={roundIndex}
                                              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                                            >
                                              <p className="text-xs text-gray-500">
                                                Round {roundIndex + 1}
                                              </p>

                                              <p className="mt-1 font-bold text-purple-300">
                                                {round.reduce(
                                                  (sum, value) =>
                                                    sum + value,
                                                  0
                                                )}
                                              </p>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* NAVIGATION */}

        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            href="/scoring/matches"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-400 hover:bg-white/10 hover:text-white"
          >
            ← Back to Match Management
          </Link>

          <Link
            href="/scoring/brackets"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            View Bracket →
          </Link>
        </div>
      </div>
    </main>
  );
}