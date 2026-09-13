"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { events } from "@/data/events";
import {
  getScores,
  StoredScore,
} from "@/data/scoreStorage";

export default function ResultsPage() {
  const assignedEvent = events[0];

  const [results, setResults] = useState<StoredScore[]>([]);

  useEffect(() => {
    const loadResults = () => {
      const scores = getScores();

      const completedScores = scores.filter(
        (score) => score.status !== "Draft"
      );

      setResults(completedScores);
    };

    loadResults();
  }, []);

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
    <main className="min-h-screen bg-[#080a0f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <section>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-400">
            iSports Tournament
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Match Results
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            View saved match scores and winners.
          </p>
        </section>

        {/* EVENT */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-5 shadow-xl sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Tournament Event
              </p>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                {assignedEvent.name}
              </h2>
            </div>

            <span className="w-fit rounded-full border border-blue-800 bg-blue-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-300">
              Results
            </span>
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Sport
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-200">
                {assignedEvent.sport}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Venue
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-200">
                {assignedEvent.venue}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Date
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-200">
                {assignedEvent.date}
              </p>
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-gray-900/70 p-5 shadow-xl sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Results
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Saved Match Results
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Submitted match scores and winners.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-400">
              {results.length}{" "}
              {results.length === 1 ? "Result" : "Results"}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-10 text-center">
              <p className="text-lg font-bold text-gray-300">
                No match results yet
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Submitted match scores will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {results.map((match) => {
                const winner = getWinner(match);

                return (
                  <article
                    key={match.matchId}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                  >
                    {/* MATCH HEADER */}
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                          Match
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-400">
                          {match.matchId}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          match.status === "Locked"
                            ? "border-green-800 bg-green-950/40 text-green-400"
                            : "border-blue-800 bg-blue-950/40 text-blue-400"
                        }`}
                      >
                        {match.status}
                      </span>
                    </div>

                    {/* SCORE */}
                    <div className="px-5 py-6 sm:px-6 sm:py-7">
                      <div className="space-y-3">
                        <div
                          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-4 transition ${
                            winner === match.teamA
                              ? "border-green-500/30 bg-green-950/30"
                              : "border-white/10 bg-gray-900/80"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-black text-gray-100 sm:text-base">
                              {match.teamA}
                            </p>

                            {winner === match.teamA && (
                              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-green-500">
                                Winner
                              </p>
                            )}
                          </div>

                          <span className="shrink-0 text-3xl font-black text-white">
                            {match.scoreA}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-white/5" />

                          <span className="text-xs font-black text-gray-600">
                            VS
                          </span>

                          <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <div
                          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-4 transition ${
                            winner === match.teamB
                              ? "border-green-500/30 bg-green-950/30"
                              : "border-white/10 bg-gray-900/80"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-black text-gray-100 sm:text-base">
                              {match.teamB}
                            </p>

                            {winner === match.teamB && (
                              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-green-500">
                                Winner
                              </p>
                            )}
                          </div>

                          <span className="shrink-0 text-3xl font-black text-white">
                            {match.scoreB}
                          </span>
                        </div>
                      </div>

                      {/* WINNER */}
                      <div className="mt-5 rounded-xl border border-green-500/20 bg-green-950/20 p-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-wider text-green-500">
                          Match Winner
                        </p>

                        <p className="mt-1 text-lg font-black text-green-300">
                          {winner}
                        </p>
                      </div>

                      {/* VIEW MATCH */}
                      <Link
                        href={`/scoring/matches/${match.matchId}`}
                        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-blue-500/20 bg-blue-600/10 px-5 py-3 text-sm font-black text-blue-400 transition hover:bg-blue-600 hover:text-white"
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

        {/* NAVIGATION */}
        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            href="/scoring/matches"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ← Back to Match Management
          </Link>

          <Link
            href="/scoring/brackets"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            View Bracket →
          </Link>
        </div>
      </div>
    </main>
  );
}