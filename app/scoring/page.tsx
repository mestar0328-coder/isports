"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getEvents } from "@/data/eventsStorage";
import { getInChargeAccounts } from "@/data/inchargeStorage";
import type { SportEvent } from "@/types/events";

type InChargeUser = {
  role: string;
  name: string;
  username: string;
  assignedSport: string;
  assignedEventIds: string[];
};

export default function ScoringPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<InChargeUser | null>(null);

  const [assignedEvents, setAssignedEvents] =
    useState<SportEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const savedUser =
      localStorage.getItem("isports_user");

    if (!savedUser) {
      router.replace("/incharge/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role !== "incharge") {
        router.replace("/incharge/login");
        return;
      }

      const accounts =
        getInChargeAccounts();

      const account = accounts.find(
        (item) =>
          item.username === parsedUser.username
      );

      if (!account) {
        localStorage.removeItem(
          "isports_user"
        );

        router.replace("/incharge/login");
        return;
      }

      const currentUser: InChargeUser = {
        role: "incharge",
        name: account.name,
        username: account.username,
        assignedSport: account.assignedSport,
        assignedEventIds:
          account.assignedEventIds || [],
      };

      const allEvents = getEvents();

      const filteredEvents =
        allEvents.filter((event) =>
          currentUser.assignedEventIds.includes(
            event.id
          )
        );

      setUser(currentUser);
      setAssignedEvents(filteredEvents);
      setLoading(false);
    } catch {
      localStorage.removeItem(
        "isports_user"
      );

      router.replace("/incharge/login");
    }
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        Loading...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <section className="border-b border-gray-800 pb-6 sm:pb-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 sm:text-sm">
                iSports Scoring
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:mt-3 sm:text-4xl">
                Scoring Incharge
              </h1>

              <p className="mt-3 text-sm text-gray-400 sm:text-base">
                Welcome, {user.name}
              </p>

            </div>

            <Link
              href="/incharge/dashboard"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800 sm:w-auto"
            >
              ← In-Charge Dashboard
            </Link>

          </div>

        </section>

        {/* AUTHORIZATION */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <h2 className="text-xl font-bold sm:text-2xl">
            Access Authorization
          </h2>

          <div className="mt-4 rounded-lg border border-green-900 bg-green-950/30 p-4 sm:mt-5 sm:p-5">

            <p className="font-semibold text-green-400">
              ✓ Authorized Scoring Incharge
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              You can manage scores only for events
              assigned to your account.
            </p>

          </div>

        </section>

        {/* INCHARGE INFORMATION */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <h2 className="text-xl font-bold sm:text-2xl">
            Incharge Information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3 sm:gap-5">

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Name
              </p>

              <p className="mt-2 font-semibold text-gray-200">
                {user.name}
              </p>

            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Sport
              </p>

              <p className="mt-2 font-semibold text-purple-300">
                {user.assignedSport}
              </p>

            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Assigned Events
              </p>

              <p className="mt-2 font-semibold text-blue-400">
                {assignedEvents.length}
              </p>

            </div>

          </div>

        </section>

        {/* ASSIGNED EVENTS */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <div className="border-b border-gray-800 pb-6">

            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Event Access
            </p>

            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Your Assigned Events
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Only events assigned to your Match In-Charge
              account are available for scoring.
            </p>

          </div>

          {assignedEvents.length === 0 ? (

            <div className="mt-6 rounded-lg border border-dashed border-gray-700 bg-gray-950 p-6 text-center">

              <p className="font-semibold text-gray-300">
                No events assigned
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Please contact the administrator if you
                need an event assigned.
              </p>

            </div>

          ) : (

            <div className="mt-6 grid gap-5 lg:grid-cols-2">

              {assignedEvents.map((event) => (

                <div
                  key={event.id}
                  className="rounded-xl border border-gray-700 bg-gray-950 p-5 transition hover:border-blue-800 sm:p-6"
                >

                  {/* EVENT HEADER */}

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      {event.sport}
                    </p>

                    <h3 className="mt-2 break-words text-xl font-bold sm:text-2xl">
                      {event.name}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-gray-400">
                      {event.description}
                    </p>

                  </div>

                  {/* EVENT DETAILS */}

                  <div className="mt-5 space-y-3 border-t border-gray-800 pt-5">

                    <div className="flex items-center justify-between gap-4">

                      <span className="text-sm text-gray-500">
                        Date
                      </span>

                      <span className="text-right text-sm font-semibold text-gray-300">
                        {event.date}
                      </span>

                    </div>

                    <div className="flex items-center justify-between gap-4">

                      <span className="text-sm text-gray-500">
                        Venue
                      </span>

                      <span className="text-right text-sm font-semibold text-gray-300">
                        {event.venue}
                      </span>

                    </div>

                    <div className="flex items-center justify-between gap-4">

                      <span className="text-sm text-gray-500">
                        Access
                      </span>

                      <span className="text-right text-sm font-semibold text-green-400">
                        Authorized
                      </span>

                    </div>

                  </div>

                  {/* EVENT ACTIONS */}

                  <div className="mt-6 border-t border-gray-800 pt-5">

                    <Link
                      href={`/scoring/matches?eventId=${event.id}`}
                      className="block w-full rounded-lg bg-white px-5 py-3 text-center text-sm font-bold text-black transition hover:bg-gray-200"
                    >
                      Manage Matches
                    </Link>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>
    </main>
  );
}