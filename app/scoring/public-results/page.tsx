"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { events as defaultEvents } from "@/data/events";
import { getEvents as getStoredEvents } from "@/data/eventsStorage";

import {
  getMatches,
  type StoredMatch,
} from "@/data/matchStorage";

import {
  getScores,
  type StoredScore,
} from "@/data/scoreStorage";

import { getAllScores } from "@/data/data/scoringStorage";

import type { EventScoreRecord } from "@/types/scoring";
import type { SportEvent } from "@/types/events";

import {
  getCompetitionRank,
  getRankingValue,
  hasResult,
  isTimeRace as detectTimeRace,
  sortResults,
} from "@/lib/scoring/resultRanking";

type IndividualResult = {
  id: string;
  eventId: string;
  eventName: string;
  matchId: string;
  athleteName: string;
  total: number | null;
  elapsedMilliseconds: number | null;
  rounds: number[][];
  status: string;
  higherScoreWins: boolean;
};

type IndividualMatchGroup = {
  matchId: string;
  results: IndividualResult[];
  isTimeRace: boolean;
};

/* =========================================================
   PUBLIC RESULT STATUS
========================================================= */

function isPublishedStatus(status: unknown): boolean {
  if (typeof status !== "string") return false;

  const normalized = status.trim().toLowerCase();

  return normalized === "submitted" || normalized === "locked";
}

/* =========================================================
   TEAM RESULT HELPERS
========================================================= */

function getWinner(score: StoredScore): string {
  if (score.scoreA > score.scoreB) return score.teamA;

  if (score.scoreB > score.scoreA) return score.teamB;

  return "Draw";
}

/* =========================================================
   INDIVIDUAL RESULT HELPERS
========================================================= */

function formatRaceTime(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(2)} sec`;
}

function formatScore(result: IndividualResult): string {
  if (result.elapsedMilliseconds !== null) {
    return formatRaceTime(result.elapsedMilliseconds);
  }

  return result.total !== null ? String(result.total) : "—";
}

/* =========================================================
   PUBLIC RESULTS PAGE
========================================================= */

export default function PublicResultsPage() {
  /*
   * Keep the default event available for the initial render.
   *
   * After the component mounts, the page loads the actual events
   * stored by the application through eventsStorage.ts.
   *
   * This avoids server/client rendering problems while ensuring
   * the selector eventually contains the real stored events.
   */
  const [availableEvents, setAvailableEvents] =
    useState<SportEvent[]>(defaultEvents);

  const [selectedEventId, setSelectedEventId] = useState<string>(
    defaultEvents[0]?.id ?? ""
  );

  const [matches, setMatches] = useState<StoredMatch[]>(() =>
    getMatches()
  );

  const [teamScores, setTeamScores] = useState<StoredScore[]>(() =>
    getScores()
  );

  const [advancedScores, setAdvancedScores] =
    useState<EventScoreRecord[]>(() => getAllScores());

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [refreshError, setRefreshError] =
    useState(false);

  /* =========================================================
     REFRESH ALL PUBLIC RESULT DATA
  ========================================================= */

  const refreshResults = useCallback(() => {
    try {
      /*
       * eventsStorage is the authoritative source for events
       * created/managed by the application.
       */
      const latestStoredEvents = getStoredEvents();

      /*
       * If no events have been stored yet, retain the project's
       * existing default event.
       */
      const latestEvents =
        latestStoredEvents.length > 0
          ? latestStoredEvents
          : defaultEvents;

      const latestMatches = getMatches();
      const latestTeamScores = getScores();
      const latestAdvancedScores = getAllScores();

      setAvailableEvents(latestEvents);
      setMatches(latestMatches);
      setTeamScores(latestTeamScores);
      setAdvancedScores(latestAdvancedScores);

      /*
       * If the currently selected event no longer exists,
       * automatically select the first available event.
       */
      setSelectedEventId((currentId) => {
        const stillExists = latestEvents.some(
          (event) => event.id === currentId
        );

        if (stillExists) {
          return currentId;
        }

        return latestEvents[0]?.id ?? "";
      });

      setLastUpdated(new Date());
      setRefreshError(false);
    } catch (error) {
      console.error(
        "Unable to refresh public results:",
        error
      );

      setRefreshError(true);
    }
  }, []);

  /* =========================================================
     INITIAL LOAD + AUTO REFRESH
  ========================================================= */

  useEffect(() => {
    refreshResults();

    /*
     * Refresh every five seconds so public results can update
     * while scoring is taking place.
     */
    const interval = window.setInterval(() => {
      refreshResults();
    }, 5000);

    /*
     * Also refresh immediately when another browser tab/window
     * changes scoring-related localStorage data.
     */
    const handleStorageChange = (
      event: StorageEvent
    ) => {
      const relevantKeys = [
        "isports_scores",
        "isports_event_scores",
        "isports_score_recovery",
        "isports_matches",
        "isports_events",
      ];

      if (
        event.key === null ||
        relevantKeys.includes(event.key)
      ) {
        refreshResults();
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.clearInterval(interval);

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, [refreshResults]);

  /* =========================================================
     SELECTED EVENT
  ========================================================= */

  const selectedEvent = useMemo(
    () =>
      availableEvents.find(
        (event) => event.id === selectedEventId
      ) ?? null,
    [availableEvents, selectedEventId]
  );

  /* =========================================================
     MATCHES FOR SELECTED EVENT
  ========================================================= */

  const eventMatches = useMemo(
    () =>
      selectedEvent
        ? matches.filter(
            (match) =>
              match.eventId === selectedEvent.id
          )
        : [],
    [matches, selectedEvent]
  );

  const eventMatchIds = useMemo(
    () =>
      new Set(
        eventMatches.map((match) => match.id)
      ),
    [eventMatches]
  );

  /* =========================================================
     TEAM RESULTS
  ========================================================= */

  const publishedTeamResults = useMemo(
    () =>
      teamScores.filter(
        (score) =>
          isPublishedStatus(score.status) &&
          eventMatchIds.has(score.matchId)
      ),
    [teamScores, eventMatchIds]
  );

  /* =========================================================
     INDIVIDUAL RESULTS
  ========================================================= */

  const publishedIndividualResults = useMemo(() => {
    if (!selectedEvent) return [];

    return advancedScores.reduce<IndividualResult[]>(
      (results, score) => {
        /*
         * Only show scores belonging to the currently
         * selected event and published states.
         */
        if (
          score.eventId !== selectedEvent.id ||
          !score.matchId ||
          !score.athleteId ||
          !isPublishedStatus(score.status)
        ) {
          return results;
        }

        /*
         * Only individual matches belong in the athlete
         * results section.
         */
        const match = eventMatches.find(
          (item) =>
            item.id === score.matchId &&
            item.matchType === "individual"
        );

        if (
          !match ||
          match.eventId !== score.eventId
        ) {
          return results;
        }

        const participant =
          match.participants?.find(
            (item) =>
              item.registrationId ===
              score.athleteId
          );

        const data =
          score.data as unknown as {
            total?: number;
            rounds?: number[][];
            elapsedMilliseconds?: number;
          };

        results.push({
          id: score.id,

          eventId: score.eventId,

          eventName: selectedEvent.name,

          matchId: score.matchId,

          athleteName:
            participant?.name ??
            "Unknown Athlete",

          total:
            typeof data.total === "number" &&
            Number.isFinite(data.total)
              ? data.total
              : null,

          elapsedMilliseconds:
            typeof data.elapsedMilliseconds ===
              "number" &&
            Number.isFinite(
              data.elapsedMilliseconds
            )
              ? data.elapsedMilliseconds
              : null,

          rounds: Array.isArray(data.rounds)
            ? data.rounds.filter(
                (
                  round
                ): round is number[] =>
                  Array.isArray(round) &&
                  round.every(
                    (value) =>
                      typeof value ===
                        "number" &&
                      Number.isFinite(value)
                  )
              )
            : [],

          status: score.status,

          higherScoreWins:
            selectedEvent.higherScoreWins !==
            false,
        });

        return results;
      },
      []
    );
  }, [
    advancedScores,
    eventMatches,
    selectedEvent,
  ]);

  /* =========================================================
     INDIVIDUAL RANKING
  ========================================================= */

  const individualGroups = useMemo(() => {
    const groups = new Map<
      string,
      IndividualResult[]
    >();

    for (const result of publishedIndividualResults) {
      const existing =
        groups.get(result.matchId) ?? [];

      existing.push(result);

      groups.set(
        result.matchId,
        existing
      );
    }

    return Array.from(
      groups.entries()
    ).map(
      ([matchId, results]): IndividualMatchGroup => {
        const isTimeRace =
          detectTimeRace(results);

        const sortedResults =
          sortResults(
            results,
            isTimeRace
          );

        return {
          matchId,
          results: sortedResults,
          isTimeRace,
        };
      }
    );
  }, [publishedIndividualResults]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
            iSports
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Public Results
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            View official team and individual
            results for completed matches.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : "Loading latest results..."}
            </span>

            {refreshError && (
              <span className="text-amber-400">
                Unable to refresh. Retrying
                automatically.
              </span>
            )}
          </div>
        </section>

        {/* =================================================
            EVENT SELECTOR
        ================================================= */}

        <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:p-6">
          <label
            htmlFor="public-results-event"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Select Event
          </label>

          {availableEvents.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              No events are currently available.
            </p>
          ) : (
            <select
              id="public-results-event"
              value={selectedEventId}
              onChange={(event) =>
                setSelectedEventId(
                  event.target.value
                )
              }
              className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500 sm:max-w-xl"
            >
              {availableEvents.map((event) => (
                <option
                  key={event.id}
                  value={event.id}
                >
                  {event.name}
                </option>
              ))}
            </select>
          )}
        </section>

        {selectedEvent && (
          <>
            {/* =============================================
                EVENT INFORMATION
            ============================================= */}

            <section className="mt-6 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                    {selectedEvent.sport}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                    {selectedEvent.name}
                  </h2>
                </div>

                <span className="w-fit rounded-full border border-blue-800 bg-blue-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-300">
                  Event Results
                </span>
              </div>

              <div className="mt-6 grid gap-3 border-t border-gray-800 pt-5 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </p>

                  <p className="mt-1 font-medium text-gray-200">
                    {selectedEvent.date}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Venue
                  </p>

                  <p className="mt-1 font-medium text-gray-200">
                    {selectedEvent.venue}
                  </p>
                </div>
              </div>
            </section>

            {/* =============================================
                TEAM RESULTS
            ============================================= */}

            <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Results
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Team Match Results
                  </h2>
                </div>

                <p className="text-sm text-gray-500">
                  {publishedTeamResults.length}{" "}
                  {publishedTeamResults.length ===
                  1
                    ? "result"
                    : "results"}
                </p>
              </div>

              {publishedTeamResults.length ===
              0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-gray-800 bg-gray-950 px-5 py-10 text-center">
                  <p className="text-base font-semibold text-gray-300">
                    No official team results
                    available yet.
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Submitted or locked team
                    results will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {publishedTeamResults.map(
                    (result) => {
                      const match =
                        eventMatches.find(
                          (item) =>
                            item.id ===
                            result.matchId
                        );

                      if (!match) return null;

                      return (
                        <article
                          key={`${selectedEvent.id}-${result.matchId}`}
                          className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950"
                        >
                          <div className="flex flex-col gap-3 border-b border-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Match
                              </p>

                              <p className="mt-1 text-sm font-semibold text-gray-300">
                                {match.id}
                              </p>
                            </div>

                            <span className="w-fit rounded-full border border-green-800 bg-green-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-400">
                              {String(
                                result.status
                              ).toLowerCase() ===
                              "locked"
                                ? "Official"
                                : "Submitted"}
                            </span>
                          </div>

                          <div className="px-5 py-7 sm:px-8 sm:py-8">
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center sm:gap-6">
                              <div className="min-w-0">
                                <p className="break-words text-base font-bold text-gray-100 sm:text-xl">
                                  {match.teamA}
                                </p>

                                <p className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                                  {
                                    result.scoreA
                                  }
                                </p>
                              </div>

                              <div className="rounded-full border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-bold text-gray-500">
                                VS
                              </div>

                              <div className="min-w-0">
                                <p className="break-words text-base font-bold text-gray-100 sm:text-xl">
                                  {match.teamB}
                                </p>

                                <p className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                                  {
                                    result.scoreB
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="mt-6 text-center">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                Match Date
                              </p>

                              <p className="mt-1 text-sm text-gray-400">
                                {match.date}
                              </p>
                            </div>

                            <div className="mt-6 rounded-xl border border-green-800/50 bg-green-950/20 px-4 py-4 text-center">
                              <p className="text-xs font-bold uppercase tracking-wider text-green-500">
                                Winner
                              </p>

                              <p className="mt-1 text-base font-bold text-green-300 sm:text-lg">
                                {getWinner(
                                  result
                                )}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            {/* =============================================
                INDIVIDUAL RESULTS
            ============================================= */}

            <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                    Individual
                    Competitions
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Athlete Results
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Published athlete scores
                    ranked using this event&apos;s
                    scoring rule.
                  </p>
                </div>

                <p className="text-sm text-gray-500">
                  {publishedIndividualResults.length}{" "}
                  {publishedIndividualResults.length ===
                  1
                    ? "score"
                    : "scores"}
                </p>
              </div>

              {individualGroups.length ===
              0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-gray-800 bg-gray-950 px-5 py-10 text-center">
                  <p className="text-base font-semibold text-gray-300">
                    No official individual
                    results available yet.
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Submitted or locked athlete
                    scores will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {individualGroups.map(
                    (group) => (
                      <article
                        key={`${selectedEvent.id}-${group.matchId}`}
                        className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950"
                      >
                        <div className="border-b border-gray-800 px-5 py-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                            {group.isTimeRace
                              ? "Athletics - Time Race"
                              : "Individual Competition"}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-gray-300">
                            Match ID:{" "}
                            {group.matchId}
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[460px] text-left">
                            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-gray-500">
                              <tr>
                                <th className="px-5 py-3">
                                  Rank
                                </th>

                                <th className="px-5 py-3">
                                  Athlete
                                </th>

                                <th className="px-5 py-3">
                                  {group.isTimeRace
                                    ? "Time"
                                    : "Score"}
                                </th>

                                <th className="px-5 py-3">
                                  Status
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {group.results.map(
                                (
                                  result,
                                  index
                                ) => {
                                  const resultHasScore =
                                    hasResult(
                                      result,
                                      group.isTimeRace
                                    );

                                  const currentValue =
                                    getRankingValue(
                                      result,
                                      group.isTimeRace
                                    );

                                  const firstMatchingIndex =
                                    currentValue ===
                                    null
                                      ? index
                                      : group.results.findIndex(
                                          (
                                            candidate
                                          ) =>
                                            getRankingValue(
                                              candidate,
                                              group.isTimeRace
                                            ) ===
                                            currentValue
                                        );

                                  const rank =
                                    getCompetitionRank(
                                      index,
                                      currentValue,
                                      firstMatchingIndex,
                                      resultHasScore
                                    );

                                  return (
                                    <tr
                                      key={
                                        result.id
                                      }
                                      className="border-t border-white/5"
                                    >
                                      <td className="px-5 py-4 font-black text-purple-300">
                                        {rank !==
                                        null
                                          ? `#${rank}`
                                          : "—"}
                                      </td>

                                      <td className="px-5 py-4 font-bold text-gray-200">
                                        {
                                          result.athleteName
                                        }
                                      </td>

                                      <td className="px-5 py-4 text-lg font-black text-white">
                                        {formatScore(
                                          result
                                        )}
                                      </td>

                                      <td className="px-5 py-4">
                                        <span className="rounded-full border border-green-800 bg-green-950/40 px-3 py-1 text-xs font-bold uppercase text-green-400">
                                          {
                                            result.status
                                          }
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* ROUND SCORES */}

                        {!group.isTimeRace &&
                          group.results.some(
                            (result) =>
                              result.rounds
                                .length > 0
                          ) && (
                            <div className="border-t border-gray-800 p-5">
                              <h3 className="mb-3 text-sm font-black text-gray-300">
                                Round Scores
                              </h3>

                              <div className="space-y-3">
                                {group.results
                                  .filter(
                                    (result) =>
                                      result.rounds
                                        .length >
                                      0
                                  )
                                  .map(
                                    (
                                      result
                                    ) => (
                                      <div
                                        key={
                                          result.id
                                        }
                                        className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                                      >
                                        <p className="mb-2 text-sm font-bold text-gray-200">
                                          {
                                            result.athleteName
                                          }
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                          {result.rounds.map(
                                            (
                                              round,
                                              roundIndex
                                            ) => (
                                              <div
                                                key={
                                                  roundIndex
                                                }
                                                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2"
                                              >
                                                <p className="text-xs text-gray-500">
                                                  Round{" "}
                                                  {roundIndex +
                                                    1}
                                                </p>

                                                <p className="mt-1 font-bold text-purple-300">
                                                  {round.reduce(
                                                    (
                                                      sum,
                                                      score
                                                    ) =>
                                                      sum +
                                                      score,
                                                    0
                                                  )}
                                                </p>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )
                                  )}
                              </div>
                            </div>
                          )}
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            href="/scoring/scoreboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            Back to Scoreboard
          </Link>

          <Link
            href="/scoring"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            Back to Scoring
          </Link>
        </div>
      </div>
    </main>
  );
}