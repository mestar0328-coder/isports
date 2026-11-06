"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getInChargeAccounts } from "@/data/inchargeStorage";
import { getEvents } from "@/data/eventsStorage";
import { getScoresByEvent } from "@/data/data/scoringStorage";

import type { SportEvent } from "@/types/events";

type InChargeUser = {
role: string;
name: string;
username: string;
assignedSport: string;
assignedEventIds: string[];
};

type EventScoreSummary = {
total: number;
draft: number;
submitted: number;
locked: number;
};

function emptySummary(): EventScoreSummary {
return {
total: 0,
draft: 0,
submitted: 0,
locked: 0,
};
}

export default function InChargeDashboardPage() {
const router = useRouter();
const [user, setUser] = useState<InChargeUser | null>(null);
const [assignedEvents, setAssignedEvents] = useState<SportEvent[]>([]);
const [scoreSummaries, setScoreSummaries] = useState<
  Record<string, EventScoreSummary>
>({});
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

const refreshScoreSummaries = useCallback(
  (events: SportEvent[]) => {
const summaries: Record<string, EventScoreSummary> = {};

  events.forEach((event) => {
    const scores = getScoresByEvent(event.id);

    summaries[event.id] = {
      total: scores.length,
      draft: scores.filter((score) => score.status === "draft").length,
      submitted: scores.filter((score) => score.status === "submitted").length,
      locked: scores.filter((score) => score.status === "locked").length,
    };
  });

  setScoreSummaries(summaries);
  setLastUpdated(new Date());
},
[]

);

useEffect(() => {
const savedUser = localStorage.getItem("isports_user");

if (!savedUser) {
  router.replace("/incharge/login");
  return;
}

try {
  const parsedUser = JSON.parse(savedUser);

  if (parsedUser.role !== "incharge") {
    localStorage.removeItem("isports_user");
    router.replace("/incharge/login");
    return;
  }

  const accounts = getInChargeAccounts();

  const account = accounts.find(
    (item) =>
      item.id === parsedUser.accountId ||
      item.username === parsedUser.username
  );

  if (!account || !account.isActive) {
    localStorage.removeItem("isports_user");
    router.replace("/incharge/login");
    return;
  }

  if (new Date(account.expiresAt) < new Date()) {
    localStorage.removeItem("isports_user");
    router.replace("/incharge/login");
    return;
  }

  const currentUser: InChargeUser = {
    role: "incharge",
    name: account.name,
    username: account.username,
    assignedSport: account.assignedSport,
    assignedEventIds: account.assignedEventIds || [],
  };

  const allEvents = getEvents();

  const filteredEvents = allEvents.filter((event) =>
    currentUser.assignedEventIds.includes(event.id)
  );

  setUser(currentUser);
  setAssignedEvents(filteredEvents);
  refreshScoreSummaries(filteredEvents);
} catch {
  localStorage.removeItem("isports_user");
  router.replace("/incharge/login");
}

}, [router, refreshScoreSummaries]);

// Refresh score information periodically and when another tab
// changes the event score storage.
useEffect(() => {
if (!user) return;

const refresh = () => {
  refreshScoreSummaries(assignedEvents);
};

const interval = window.setInterval(refresh, 5000);

const handleStorageChange = (event: StorageEvent) => {
  if (
    event.key === "isports_event_scores" ||
    event.key === "isports_score_recovery"
  ) {
    refresh();
  }
};

window.addEventListener("storage", handleStorageChange);

return () => {
  window.clearInterval(interval);
  window.removeEventListener("storage", handleStorageChange);
};

}, [user, assignedEvents, refreshScoreSummaries]);

function handleLogout() {
localStorage.removeItem("isports_user");
router.push("/");
}

function handleManageMatches(eventId: string) {
router.push(`/scoring/matches?eventId=${eventId}`);
}

if (!user) {
return (
<main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
Loading...
</main>
);
}

return (
<main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
<div className="mx-auto max-w-5xl">
<div className="flex flex-wrap items-center justify-between gap-4">
<div>
<h1 className="text-3xl font-bold">
Match In-Charge Dashboard
</h1>

        <p className="mt-2 text-gray-400">
          Welcome, {user.name}
        </p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-500"
      >
        Logout
      </button>
    </div>

    <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-xl font-semibold">
        Your Assigned Sport
      </h2>

      <p className="mt-3 text-2xl text-purple-300">
        {user.assignedSport}
      </p>
    </section>

    <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Your Assigned Events
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            These are the events assigned to you by the administrator.
          </p>
        </div>

        <div className="text-xs text-gray-500">
          {lastUpdated
            ? `Updated: ${lastUpdated.toLocaleTimeString()}`
            : "Loading score information..."}
        </div>
      </div>

      {assignedEvents.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-700 bg-gray-950 p-6">
          <p className="text-gray-400">
            No events have been assigned to you yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {assignedEvents.map((event) => {
            const summary =
              scoreSummaries[event.id] ?? emptySummary();

            return (
              <div
                key={event.id}
                className="rounded-xl border border-gray-700 bg-gray-800 p-5"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {event.name}
                    </h3>

                    <div className="mt-3 space-y-1 text-sm text-gray-400">
                      <p>Sport: {event.sportId}</p>
                      <p>Venue: {event.venue}</p>
                      <p>Date: {event.date}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleManageMatches(event.id)}
                    className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 sm:w-auto"
                  >
                    Manage Matches
                  </button>
                </div>

                <div className="mt-6 border-t border-gray-700 pt-5">
                  <h4 className="mb-3 text-sm font-semibold text-gray-300">
                    Live Scoring Progress
                  </h4>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-gray-950 p-3">
                      <p className="text-xs text-gray-400">
                        Total Scores
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {summary.total}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-950 p-3">
                      <p className="text-xs text-yellow-400">
                        Draft
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {summary.draft}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-950 p-3">
                      <p className="text-xs text-blue-400">
                        Submitted
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {summary.submitted}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-950 p-3">
                      <p className="text-xs text-green-400">
                        Locked
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {summary.locked}
                      </p>
                    </div>
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