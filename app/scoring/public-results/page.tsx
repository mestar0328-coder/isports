"use client";

import { useState } from "react";
import Link from "next/link";

import { events } from "@/data/events";
import {
  getMatches,
  StoredMatch,
} from "@/data/matchStorage";
import {
  getScores,
  StoredScore,
} from "@/data/scoreStorage";

export default function PublicResultsPage() {
  const assignedEvent = events[0];

  const [matches] = useState<StoredMatch[]>(() => getMatches());
  const [scores] = useState<StoredScore[]>(() => getScores());

  const eventMatches = matches.filter(
    (match) => match.eventId === assignedEvent.id
  );

  const results = scores.filter(
    (score) =>
      (score.status === "Submitted" || score.status === "Locked") &&
      eventMatches.some((match) => match.id === score.matchId)
  );

  const getWinner = (score: StoredScore) => {
    if (score.scoreA > score.scoreB) {
      return score.teamA;
    }

    if (score.scoreB > score.scoreA) {
      return score.teamB;
    }

    return "Draw";
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
            Public Results
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            View official results of completed matches.
          </p>
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
            </div>

            <span className="w-fit rounded-full border border-blue-800 bg-blue-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-300">
              Official Event
            </span>
          </div>

          <div className="mt-6 grid gap-3 border-t border-gray-800 pt-5 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date
              </p>

              <p className="mt-1 font-medium text-gray-200">
                {assignedEvent.date}
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Venue
              </p>

              <p className="mt-1 font-medium text-gray-200">
                {assignedEvent.venue}
              </p>
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Results
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Match Results
              </h2>
            </div>

            <p className="text-sm text-gray-500">
              {results.length}{" "}
              {results.length === 1 ? "result" : "results"}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-800 bg-gray-950 px-5 py-10 text-center">
              <p className="text-base font-semibold text-gray-300">
                No official results available yet.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Completed match results will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {results.map((result) => {
                const match = eventMatches.find(
                  (item) => item.id === result.matchId
                );

                if (!match) {
                  return null;
                }

                const winner = getWinner(result);

                return (
                  <article
                    key={result.matchId}
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

                      <span className="w-fit rounded-full border border-green-800 bg-green-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-400">
                        {result.status === "Locked"
                          ? "Official"
                          : "Submitted"}
                      </span>
                    </div>

                    {/* SCORE */}
                    <div className="px-5 py-7 sm:px-8 sm:py-8">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center sm:gap-6">
                        <div className="min-w-0">
                          <p className="break-words text-base font-bold text-gray-100 sm:text-xl">
                            {match.teamA}
                          </p>

                          <p className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                            {result.scoreA}
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
                            {result.scoreB}
                          </p>
                        </div>
                      </div>

                      {/* MATCH DATE */}
                      <div className="mt-6 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Match Date
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {match.date}
                        </p>
                      </div>

                      {/* WINNER */}
                      <div className="mt-6 rounded-xl border border-green-800/50 bg-green-950/20 px-4 py-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-wider text-green-500">
                          Winner
                        </p>

                        <p className="mt-1 text-base font-bold text-green-300 sm:text-lg">
                          {winner}
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
        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            href="/scoring/scoreboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            ← Scoreboard
          </Link>

          <Link
            href="/scoring/standings"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View Standings →
          </Link>
        </div>
      </div>
    </main>
  );
}