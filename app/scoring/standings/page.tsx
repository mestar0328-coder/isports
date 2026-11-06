"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
getMatches,
type StoredMatch,
} from "@/data/matchStorage";
import {
getScores,
type StoredScore,
} from "@/data/scoreStorage";
import { getEvents } from "@/data/eventsStorage";
import { getCurrentInchargeAccess } from "@/data/inchargeAuth";

type Standing = {
team: string;
played: number;
wins: number;
draws: number;
losses: number;
points: number;
};

function isPublishedStatus(status: unknown): boolean {
if (typeof status !== "string") return false;

const normalized = status.trim().toLowerCase();
return normalized === "submitted" || normalized === "locked";
}

function StandingsContent() {
const searchParams = useSearchParams();
const eventId = searchParams.get("eventId");

const [assignedEvent, setAssignedEvent] = useState<{
id: string;
name: string;
sport: string;
venue: string;
date: string;
} | null>(null);

const [matches, setMatches] = useState<StoredMatch[]>([]);
const [scores, setScores] = useState<StoredScore[]>([]);
const [authorized, setAuthorized] = useState(false);
const [loading, setLoading] = useState(true);
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

useEffect(() => {
let isMounted = true;

const loadData = () => {
  try {
    if (!eventId) {
      if (isMounted) {
        setAuthorized(false);
        setAssignedEvent(null);
        setMatches([]);
        setScores([]);
        setLoading(false);
        setLastUpdated(new Date());
      }
      return;
    }

    const access = getCurrentInchargeAccess();

    if (
      !access ||
      access.expired ||
      !Array.isArray(access.assignedEventIds) ||
      !access.assignedEventIds.includes(eventId)
    ) {
      if (isMounted) {
        setAuthorized(false);
        setAssignedEvent(null);
        setMatches([]);
        setScores([]);
        setLoading(false);
        setLastUpdated(new Date());
      }
      return;
    }

    const event = getEvents().find((item) => item.id === eventId);

    if (!event) {
      if (isMounted) {
        setAuthorized(false);
        setAssignedEvent(null);
        setMatches([]);
        setScores([]);
        setLoading(false);
        setLastUpdated(new Date());
      }
      return;
    }

    const latestMatches = getMatches();
    const latestScores = getScores();

    if (isMounted) {
      setAssignedEvent({
        id: event.id,
        name: event.name,
        sport: event.sport,
        venue: event.venue,
        date: event.date,
      });

      setMatches(latestMatches);
      setScores(latestScores);
      setAuthorized(true);
      setLoading(false);
      setLastUpdated(new Date());
    }
  } catch (error) {
    console.error("Unable to load standings:", error);

    if (isMounted) {
      setAuthorized(false);
      setAssignedEvent(null);
      setMatches([]);
      setScores([]);
      setLoading(false);
      setLastUpdated(new Date());
    }
  }
};

loadData();

// Fallback refresh for changes that occur in the current tab.
const refreshInterval = setInterval(loadData, 5000);

// The storage event fires when another browser tab changes localStorage.
const handleStorageChange = (event: StorageEvent) => {
  const relevantKeys = [
    "isports_scores",
    "isports_event_scores",
    "isports_score_recovery",
    "isports_user",
    "isports_incharge_accounts",
    "isports_events",
    "isports_matches",
  ];

  if (event.key === null || relevantKeys.includes(event.key)) {
    loadData();
  }
};

window.addEventListener("storage", handleStorageChange);

return () => {
  isMounted = false;
  clearInterval(refreshInterval);
  window.removeEventListener("storage", handleStorageChange);
};

}, [eventId]);

const eventMatches = useMemo(
() => matches.filter((match) => match.eventId === eventId),
[matches, eventId]
);

const eventMatchIds = useMemo(
() => new Set(eventMatches.map((match) => match.id)),
[eventMatches]
);

const publishedResults = useMemo(
() =>
scores.filter(
(score) =>
isPublishedStatus(score.status) &&
eventMatchIds.has(score.matchId)
),
[scores, eventMatchIds]
);

// Derive teams from actual match participants instead of hardcoding names.
const teams = useMemo(() => {
const teamNames = new Set<string>();

for (const match of eventMatches) {
  if (match.matchType === "individual") continue;

  if (typeof match.teamA === "string" && match.teamA.trim()) {
    teamNames.add(match.teamA.trim());
  }

  if (typeof match.teamB === "string" && match.teamB.trim()) {
    teamNames.add(match.teamB.trim());
  }
}

return Array.from(teamNames);

}, [eventMatches]);

const sortedStandings = useMemo(() => {
const standings: Standing[] = teams.map((team) => ({
team,
played: 0,
wins: 0,
draws: 0,
losses: 0,
points: 0,
}));

const standingByTeam = new Map(
  standings.map((standing) => [standing.team, standing])
);

for (const score of publishedResults) {
  const match = eventMatches.find(
    (item) => item.id === score.matchId
  );

  if (!match || match.matchType === "individual") continue;

  const teamAStanding = standingByTeam.get(match.teamA);
  const teamBStanding = standingByTeam.get(match.teamB);

  if (!teamAStanding || !teamBStanding) continue;

  teamAStanding.played += 1;
  teamBStanding.played += 1;

  if (score.scoreA === score.scoreB) {
    teamAStanding.draws += 1;
    teamBStanding.draws += 1;
    teamAStanding.points += 1;
    teamBStanding.points += 1;
    continue;
  }

  if (score.scoreA > score.scoreB) {
    teamAStanding.wins += 1;
    teamBStanding.losses += 1;
    teamAStanding.points += 3;
  } else {
    teamBStanding.wins += 1;
    teamAStanding.losses += 1;
    teamBStanding.points += 3;
  }
}

return [...standings].sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.wins !== a.wins) return b.wins - a.wins;
  return a.team.localeCompare(b.team);
});

}, [teams, publishedResults, eventMatches]);

if (loading) {
return (
<main className="flex min-h-screen items-center justify-center bg-[#080a0f] text-white">
<p className="text-gray-400">Loading standings...</p>
</main>
);
}

if (!eventId) {
return (
<main className="flex min-h-screen items-center justify-center bg-[#080a0f] px-6 text-white">
<div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900 p-8 text-center">
<h1 className="text-2xl font-black">Event Not Selected</h1>

      <p className="mt-3 text-sm leading-6 text-gray-400">
        Please open Standings from an assigned event.
      </p>

      <Link
        href="/scoring/dashboard"
        className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-700"
      >
        Back to Dashboard
      </Link>
    </div>
  </main>
);

}

if (!authorized || !assignedEvent) {
return (
<main className="flex min-h-screen items-center justify-center bg-[#080a0f] px-6 text-white">
<div className="w-full max-w-lg rounded-2xl border border-red-900 bg-gray-900 p-8 text-center">
<h1 className="text-2xl font-black text-red-400">
Access Denied
</h1>

      <p className="mt-3 text-sm leading-6 text-gray-400">
        Your In-Charge access is invalid, expired, or not assigned to this event.
      </p>

      <Link
        href="/scoring/dashboard"
        className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-700"
      >
        Back to Dashboard
      </Link>
    </div>
  </main>
);

}

return (
<main className="min-h-screen bg-[#080a0f] px-4 py-8 text-white sm:px-6 lg:px-8">
<div className="mx-auto max-w-6xl">
{/* HEADER */}
<section>
<p className="text-sm font-bold uppercase tracking-widest text-blue-400">
iSports Tournament
</p>

      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
        Standings
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
        View team standings for the assigned tournament event.
      </p>

      <p className="mt-2 text-xs text-gray-500">
        {lastUpdated
          ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
          : "Updating standings..."}
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
          Standings
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

    {/* EVENT ISOLATION NOTICE */}
    <section className="mt-6 rounded-xl border border-blue-900 bg-blue-950/20 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
        Event Standings
      </p>

      <p className="mt-2 text-sm leading-6 text-gray-400">
        Standings include only Submitted and Locked team scores from this assigned event.
      </p>
    </section>

    {/* STANDINGS */}
    <section className="mt-8 rounded-2xl border border-white/10 bg-gray-900/70 p-5 shadow-xl sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Rankings
          </p>

          <h2 className="mt-1 text-2xl font-black">
            Team Standings
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Standings are calculated from published team match results.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-400">
          {sortedStandings.length} Teams
        </div>
      </div>

      {sortedStandings.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-500">
          No team matches are available for this event yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-white/10 bg-black/30">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Rank
                </th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Team
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                  Played
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                  Wins
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                  Draws
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                  Losses
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                  Points
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedStandings.map((team, index) => (
                <tr
                  key={team.team}
                  className="border-b border-white/5 last:border-b-0 transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                      <span className="text-sm font-black text-gray-400">
                        {index + 1}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <span className="font-black text-gray-100">
                      {team.team}
                    </span>
                  </td>

                  <td className="px-5 py-5 text-center font-semibold text-gray-300">
                    {team.played}
                  </td>

                  <td className="px-5 py-5 text-center font-semibold text-green-400">
                    {team.wins}
                  </td>

                  <td className="px-5 py-5 text-center font-semibold text-yellow-400">
                    {team.draws}
                  </td>

                  <td className="px-5 py-5 text-center font-semibold text-red-400">
                    {team.losses}
                  </td>

                  <td className="px-5 py-5 text-center">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-lg border border-blue-800/50 bg-blue-950/30 px-2.5 py-1.5 font-black text-blue-400">
                      {team.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-600">
        Points: Win = 3 · Draw = 1 · Loss = 0
      </p>
    </section>

    {/* NAVIGATION */}
    <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
      <Link
        href={`/scoring/matches?eventId=${encodeURIComponent(eventId)}`}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/10 hover:text-white"
      >
        ← Match Management
      </Link>

      <Link
        href={`/scoring/public-results?eventId=${encodeURIComponent(eventId)}`}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
      >
        View Results →
      </Link>
    </div>
  </div>
</main>

);
}

export default function StandingsPage() {
return (
<Suspense
fallback={
<main className="flex min-h-screen items-center justify-center bg-[#080a0f] text-white">
<p className="text-gray-400">Loading standings...</p>
</main>
}
>
<StandingsContent />
</Suspense>
);
}