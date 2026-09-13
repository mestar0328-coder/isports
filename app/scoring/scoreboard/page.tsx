"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { events } from "@/data/events";
import { getMatches, StoredMatch } from "@/data/matchStorage";
import { getScores, StoredScore } from "@/data/scoreStorage";

export default function ScoreboardPage() {
  const assignedEvent = events[0];

  const [matches, setMatches] = useState<StoredMatch[]>(() =>
    getMatches()
  );

  const [scores, setScores] = useState<StoredScore[]>(() =>
    getScores()
  );

  const loadScoreboardData = () => {
    setMatches(getMatches());
    setScores(getScores());
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadScoreboardData();
    }, 0);

    const refreshInterval = setInterval(() => {
      loadScoreboardData();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(refreshInterval);
    };
  }, []);

  const eventMatches = matches.filter(
    (match) => match.eventId === assignedEvent.id
  );

  const getScore = (matchId: string) => {
    return scores.find((score) => score.matchId === matchId);
  };

  const getStatus = (
    match: StoredMatch,
    score?: StoredScore
  ) => {
    if (score?.status === "Locked") {
      return "Completed";
    }

    if (score?.status === "Submitted") {
      return "Submitted";
    }

    return match.status;
  };

  const getStatusStyle = (status: string) => {
    if (status === "Live") {
      return "border-red-800 bg-red-950/40 text-red-400";
    }

    if (status === "Submitted") {
      return "border-blue-800 bg-blue-950/40 text-blue-400";
    }

    if (status === "Completed") {
      return "border-green-800 bg-green-950/40 text-green-400";
    }

    return "border-yellow-800 bg-yellow-950/40 text-yellow-400";
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
            iSports
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Public Scoreboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            View current match scores and match status.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-500">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Updates automatically every 5 seconds
          </div>
        </section>

        {/* EVENT INFORMATION */}
        <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                {assignedEvent.sport}
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                {assignedEvent.name}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
                {assignedEvent.description}
              </p>
            </div>

            <span className="w-fit rounded-full border border-blue-800 bg-blue-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-300">
              Live Event
            </span>
          </div>

          <div className="mt-6 grid gap-3 border-t border-gray-800 pt-5 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date
              </p>

              <p className="mt-1 text-sm font-medium text-gray-200">
                {assignedEvent.date}
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Venue
              </p>

              <p className="mt-1 text-sm font-medium text-gray-200">
                {assignedEvent.venue}
              </p>
            </div>
          </div>
        </section>

        {/* SCOREBOARD */}
        <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Scores
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Live Scoreboard
              </h2>
            </div>

            <p className="text-sm text-gray-500">
              {eventMatches.length}{" "}
              {eventMatches.length === 1 ? "match" : "matches"}
            </p>
          </div>

          {eventMatches.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-800 bg-gray-950 px-5 py-10 text-center">
              <p className="text-base font-semibold text-gray-300">
                No matches available for this event.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Match scores will appear here when matches are created.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {eventMatches.map((match) => {
                const score = getScore(match.id);
                const status = getStatus(match, score);

                return (
                  <article
                    key={match.id}
                    className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950"
                  >
                    {/* MATCH HEADER */}
                    <div className="flex flex-col gap-3 border-b border-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Match
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-300">
                          {match.id}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${getStatusStyle(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* TEAMS AND SCORES */}
                    <div className="px-5 py-7 sm:px-8 sm:py-8">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center sm:gap-6">
                        <div className="min-w-0">
                          <p className="break-words text-base font-bold text-gray-100 sm:text-xl">
                            {match.teamA}
                          </p>

                          <p className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">
                            {score ? score.scoreA : 0}
                          </p>
                        </div>

                        <div className="rounded-full border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-bold text-gray-500">
                          VS
                        </div>

                        <div className="min-w-0">
                          <p className="break-words text-base font-bold text-gray-100 sm:text-xl">
                            {match.teamB}
                          </p>

                          <p className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">
                            {score ? score.scoreB : 0}
                          </p>
                        </div>
                      </div>

                      {/* MATCH DATE */}
                      <div className="mt-7 border-t border-gray-800 pt-5 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Match Date
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {match.date}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* NAVIGATION */}
        <section className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            href="/scoring"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-gray-200"
          >
            ← Back to Scoring
          </Link>

          <Link
            href="/scoring/public-results"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Public Results →
          </Link>
        </section>
      </div>
    </main>
  );
}