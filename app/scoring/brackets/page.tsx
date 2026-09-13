"use client";

import Link from "next/link";
import { useState } from "react";
import { events } from "@/data/events";

type BracketMatch = {
  id: string;
  teamA: string;
  teamB: string;
  status: "Upcoming" | "Live" | "Completed";
  winner?: string;
};

type NextRoundMatch = {
  id: string;
  sourceMatchA: string;
  sourceMatchB: string;
  teamA: string;
  teamB: string;
  status: "Waiting" | "Ready" | "Completed";
  winner?: string;
};

export default function BracketsPage() {
  const assignedEvent = events[0];

  const [matches, setMatches] = useState<BracketMatch[]>([
    {
      id: "match-1",
      teamA: "Team A",
      teamB: "Team B",
      status: "Upcoming",
    },
    {
      id: "match-2",
      teamA: "Team C",
      teamB: "Team D",
      status: "Upcoming",
    },
  ]);

  const [nextRoundMatch, setNextRoundMatch] =
    useState<NextRoundMatch>({
      id: "match-3",
      sourceMatchA: "match-1",
      sourceMatchB: "match-2",
      teamA: "Winner Match 1",
      teamB: "Winner Match 2",
      status: "Waiting",
    });

  const [tournamentWinner, setTournamentWinner] =
    useState("");

  const handleRoundOneWinner = (
    matchId: string,
    winner: string
  ) => {
    setMatches((currentMatches) =>
      currentMatches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              status: "Completed",
              winner,
            }
          : match
      )
    );

    setNextRoundMatch((currentMatch) => {
      const updatedMatch = {
        ...currentMatch,
        teamA:
          matchId === "match-1"
            ? winner
            : currentMatch.teamA,
        teamB:
          matchId === "match-2"
            ? winner
            : currentMatch.teamB,
      };

      const firstWinner =
        matchId === "match-1"
          ? winner
          : updatedMatch.teamA !== "Winner Match 1"
            ? updatedMatch.teamA
            : "";

      const secondWinner =
        matchId === "match-2"
          ? winner
          : updatedMatch.teamB !== "Winner Match 2"
            ? updatedMatch.teamB
            : "";

      return {
        ...updatedMatch,
        status:
          firstWinner && secondWinner
            ? "Ready"
            : "Waiting",
      };
    });
  };

  const handleFinalWinner = (winner: string) => {
    if (nextRoundMatch.status !== "Ready") {
      return;
    }

    setNextRoundMatch((currentMatch) => ({
      ...currentMatch,
      status: "Completed",
      winner,
    }));

    setTournamentWinner(winner);
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
            Tournament Bracket
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            Manage tournament rounds and advance winners through
            the bracket.
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
              Bracket
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

        {/* BRACKET */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-gray-900/70 p-5 shadow-xl sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Bracket
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Match Progression
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Winners advance automatically to the next round.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-400">
              2 Rounds
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">

            {/* ROUND 1 */}
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-sm font-black text-blue-400">
                  1
                </span>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-300">
                    Round 1
                  </h3>

                  <p className="mt-1 text-xs text-gray-600">
                    Opening matches
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {matches.map((match, index) => (
                  <article
                    key={match.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                  >
                    {/* MATCH HEADER */}
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                          Match
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-400">
                          Match {index + 1}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          match.status === "Completed"
                            ? "border-green-800 bg-green-950/40 text-green-400"
                            : match.status === "Live"
                              ? "border-blue-800 bg-blue-950/40 text-blue-400"
                              : "border-yellow-800 bg-yellow-950/40 text-yellow-400"
                        }`}
                      >
                        {match.status}
                      </span>
                    </div>

                    {/* TEAMS */}
                    <div className="px-5 py-5">
                      <div className="space-y-3">

                        <div
                          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-4 ${
                            match.winner === match.teamA
                              ? "border-green-500/30 bg-green-950/30"
                              : "border-white/10 bg-gray-900/80"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-black text-gray-100">
                              {match.teamA}
                            </p>

                            {match.winner === match.teamA && (
                              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-green-500">
                                Winner
                              </p>
                            )}
                          </div>

                          {match.winner === match.teamA && (
                            <span className="shrink-0 text-lg text-green-400">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-white/5" />

                          <span className="text-xs font-black text-gray-600">
                            VS
                          </span>

                          <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <div
                          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-4 ${
                            match.winner === match.teamB
                              ? "border-green-500/30 bg-green-950/30"
                              : "border-white/10 bg-gray-900/80"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-black text-gray-100">
                              {match.teamB}
                            </p>

                            {match.winner === match.teamB && (
                              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-green-500">
                                Winner
                              </p>
                            )}
                          </div>

                          {match.winner === match.teamB && (
                            <span className="shrink-0 text-lg text-green-400">
                              ✓
                            </span>
                          )}
                        </div>

                      </div>

                      {/* WINNER ACTIONS */}
                      {match.status !== "Completed" && (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleRoundOneWinner(
                                match.id,
                                match.teamA
                              )
                            }
                            className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                          >
                            {match.teamA} Wins
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleRoundOneWinner(
                                match.id,
                                match.teamB
                              )
                            }
                            className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                          >
                            {match.teamB} Wins
                          </button>
                        </div>
                      )}

                      {/* VIEW MATCH */}
                      <Link
                        href={`/scoring/matches/${match.id}`}
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                      >
                        View Match →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* ROUND 2 */}
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600/10 text-sm font-black text-green-400">
                  2
                </span>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-300">
                    Round 2
                  </h3>

                  <p className="mt-1 text-xs text-gray-600">
                    Final match
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <article className="overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 to-black/20">

                  {/* FINAL HEADER */}
                  <div className="flex items-center justify-between gap-3 border-b border-blue-500/10 px-5 py-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                        Championship
                      </p>

                      <p className="mt-1 text-sm font-black text-gray-300">
                        Final Match
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        nextRoundMatch.status === "Completed"
                          ? "border-green-800 bg-green-950/40 text-green-400"
                          : nextRoundMatch.status === "Ready"
                            ? "border-blue-800 bg-blue-950/40 text-blue-400"
                            : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      {nextRoundMatch.status}
                    </span>
                  </div>

                  <div className="px-5 py-6">

                    {/* FINAL TEAMS */}
                    <div className="space-y-3">

                      <div
                        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-4 ${
                          nextRoundMatch.winner === nextRoundMatch.teamA
                            ? "border-green-500/30 bg-green-950/30"
                            : "border-blue-500/20 bg-blue-950/20"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-black text-gray-100">
                            {nextRoundMatch.teamA}
                          </p>

                          {nextRoundMatch.winner === nextRoundMatch.teamA && (
                            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-green-500">
                              Winner
                            </p>
                          )}
                        </div>

                        {nextRoundMatch.winner === nextRoundMatch.teamA && (
                          <span className="shrink-0 text-lg text-green-400">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/5" />

                        <span className="text-xs font-black text-gray-600">
                          VS
                        </span>

                        <div className="h-px flex-1 bg-white/5" />
                      </div>

                      <div
                        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-4 ${
                          nextRoundMatch.winner === nextRoundMatch.teamB
                            ? "border-green-500/30 bg-green-950/30"
                            : "border-blue-500/20 bg-blue-950/20"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-black text-gray-100">
                            {nextRoundMatch.teamB}
                          </p>

                          {nextRoundMatch.winner === nextRoundMatch.teamB && (
                            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-green-500">
                              Winner
                            </p>
                          )}
                        </div>

                        {nextRoundMatch.winner === nextRoundMatch.teamB && (
                          <span className="shrink-0 text-lg text-green-400">
                            ✓
                          </span>
                        )}
                      </div>

                    </div>

                    {/* FINAL ACTIONS */}
                    {nextRoundMatch.status === "Ready" && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleFinalWinner(
                              nextRoundMatch.teamA
                            )
                          }
                          className="min-h-11 rounded-xl border border-blue-500/20 bg-blue-950/20 px-3 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-950/40"
                        >
                          {nextRoundMatch.teamA} Wins
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleFinalWinner(
                              nextRoundMatch.teamB
                            )
                          }
                          className="min-h-11 rounded-xl border border-blue-500/20 bg-blue-950/20 px-3 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-950/40"
                        >
                          {nextRoundMatch.teamB} Wins
                        </button>
                      </div>
                    )}

                    {/* ADVANCEMENT */}
                    <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Advancement
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Round 1 winners advance to the final match.
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </div>

          </div>

          {/* TOURNAMENT WINNER */}
          {tournamentWinner && (
            <div className="mt-8 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-950/30 to-black/20 p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-green-400">
                Tournament Winner
              </p>

              <h3 className="mt-3 text-3xl font-black text-green-300 sm:text-4xl">
                {tournamentWinner}
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                Winner successfully advanced through the bracket.
              </p>
            </div>
          )}

          {/* INFORMATION */}
          <div className="mt-8 rounded-xl border border-dashed border-white/10 bg-black/10 p-5">
            <p className="text-sm font-bold text-gray-300">
              Bracket advancement
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Round 1 winners advance to the final match, and the
              final winner is displayed as the tournament winner.
            </p>
          </div>
        </section>

        {/* BACK */}
        <div className="mt-8">
          <Link
            href="/scoring/matches"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/10 hover:text-white sm:w-auto"
          >
            ← Back to Match Management
          </Link>
        </div>

      </div>
    </main>
  );
}