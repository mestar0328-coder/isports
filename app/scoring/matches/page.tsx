"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { events } from "@/data/events";
import {
  getMatches,
  saveMatch,
  StoredMatch,
  MatchStatus,
} from "@/data/matchStorage";
import {
  getScores,
  StoredScore,
} from "@/data/scoreStorage";
import {
  canAccessEvent,
  isInchargeAuthorized,
} from "@/data/inchargeAuth";

const CORRECTION_TIME = 45 * 60 * 1000;

const teams = [
  "Team A",
  "Team B",
  "Team C",
  "Team D",
];

export default function MatchesPage() {
  const router = useRouter();

  const assignedEvent = events[0];

  const [matches, setMatches] =
    useState<StoredMatch[]>(() => getMatches());

  const [scores, setScores] =
    useState<StoredScore[]>(() => getScores());

  const [currentTime, setCurrentTime] =
    useState(0);

  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [date, setDate] = useState("");

  const authorized =
    isInchargeAuthorized() &&
    canAccessEvent(assignedEvent.id);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    const interval = setInterval(() => {
      setMatches(getMatches());
      setScores(getScores());
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [authorized]);

  const getScore = (matchId: string) => {
    return scores.find(
      (score) => score.matchId === matchId
    );
  };

  const getMatchStatus = (
    match: StoredMatch
  ): MatchStatus => {
    const score = getScore(match.id);

    if (
      !score ||
      score.status === "Draft"
    ) {
      return "Upcoming";
    }

    if (score.status === "Locked") {
      return "Completed";
    }

    if (
      score.status === "Submitted" &&
      score.submittedAt
    ) {
      const submittedTime = new Date(
        score.submittedAt
      ).getTime();

      const elapsed =
        currentTime - submittedTime;

      if (
        elapsed >= CORRECTION_TIME
      ) {
        return "Completed";
      }

      return "Live";
    }

    return "Upcoming";
  };

  const getStatusStyle = (
    status: MatchStatus
  ) => {
    if (status === "Live") {
      return "border-red-800 bg-red-950/40 text-red-400";
    }

    if (status === "Completed") {
      return "border-green-800 bg-green-950/40 text-green-400";
    }

    return "border-yellow-800 bg-yellow-950/40 text-yellow-400";
  };

  const eventMatches = matches.filter(
    (match) =>
      match.eventId === assignedEvent.id
  );

  const createMatch = () => {
    if (!authorized) {
      alert(
        "You are not authorized to manage this event."
      );
      return;
    }

    if (!teamA) {
      alert("Please select Team A.");
      return;
    }

    if (!teamB) {
      alert("Please select Team B.");
      return;
    }

    if (teamA === teamB) {
      alert(
        "Team A and Team B must be different."
      );
      return;
    }

    if (!date) {
      alert("Please select a match date.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      alert(
        "Please enter a valid date with a 4-digit year."
      );
      return;
    }

    const newMatch: StoredMatch = {
      id: `match-${Date.now()}`,
      eventId: assignedEvent.id,
      teamA,
      teamB,
      date,
      status: "Upcoming",
    };

    saveMatch(newMatch);

    setTeamA("");
    setTeamB("");
    setDate("");

    setMatches(getMatches());
    setScores(getScores());
  };

  const openScorePage = (
    matchId: string
  ) => {
    router.push(
      `/scoring/matches/${matchId}`
    );
  };

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="w-full max-w-md rounded-xl border border-red-800 bg-gray-900 p-6 text-center shadow-sm sm:p-8">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-800 bg-red-950/40 text-2xl">
            🔒
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-blue-400">
            iSports Scoring
          </p>

          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            Access Denied
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            You are not authorized to manage this event.
          </p>

          <Link
            href="/scoring"
            className="mt-6 inline-block w-full rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-gray-200 sm:w-auto"
          >
            Back to Scoring
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <section className="border-b border-gray-800 pb-8 sm:pb-10">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports Scoring
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Match Management
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base sm:leading-7">
            Create, manage and monitor matches for your assigned event.
          </p>

        </section>

        {/* ASSIGNED EVENT */}

        <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-10 sm:p-7">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 sm:text-sm">
                Assigned Event
              </p>

              <h2 className="mt-2 break-words text-2xl font-bold tracking-tight sm:mt-3 sm:text-3xl">
                {assignedEvent.name}
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
                {assignedEvent.description}
              </p>

            </div>

            <span className="w-fit shrink-0 rounded-full border border-green-800 bg-green-950/40 px-4 py-2 text-xs font-bold text-green-400">
              Temporary Incharge
            </span>

          </div>

          <div className="mt-6 grid gap-4 border-t border-gray-800 pt-6 sm:grid-cols-3 sm:gap-5">

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Date
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-200">
                {assignedEvent.date}
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Venue
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-200">
                {assignedEvent.venue}
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Access
              </p>

              <p className="mt-2 text-sm font-semibold text-green-400">
                Authorized
              </p>
            </div>

          </div>

        </section>

        {/* CREATE MATCH */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Match Setup
            </p>

            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Create Match
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Select the participating teams and match date.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-5">

            {/* TEAM A */}

            <div>
              <label
                htmlFor="team-a"
                className="block text-sm font-semibold text-gray-300"
              >
                Team A
              </label>

              <select
                id="team-a"
                value={teamA}
                onChange={(e) =>
                  setTeamA(e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="">
                  Select Team
                </option>

                {teams.map((team) => (
                  <option
                    key={team}
                    value={team}
                  >
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* TEAM B */}

            <div>
              <label
                htmlFor="team-b"
                className="block text-sm font-semibold text-gray-300"
              >
                Team B
              </label>

              <select
                id="team-b"
                value={teamB}
                onChange={(e) =>
                  setTeamB(e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="">
                  Select Team
                </option>

                {teams.map((team) => (
                  <option
                    key={team}
                    value={team}
                  >
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* MATCH DATE */}

            <div>
              <label
                htmlFor="match-date"
                className="block text-sm font-semibold text-gray-300"
              >
                Match Date
              </label>

              <input
                id="match-date"
                type="date"
                value={date}
                onChange={(e) => {
                  const value = e.target.value;

                  if (
                    /^\d{0,4}-?\d{0,2}-?\d{0,2}$/.test(
                      value.replaceAll("-", "")
                    )
                  ) {
                    setDate(value);
                  }
                }}
                min="2026-01-01"
                max="2099-12-31"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

          </div>

          <div className="mt-6 border-t border-gray-800 pt-6">

            <button
              type="button"
              onClick={createMatch}
              className="w-full rounded-lg bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:bg-gray-200 active:bg-gray-300 sm:w-auto"
            >
              Create Match
            </button>

          </div>

        </section>

        {/* MATCH LIST */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <div className="flex flex-col gap-3 border-b border-gray-800 pb-6 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Event Matches
              </p>

              <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                Assigned Event Matches
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {eventMatches.length}{" "}
                {eventMatches.length === 1
                  ? "match"
                  : "matches"}{" "}
                available
              </p>
            </div>

            <span className="w-fit rounded-full border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-500">
              Live status updates
            </span>

          </div>

          {eventMatches.length === 0 ? (

            <div className="mt-6 rounded-lg border border-dashed border-gray-800 bg-gray-950 px-5 py-10 text-center sm:px-6 sm:py-12">

              <p className="text-base font-semibold text-gray-300 sm:text-lg">
                No matches available
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Create a match above to begin managing scores.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {eventMatches.map((match) => {
                const score =
                  getScore(match.id);

                const status =
                  getMatchStatus(match);

                return (
                  <div
                    key={match.id}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-5 transition hover:border-gray-700 sm:p-6"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      {/* MATCH INFORMATION */}

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="break-words text-lg font-bold tracking-tight sm:text-xl">
                            {match.teamA}
                          </p>

                          <span className="text-sm font-semibold text-gray-600">
                            VS
                          </span>

                          <p className="break-words text-lg font-bold tracking-tight sm:text-xl">
                            {match.teamB}
                          </p>

                        </div>

                        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:gap-x-5">

                          <span>
                            Match Date:{" "}
                            <span className="font-medium text-gray-300">
                              {match.date}
                            </span>
                          </span>

                          {score && (
                            <span>
                              Score:{" "}
                              <span className="font-semibold text-gray-300">
                                {score.scoreA} - {score.scoreB}
                              </span>
                            </span>
                          )}

                        </div>

                      </div>

                      {/* STATUS + ACTION */}

                      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">

                        <span
                          className={`w-fit rounded-full border px-4 py-2 text-xs font-bold ${getStatusStyle(
                            status
                          )}`}
                        >
                          {status}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            openScorePage(
                              match.id
                            )
                          }
                          className="w-full rounded-lg bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-200 active:bg-gray-300 sm:w-auto"
                        >
                          Manage Score
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </section>

        {/* NAVIGATION */}

        <section className="mt-6 sm:mt-8">

          <Link
            href="/scoring"
            className="inline-block w-full rounded-lg border border-gray-700 bg-gray-900 px-6 py-3 text-center text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800 sm:w-auto"
          >
            ← Back to Scoring
          </Link>

        </section>

      </div>
    </main>
  );
}
