"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getEvents } from "@/data/eventsStorage";
import {
getMatches,
type StoredMatch,
} from "@/data/matchStorage";
import {
getScores,
type StoredScore,
} from "@/data/scoreStorage";
import { getInChargeAccounts } from "@/data/inchargeStorage";
import type { SportEvent } from "@/types/events";

export default function DashboardPage() {
const [assignedEvents, setAssignedEvents] = useState<SportEvent[]>([]);
const [selectedEventId, setSelectedEventId] = useState<string>("");

const [matches, setMatches] = useState<StoredMatch[]>([]);
const [scores, setScores] = useState<StoredScore[]>([]);

const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
const [refreshError, setRefreshError] = useState(false);

// Load assigned events, matches and scores.
useEffect(() => {
const loadData = () => {
try {
const savedUser = localStorage.getItem("isports_user");

    if (!savedUser) {
      setAssignedEvents([]);
      setSelectedEventId("");
    } else {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role !== "incharge") {
        setAssignedEvents([]);
        setSelectedEventId("");
      } else {
        const accounts = getInChargeAccounts();

        const account = accounts.find(
          (item) =>
            item.id === parsedUser.accountId ||
            item.username === parsedUser.username
        );

        if (!account) {
          setAssignedEvents([]);
          setSelectedEventId("");
        } else {
          const allEvents = getEvents();

          const filteredEvents = allEvents.filter((event) =>
            account.assignedEventIds?.includes(event.id)
          );

          setAssignedEvents(filteredEvents);

          setSelectedEventId((currentId) => {
            if (
              currentId &&
              filteredEvents.some(
                (event) => event.id === currentId
              )
            ) {
              return currentId;
            }

            return filteredEvents[0]?.id || "";
          });
        }
      }
    }

    setMatches(getMatches());
    setScores(getScores());

    setLastUpdated(new Date());
    setRefreshError(false);
  } catch (error) {
    console.error(
      "Unable to refresh scoring dashboard:",
      error
    );
    setRefreshError(true);
  }
};

// Load data immediately.
loadData();

// Refresh every five seconds.
const refreshInterval = window.setInterval(() => {
  loadData();
}, 5000);

// Refresh when another browser tab changes relevant data.
const handleStorageChange = (event: StorageEvent) => {
  const relevantKeys = [
    "isports_user",
    "isports_incharge_accounts",
    "isports_events",
    "isports_matches",
    "isports_scores",
  ];

  if (
    event.key === null ||
    relevantKeys.includes(event.key)
  ) {
    loadData();
  }
};

window.addEventListener("storage", handleStorageChange);

return () => {
  window.clearInterval(refreshInterval);
  window.removeEventListener("storage", handleStorageChange);
};

}, []);

// Find the currently selected assigned event.
const assignedEvent = assignedEvents.find(
(event) => event.id === selectedEventId
);

// Only show matches belonging to the selected assigned event.
const eventMatches = selectedEventId
? matches.filter(
(match) => match.eventId === selectedEventId
)
: [];

// Determine dashboard status from score state.
const getMatchStatus = (match: StoredMatch) => {
const score = scores.find(
(item) => item.matchId === match.id
);

if (score?.status === "Locked") {
  return "Completed";
}

if (score) {
  return "Live";
}

return "Upcoming";

};

// Match statistics.
const totalMatches = eventMatches.length;

const completedMatches = eventMatches.filter(
(match) => getMatchStatus(match) === "Completed"
).length;

const liveMatches = eventMatches.filter(
(match) => getMatchStatus(match) === "Live"
).length;

const upcomingMatches = eventMatches.filter(
(match) => getMatchStatus(match) === "Upcoming"
).length;

// Show a fallback if no event is assigned or selected.
if (!assignedEvent) {
return (
<main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
<div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
<p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
iSports Scoring
</p>

      <h1 className="mt-3 text-2xl font-bold">
        No Assigned Event
      </h1>

      <p className="mt-3 text-sm leading-6 text-gray-400">
        No event has been assigned to your Match
        In-Charge account yet.
      </p>

      <Link
        href="/incharge/dashboard"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500"
      >
        Back to In-Charge Dashboard
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
        Tournament Dashboard
      </h1>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base sm:leading-7">
        Monitor your assigned event, match progress
        and scoring activity.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-400">
          Updates automatically every 5 seconds
        </span>

        <span className="text-xs text-gray-500">
          {lastUpdated
            ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
            : "Loading latest data..."}
        </span>

        {refreshError && (
          <span className="text-xs font-semibold text-amber-400">
            Refresh failed. Retrying automatically.
          </span>
        )}
      </div>
    </section>

    {/* EVENT SELECTOR */}
    <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-10 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 sm:text-sm">
            Assigned Events
          </p>

          <h2 className="mt-2 text-xl font-bold sm:text-2xl">
            Select Event
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Statistics and match activity are shown
            only for your selected assigned event.
          </p>
        </div>

        <div className="w-full sm:max-w-sm">
          <label
            htmlFor="event-selector"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Event
          </label>

          <select
            id="event-selector"
            value={selectedEventId}
            onChange={(event) =>
              setSelectedEventId(event.target.value)
            }
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
          >
            {assignedEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>

    {/* EVENT INFORMATION */}
    <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 sm:text-sm">
            Selected Assigned Event
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {assignedEvent.name}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
            {assignedEvent.description}
          </p>
        </div>

        <span className="w-fit shrink-0 rounded-full border border-blue-800 bg-blue-950/30 px-3 py-1.5 text-xs font-bold text-blue-400">
          {assignedEvent.sport}
        </span>
      </div>

      <div className="mt-6 grid gap-4 border-t border-gray-800 pt-6 sm:grid-cols-2">
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
      </div>
    </section>

    {/* STATISTICS */}
    <section className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm transition hover:border-gray-700 sm:p-6">
        <p className="text-sm font-semibold text-gray-400">
          Total Matches
        </p>

        <p className="mt-3 text-4xl font-bold tracking-tight">
          {totalMatches}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Matches in this event
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm transition hover:border-gray-700 sm:p-6">
        <p className="text-sm font-semibold text-gray-400">
          Completed
        </p>

        <p className="mt-3 text-4xl font-bold tracking-tight text-green-400">
          {completedMatches}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Locked matches
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm transition hover:border-gray-700 sm:p-6">
        <p className="text-sm font-semibold text-gray-400">
          Live
        </p>

        <p className="mt-3 text-4xl font-bold tracking-tight text-red-400">
          {liveMatches}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Matches with scores
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm transition hover:border-gray-700 sm:p-6">
        <p className="text-sm font-semibold text-gray-400">
          Upcoming
        </p>

        <p className="mt-3 text-4xl font-bold tracking-tight text-yellow-400">
          {upcomingMatches}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Awaiting scoring
        </p>
      </div>
    </section>

    {/* MATCH OVERVIEW */}
    <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Event Progress
          </p>

          <h2 className="mt-2 text-xl font-bold sm:text-2xl">
            Match Overview
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Current status of matches assigned to this event.
          </p>
        </div>

        <p className="text-sm font-semibold text-gray-400">
          {totalMatches}{" "}
          {totalMatches === 1 ? "match" : "matches"}
        </p>
      </div>

      {eventMatches.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-800 bg-gray-950 px-5 py-10 text-center sm:px-6">
          <p className="text-sm font-semibold text-gray-300 sm:text-base">
            No matches available
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            No matches have been created for this event yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {eventMatches.map((match) => {
            const status = getMatchStatus(match);

            return (
              <div
                key={match.id}
                className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-950 p-4 transition hover:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="min-w-0">
                  <p className="break-words text-base font-bold sm:text-lg">
                    {match.teamA}{" "}
                    <span className="text-gray-500">vs</span>{" "}
                    {match.teamB}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 sm:text-sm">
                    <span>Date: {match.date}</span>
                    <span>Match ID: {match.id}</span>
                  </div>
                </div>

                <span
                  className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${
                    status === "Completed"
                      ? "border-green-800 bg-green-950/40 text-green-400"
                      : status === "Live"
                        ? "border-red-800 bg-red-950/40 text-red-400"
                        : "border-yellow-800 bg-yellow-950/40 text-yellow-400"
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>

    {/* QUICK ACCESS */}
    <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          Navigation
        </p>

        <h2 className="mt-2 text-xl font-bold sm:text-2xl">
          Quick Access
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Quickly access the main scoring and tournament sections for the selected event.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href={`/scoring/matches?eventId=${selectedEventId}`}
          className="group rounded-xl border border-gray-800 bg-gray-950 p-5 transition hover:border-gray-700 hover:bg-gray-900 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Match Management</h3>
            <span className="text-gray-500 transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Create and manage matches for this event.
          </p>
        </Link>

        <Link
          href={`/scoring/scoreboard?eventId=${selectedEventId}`}
          className="group rounded-xl border border-gray-800 bg-gray-950 p-5 transition hover:border-gray-700 hover:bg-gray-900 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Scoreboard</h3>
            <span className="text-gray-500 transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            View current scores for this event.
          </p>
        </Link>

        <Link
          href={`/scoring/public-results?eventId=${selectedEventId}`}
          className="group rounded-xl border border-gray-800 bg-gray-950 p-5 transition hover:border-gray-700 hover:bg-gray-900 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Public Results</h3>
            <span className="text-gray-500 transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            View official results for this event.
          </p>
        </Link>

        <Link
          href={`/scoring/standings?eventId=${selectedEventId}`}
          className="group rounded-xl border border-gray-800 bg-gray-950 p-5 transition hover:border-gray-700 hover:bg-gray-900 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Standings</h3>
            <span className="text-gray-500 transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            View team rankings and points for this event.
          </p>
        </Link>

        <Link
          href={`/scoring/brackets?eventId=${selectedEventId}`}
          className="group rounded-xl border border-gray-800 bg-gray-950 p-5 transition hover:border-gray-700 hover:bg-gray-900 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Brackets</h3>
            <span className="text-gray-500 transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            View the tournament bracket for this event.
          </p>
        </Link>
      </div>
    </section>

    {/* BACK */}
    <section className="mt-6 sm:mt-8">
      <Link
        href="/scoring"
        className="inline-block w-full rounded-lg border border-gray-700 bg-gray-900 px-6 py-3 text-center text-sm font-bold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800 sm:w-auto"
      >
        Back to Scoring
      </Link>
    </section>
  </div>
</main>

);
}