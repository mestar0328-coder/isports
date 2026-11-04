"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getMatches, type StoredMatch } from "@/data/matchStorage";
import { getScores, type StoredScore } from "@/data/scoreStorage";
import { getEvents } from "@/data/eventsStorage";
import { getCurrentInchargeAccess } from "@/data/inchargeAuth";
import { getAllScores } from "@/data/data/scoringStorage";

import type { EventScoreRecord } from "@/types/scoring";

function isPublishedStatus(status: unknown): boolean {
  if (typeof status !== "string") return false;

  const normalized = status.trim().toLowerCase();
  return normalized === "submitted" || normalized === "locked";
}

function ScoreboardContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [matches, setMatches] = useState<StoredMatch[]>([]);
  const [scores, setScores] = useState<StoredScore[]>([]);
  const [advancedScores, setAdvancedScores] = useState<EventScoreRecord[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = () => {
      try {
        const access = getCurrentInchargeAccess();

        if (
          !access ||
          !eventId ||
          access.expired ||
          !Array.isArray(access.assignedEventIds) ||
          !access.assignedEventIds.includes(eventId)
        ) {
          if (isMounted) {
            setAuthorized(false);
            setCheckingAccess(false);
            setMatches([]);
            setScores([]);
            setAdvancedScores([]);
          }
          return;
        }

        const event = getEvents().find((item) => item.id === eventId);

        if (!event) {
          if (isMounted) {
            setAuthorized(false);
            setCheckingAccess(false);
            setMatches([]);
            setScores([]);
            setAdvancedScores([]);
          }
          return;
        }

        if (isMounted) {
          setEventName(event.name);
          setMatches(getMatches());
          setScores(getScores());
          setAdvancedScores(getAllScores());
          setAuthorized(true);
          setCheckingAccess(false);
        }
      } catch (error) {
        console.error("Unable to load scoreboard:", error);

        if (isMounted) {
          setAuthorized(false);
          setCheckingAccess(false);
          setMatches([]);
          setScores([]);
          setAdvancedScores([]);
        }
      }
    };

    loadData();

    const refreshInterval = setInterval(loadData, 5000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [eventId]);

  const eventMatches = useMemo(
    () =>
      matches.filter((match) => match.eventId === eventId),
    [matches, eventId]
  );

  const eventMatchIds = useMemo(
    () => new Set(eventMatches.map((match) => match.id)),
    [eventMatches]
  );

  const publishedTeamScores = useMemo(
    () =>
      scores.filter(
        (score) =>
          isPublishedStatus(score.status) &&
          eventMatchIds.has(score.matchId)
      ),
    [scores, eventMatchIds]
  );

  const publishedAdvancedScores = useMemo(
    () =>
      advancedScores.filter(
        (score) =>
          score.eventId === eventId &&
          !!score.matchId &&
          isPublishedStatus(score.status) &&
          eventMatchIds.has(score.matchId)
      ),
    [advancedScores, eventId, eventMatchIds]
  );

  if (!eventId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
        <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <h1 className="text-2xl font-bold">Event Not Selected</h1>
          <p className="mt-3 text-sm text-gray-400">
            Please open the scoreboard from an assigned event.
          </p>
        </div>
      </main>
    );
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400">Checking event access...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
        <div className="w-full max-w-lg rounded-xl border border-red-900 bg-gray-900 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400">
            Access Denied
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Your In-Charge access is invalid, expired, or not assigned to this event.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <section className="border-b border-gray-800 pb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports Scoring
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Scoreboard
          </h1>

          <p className="mt-3 text-gray-400">{eventName}</p>
        </section>

        {/* EVENT NOTICE */}
        <section className="mt-8 rounded-xl border border-blue-900 bg-blue-950/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            Assigned Event Scoreboard
          </p>

          <h2 className="mt-2 text-xl font-bold">{eventName}</h2>

          <p className="mt-2 text-sm text-gray-400">
            Only published scores belonging to this assigned event are displayed.
          </p>
        </section>

        {/* SCOREBOARD */}
        <section className="mt-8">
          {eventMatches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900 p-10 text-center">
              <h2 className="text-lg font-bold">No Matches</h2>
              <p className="mt-2 text-sm text-gray-500">
                No matches have been created for this event.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventMatches.map((match) => {
                const teamScore = publishedTeamScores.find(
                  (item) => item.matchId === match.id
                );

                const individualScores = publishedAdvancedScores.filter(
                  (item) => item.matchId === match.id
                );

                const hasPublishedScore =
                  !!teamScore || individualScores.length > 0;

                return (
                  <article
                    key={match.id}
                    className="rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-bold">{match.teamA}</p>

                        <p className="my-1 text-sm font-semibold text-gray-500">
                          VS
                        </p>

                        <p className="text-lg font-bold">{match.teamB}</p>

                        <p className="mt-3 text-xs text-gray-500">
                          Match ID: {match.id}
                        </p>
                      </div>

                      <div className="min-w-[180px] rounded-xl border border-gray-800 bg-gray-950 p-5 text-center">
                        {teamScore ? (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Published Team Score
                            </p>

                            <div className="mt-2 flex items-center justify-center gap-4">
                              <span className="text-2xl font-black">
                                {teamScore.scoreA}
                              </span>
                              <span className="text-gray-600">–</span>
                              <span className="text-2xl font-black">
                                {teamScore.scoreB}
                              </span>
                            </div>

                            <p className="mt-2 text-sm font-bold text-green-400">
                              {teamScore.status}
                            </p>
                          </>
                        ) : individualScores.length > 0 ? (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Published Individual Scores
                            </p>

                            <p className="mt-2 text-2xl font-black text-green-400">
                              {individualScores.length}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Athlete score records
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Status
                            </p>

                            <p className="mt-2 text-sm font-bold text-yellow-400">
                              Awaiting Published Score
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {hasPublishedScore && (
                      <div className="mt-4 border-t border-gray-800 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-400">
                          Published Result Available
                        </p>

                        {individualScores.length > 0 && (
                          <p className="mt-1 text-sm text-gray-400">
                            {individualScores.length} individual score record(s) submitted or locked.
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ScoreboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
          <p>Loading scoreboard...</p>
        </main>
      }
    >
      <ScoreboardContent />
    </Suspense>
  );
}