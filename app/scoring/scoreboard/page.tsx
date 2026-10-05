

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getMatches, StoredMatch } from "@/data/matchStorage";
import { getScores, StoredScore } from "@/data/scoreStorage";
import { getEvents } from "@/data/eventsStorage";
import { getCurrentInchargeAccess } from "@/data/inchargeAuth";

export default function ScoreboardPage() {
  const searchParams = useSearchParams();

  const eventId = searchParams.get("eventId");

  const [matches, setMatches] = useState<StoredMatch[]>([]);
  const [scores, setScores] = useState<StoredScore[]>([]);
  const [authorized, setAuthorized] = useState(false);

  const [eventName, setEventName] = useState("");

  useEffect(() => {
    const loadData = () => {
      const access = getCurrentInchargeAccess();

      if (!access || !eventId) {
        setAuthorized(false);
        return;
      }

      const canAccess =
        access.assignedEventIds.includes(eventId);

      if (!canAccess) {
        setAuthorized(false);
        return;
      }

      const events = getEvents();

      const event = events.find(
        (item) => item.id === eventId
      );

      if (!event) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);
      setEventName(event.name);

      setMatches(getMatches());
      setScores(getScores());
    };

    loadData();

    const refreshInterval = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [eventId]);

  if (!eventId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
        <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <h1 className="text-2xl font-bold">
            Event Not Selected
          </h1>

          <p className="mt-3 text-sm text-gray-400">
            Please open the scoreboard from an assigned event.
          </p>
        </div>
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
            You are not assigned to this event.
          </p>
        </div>
      </main>
    );
  }

  /*
   * IMPORTANT:
   * Only matches belonging to the selected event
   * are allowed into the scoreboard.
   */
  const eventMatches = matches.filter(
    (match) => match.eventId === eventId
  );

  const eventMatchIds = new Set(
    eventMatches.map((match) => match.id)
  );

  /*
   * Only scores belonging to matches from this event
   * are allowed into the scoreboard.
   */
  const eventScores = scores.filter((score) =>
    eventMatchIds.has(score.matchId)
  );

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

          <p className="mt-3 text-gray-400">
            {eventName}
          </p>

        </section>

        {/* EVENT NOTICE */}

        <section className="mt-8 rounded-xl border border-blue-900 bg-blue-950/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            Event Scoreboard
          </p>

          <h2 className="mt-2 text-xl font-bold">
            {eventName}
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Showing scores only for matches belonging to
            this assigned event.
          </p>
        </section>

        {/* SCOREBOARD */}

        <section className="mt-8">

          {eventMatches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900 p-10 text-center">
              <h2 className="text-lg font-bold">
                No Matches
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                No matches have been created for this event.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {eventMatches.map((match) => {
                const score = eventScores.find(
                  (item) =>
                    item.matchId === match.id
                );

                return (
                  <div
                    key={match.id}
                    className="rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6"
                  >

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="text-lg font-bold">
                          {match.teamA}
                        </p>

                        <p className="my-1 text-sm font-semibold text-gray-500">
                          VS
                        </p>

                        <p className="text-lg font-bold">
                          {match.teamB}
                        </p>

                        <p className="mt-3 text-xs text-gray-500">
                          Match ID: {match.id}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 text-center">

                        {score ? (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Score Available
                            </p>

                            <p className="mt-2 text-sm font-bold text-green-400">
                              {score.status}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Status
                            </p>

                            <p className="mt-2 text-sm font-bold text-yellow-400">
                              Awaiting Score
                            </p>
                          </>
                        )}

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}