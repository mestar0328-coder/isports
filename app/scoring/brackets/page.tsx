"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { events } from "@/data/events";
import {
  getMatches,
  type StoredMatch,
} from "@/data/matchStorage";
import {
  getScoreByMatchId,
  type StoredScore,
} from "@/data/scoreStorage";
import {
  getBracketByEventId,
  saveBracket,
  type BracketMatch,
  type TournamentBracket,
} from "@/data/bracketStorage";

const FINAL_MATCH_ID = "final";

function isPublishedScore(
  score: StoredScore | undefined
): score is StoredScore {
  return (
    score?.status === "Submitted" ||
    score?.status === "Locked"
  );
}

function getWinner(
  score: StoredScore | undefined
): string | undefined {
  if (!isPublishedScore(score)) {
    return undefined;
  }

  if (score.scoreA === score.scoreB) {
    return undefined;
  }

  return score.scoreA > score.scoreB
    ? score.teamA
    : score.teamB;
}

export default function BracketsPage() {
  const [selectedEventId, setSelectedEventId] =
    useState("");

  const [matches, setMatches] =
    useState<StoredMatch[]>([]);

  const [scores, setScores] = useState<
    Record<string, StoredScore | undefined>
  >({});

  const [bracket, setBracket] =
    useState<TournamentBracket | null>(null);

  const [userRole, setUserRole] = useState("");

  const [isLoaded, setIsLoaded] = useState(false);

  const selectedEvent = useMemo(
    () =>
      events.find(
        (event) => event.id === selectedEventId
      ),
    [selectedEventId]
  );

  const loadEventData = useCallback(
    (eventId: string) => {
      if (!eventId) {
        setMatches([]);
        setScores({});
        setBracket(null);
        setIsLoaded(true);
        return;
      }

      const storedMatches = getMatches();

      const eventMatches = storedMatches.filter(
        (match) => match.eventId === eventId
      );

      const scoreMap: Record<
        string,
        StoredScore | undefined
      > = {};

      eventMatches.forEach((match) => {
        scoreMap[match.id] =
          getScoreByMatchId(match.id);
      });

      setMatches(eventMatches);
      setScores(scoreMap);

      const existingBracket =
        getBracketByEventId(eventId);

      if (existingBracket) {
        setBracket(existingBracket);
        setIsLoaded(true);
        return;
      }

      if (eventMatches.length < 2) {
        setBracket(null);
        setIsLoaded(true);
        return;
      }

      /*
       * This preserves the existing three-match format:
       * two Round 1 matches and one final.
       *
       * It does not automatically generate brackets
       * for larger tournament formats.
       */
      const firstMatch = eventMatches[0];
      const secondMatch = eventMatches[1];

      const initialBracket: TournamentBracket = {
        eventId,
        matches: [
          {
            id: firstMatch.id,
            eventId,
            teamA: firstMatch.teamA,
            teamB: firstMatch.teamB,
            status: "Waiting",
          },
          {
            id: secondMatch.id,
            eventId,
            teamA: secondMatch.teamA,
            teamB: secondMatch.teamB,
            status: "Waiting",
          },
          {
            id: FINAL_MATCH_ID,
            eventId,
            teamA: "Winner Match 1",
            teamB: "Winner Match 2",
            sourceMatchA: firstMatch.id,
            sourceMatchB: secondMatch.id,
            status: "Waiting",
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      saveBracket(initialBracket);
      setBracket(initialBracket);
      setIsLoaded(true);
    },
    []
  );

  useEffect(() => {
    const savedUser =
      localStorage.getItem("isports_user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUserRole(user.role || "");
      } catch {
        setUserRole("");
      }
    }

    const params = new URLSearchParams(
      window.location.search
    );

    const requestedEventId =
      params.get("eventId");

    const initialEvent =
      events.find(
        (event) => event.id === requestedEventId
      ) || events[0];

    if (initialEvent) {
      setSelectedEventId(initialEvent.id);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    setIsLoaded(false);
    loadEventData(selectedEventId);
  }, [selectedEventId, loadEventData]);

  useEffect(() => {
    if (!bracket || !selectedEventId) {
      return;
    }

    if (bracket.eventId !== selectedEventId) {
      return;
    }

    let changed = false;

    const updatedMatches = bracket.matches.map(
      (bracketMatch) => {
        if (bracketMatch.id === FINAL_MATCH_ID) {
          return bracketMatch;
        }

        const score = scores[bracketMatch.id];
        const winner = getWinner(score);

        if (!winner) {
          if (
            bracketMatch.winner ||
            bracketMatch.status === "Completed"
          ) {
            changed = true;

            return {
              ...bracketMatch,
              winner: undefined,
              status: "Waiting" as const,
            };
          }

          return bracketMatch;
        }

        if (
          bracketMatch.winner === winner &&
          bracketMatch.status === "Completed"
        ) {
          return bracketMatch;
        }

        changed = true;

        return {
          ...bracketMatch,
          winner,
          status: "Completed" as const,
        };
      }
    );

    const finalMatch = updatedMatches.find(
      (match) => match.id === FINAL_MATCH_ID
    );

    if (!finalMatch) {
      return;
    }

    const firstMatch = updatedMatches.find(
      (match) =>
        match.id === finalMatch.sourceMatchA
    );

    const secondMatch = updatedMatches.find(
      (match) =>
        match.id === finalMatch.sourceMatchB
    );

    const firstWinner = firstMatch?.winner;
    const secondWinner = secondMatch?.winner;

    const finalTeamA =
      firstWinner || "Winner Match 1";

    const finalTeamB =
      secondWinner || "Winner Match 2";

    const finalStatus:
      | "Waiting"
      | "Ready"
      | "Completed" =
      finalMatch.winner &&
      firstWinner &&
      secondWinner
        ? "Completed"
        : firstWinner && secondWinner
          ? "Ready"
          : "Waiting";

    const finalWinnerStillValid =
      finalMatch.winner === finalTeamA ||
      finalMatch.winner === finalTeamB;

    const updatedFinal: BracketMatch = {
      ...finalMatch,
      teamA: finalTeamA,
      teamB: finalTeamB,
      status:
        finalStatus === "Completed" &&
        !finalWinnerStillValid
          ? "Ready"
          : finalStatus,
      winner:
        finalWinnerStillValid
          ? finalMatch.winner
          : undefined,
    };

    if (
      updatedFinal.teamA !== finalMatch.teamA ||
      updatedFinal.teamB !== finalMatch.teamB ||
      updatedFinal.status !== finalMatch.status ||
      updatedFinal.winner !== finalMatch.winner
    ) {
      changed = true;
    }

    const finalIndex = updatedMatches.findIndex(
      (match) => match.id === FINAL_MATCH_ID
    );

    if (finalIndex >= 0) {
      updatedMatches[finalIndex] = updatedFinal;
    }

    const tournamentWinner =
      updatedFinal.status === "Completed"
        ? updatedFinal.winner
        : undefined;

    if (
      bracket.tournamentWinner !== tournamentWinner
    ) {
      changed = true;
    }

    if (!changed) {
      return;
    }

    const updatedBracket: TournamentBracket = {
      ...bracket,
      matches: updatedMatches,
      tournamentWinner,
      updatedAt: new Date().toISOString(),
    };

    saveBracket(updatedBracket);
    setBracket(updatedBracket);
  }, [bracket, scores, selectedEventId]);

  const refreshBracket = () => {
    if (!selectedEventId) {
      return;
    }

    loadEventData(selectedEventId);
  };

  const handleFinalWinner = (winner: string) => {
    if (!bracket || !canManageBracket) {
      return;
    }

    const finalMatch = bracket.matches.find(
      (match) => match.id === FINAL_MATCH_ID
    );

    if (
      !finalMatch ||
      finalMatch.status !== "Ready" ||
      (winner !== finalMatch.teamA &&
        winner !== finalMatch.teamB)
    ) {
      return;
    }

    const updatedMatches = bracket.matches.map(
      (match) =>
        match.id === FINAL_MATCH_ID
          ? {
              ...match,
              status: "Completed" as const,
              winner,
            }
          : match
    );

    const updatedBracket: TournamentBracket = {
      ...bracket,
      matches: updatedMatches,
      tournamentWinner: winner,
      updatedAt: new Date().toISOString(),
    };

    saveBracket(updatedBracket);
    setBracket(updatedBracket);
  };

  const canManageBracket =
    userRole === "admin" ||
    userRole === "incharge";

  const roundOneMatches =
    bracket?.matches.filter(
      (match) => match.id !== FINAL_MATCH_ID
    ) || [];

  const finalMatch = bracket?.matches.find(
    (match) => match.id === FINAL_MATCH_ID
  );

  const handleEventChange = (
    eventId: string
  ) => {
    setSelectedEventId(eventId);

    const params = new URLSearchParams(
      window.location.search
    );

    params.set("eventId", eventId);

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  return (
    <main className="min-h-screen bg-[#080a0f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Tournament Bracket
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Winners are determined from submitted
              match scores.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={refreshBracket}
              disabled={!selectedEventId}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh Bracket
            </button>

            <Link
              href={
                selectedEventId
                  ? `/scoring/matches?eventId=${encodeURIComponent(selectedEventId)}`
                  : "/scoring/matches"
              }
              className="rounded-lg bg-gray-800 px-4 py-2 font-semibold hover:bg-gray-700"
            >
              Back to Matches
            </Link>
          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <label
            htmlFor="bracket-event"
            className="text-sm text-gray-400"
          >
            Select Event
          </label>

          <select
            id="bracket-event"
            value={selectedEventId}
            onChange={(event) =>
              handleEventChange(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white md:max-w-xl"
          >
            {events.map((event) => (
              <option
                key={event.id}
                value={event.id}
              >
                {event.name}
              </option>
            ))}
          </select>

          {selectedEvent && (
            <p className="mt-3 text-sm text-gray-400">
              Showing bracket for:{" "}
              <span className="font-semibold text-white">
                {selectedEvent.name}
              </span>
            </p>
          )}
        </section>

        {!isLoaded && (
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-gray-400">
            Loading bracket...
          </section>
        )}

        {isLoaded && !selectedEvent && (
          <section className="rounded-2xl border border-yellow-700 bg-yellow-950/30 p-6">
            <h2 className="text-xl font-bold">
              No events available
            </h2>
            <p className="mt-2 text-gray-400">
              Create an event before viewing a tournament bracket.
            </p>
          </section>
        )}

        {isLoaded && selectedEvent && !bracket && (
          <section className="rounded-2xl border border-yellow-700 bg-yellow-950/30 p-6">
            <h2 className="text-xl font-bold">
              Bracket is not ready
            </h2>

            <p className="mt-2 text-gray-400">
              At least two matches are required for
              this tournament bracket.
            </p>
          </section>
        )}

        {isLoaded && bracket && (
          <>
            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Round 1
                </h2>

                <span className="text-sm text-gray-400">
                  {roundOneMatches.length} matches
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {roundOneMatches.map(
                  (match, index) => {
                    const score = scores[match.id];
                    const published =
                      isPublishedScore(score);

                    return (
                      <div
                        key={match.id}
                        className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
                      >
                        <div className="mb-5 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-400">
                            Match {index + 1}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              match.status === "Completed"
                                ? "bg-green-900 text-green-300"
                                : "bg-yellow-900 text-yellow-300"
                            }`}
                          >
                            {match.status}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                            <span className="font-semibold">
                              {match.teamA}
                            </span>

                            <span className="text-xl font-bold">
                              {published ? score.scoreA : "-"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                            <span className="font-semibold">
                              {match.teamB}
                            </span>

                            <span className="text-xl font-bold">
                              {published ? score.scoreB : "-"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5">
                          <Link
                            href={`/scoring/matches/${match.id}?eventId=${encodeURIComponent(selectedEventId)}`}
                            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
                          >
                            Manage Score
                          </Link>
                        </div>

                        {match.winner && (
                          <div className="mt-5 rounded-lg border border-green-700 bg-green-950/30 p-4">
                            <p className="text-xs uppercase tracking-wide text-green-400">
                              Winner
                            </p>

                            <p className="mt-1 text-lg font-bold text-green-300">
                              {match.winner}
                            </p>
                          </div>
                        )}

                        {!match.winner &&
                          published &&
                          score.scoreA === score.scoreB && (
                            <div className="mt-5 rounded-lg border border-red-700 bg-red-950/30 p-4">
                              <p className="text-sm font-semibold text-red-300">
                                Match is tied.
                              </p>

                              <p className="mt-1 text-xs text-red-400">
                                A tie cannot automatically
                                determine a bracket winner.
                              </p>
                            </div>
                          )}
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-bold">
                Final
              </h2>

              {finalMatch && (
                <div className="mx-auto max-w-2xl rounded-2xl border border-purple-800 bg-gray-900 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-400">
                      Championship Final
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        finalMatch.status === "Completed"
                          ? "bg-green-900 text-green-300"
                          : finalMatch.status === "Ready"
                            ? "bg-blue-900 text-blue-300"
                            : "bg-yellow-900 text-yellow-300"
                      }`}
                    >
                      {finalMatch.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg bg-gray-800 p-4 text-center font-semibold">
                      {finalMatch.teamA}
                    </div>

                    <div className="text-center text-sm font-bold text-gray-500">
                      VS
                    </div>

                    <div className="rounded-lg bg-gray-800 p-4 text-center font-semibold">
                      {finalMatch.teamB}
                    </div>
                  </div>

                  {finalMatch.status === "Ready" &&
                    canManageBracket && (
                      <div className="mt-6">
                        <p className="mb-3 text-sm text-gray-400">
                          Select the final winner:
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            onClick={() =>
                              handleFinalWinner(finalMatch.teamA)
                            }
                            className="rounded-lg bg-green-600 px-4 py-3 font-semibold hover:bg-green-500"
                          >
                            {finalMatch.teamA}
                          </button>

                          <button
                            onClick={() =>
                              handleFinalWinner(finalMatch.teamB)
                            }
                            className="rounded-lg bg-green-600 px-4 py-3 font-semibold hover:bg-green-500"
                          >
                            {finalMatch.teamB}
                          </button>
                        </div>
                      </div>)}

                  {finalMatch.winner && (
                    <div className="mt-6 rounded-xl border border-yellow-600 bg-yellow-950/30 p-5 text-center">
                      <p className="text-sm uppercase tracking-wide text-yellow-400">
                        Tournament Winner
                      </p>

                      <p className="mt-2 text-2xl font-bold text-yellow-300">
                        {finalMatch.winner}
                      </p>
                    </div>
                  )}

                  {finalMatch.status === "Waiting" && (
                    <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800/50 p-4 text-center text-sm text-gray-400">
                      Both Round 1 matches must have
                      a winner before the final is ready.
                    </div>
                  )}
                </div>
              )}
            </section>    {bracket.tournamentWinner && (
              <section className="rounded-2xl border border-yellow-600 bg-yellow-950/20 p-8 text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-yellow-400">
                  Champion
                </p>

                <h2 className="mt-3 text-4xl font-black text-yellow-300">
                  {bracket.tournamentWinner}
                </h2>

                <p className="mt-3 text-gray-400">
                  Tournament completed.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}