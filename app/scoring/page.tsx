"use client";

import Link from "next/link";
import { events } from "@/data/events";

export default function ScoringPage() {
  const assignedEvent = events[0];

  const isAuthorized = true;

  return (
    <main className="min-h-screen bg-gray-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <section className="border-b border-gray-800 pb-6 sm:pb-8">

          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 sm:text-sm">
            iSports Scoring
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:mt-3 sm:text-4xl">
            Scoring Incharge
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            Manage scores for your assigned sports event.
          </p>

        </section>

        {/* AUTHORIZATION */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <h2 className="text-xl font-bold sm:text-2xl">
            Access Authorization
          </h2>

          {isAuthorized ? (
            <div className="mt-4 rounded-lg border border-green-900 bg-green-950/30 p-4 sm:mt-5 sm:p-5">

              <p className="font-semibold text-green-400">
                ✓ Authorized Scoring Incharge
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                You are authorized to manage scores for the
                assigned event.
              </p>

            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-red-900 bg-red-950/30 p-4 sm:mt-5 sm:p-5">

              <p className="font-semibold text-red-400">
                ✕ Access Denied
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                You are not authorized to manage scores.
              </p>

            </div>
          )}

        </section>

        {/* INFORMATION GRID */}

        <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-2">

          {/* INCHARGE INFORMATION */}

          <section className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:p-7">

            <h2 className="text-xl font-bold sm:text-2xl">
              Incharge Information
            </h2>

            <div className="mt-5 space-y-4 text-sm text-gray-300 sm:mt-6 sm:text-base">

              <div className="flex flex-col gap-1 border-b border-gray-800 pb-3 sm:flex-row sm:items-center sm:justify-between">

                <span className="text-gray-500">
                  Name
                </span>

                <strong>
                  Sports Incharge
                </strong>

              </div>

              <div className="flex flex-col gap-1 border-b border-gray-800 pb-3 sm:flex-row sm:items-center sm:justify-between">

                <span className="text-gray-500">
                  Access Type
                </span>

                <span className="font-semibold text-yellow-400">
                  Temporary
                </span>

              </div>

              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                <span className="text-gray-500">
                  Access Status
                </span>

                <span className="font-semibold text-green-400">
                  Active
                </span>

              </div>

            </div>

          </section>

          {/* ASSIGNED EVENT */}

          <section className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:p-7">

            <h2 className="text-xl font-bold sm:text-2xl">
              Assigned Event
            </h2>

            <div className="mt-5 sm:mt-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 sm:text-sm">
                {assignedEvent.sport}
              </p>

              <h3 className="mt-2 break-words text-xl font-bold sm:mt-3 sm:text-2xl">
                {assignedEvent.name}
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                {assignedEvent.description}
              </p>

              <div className="mt-5 space-y-3 border-t border-gray-800 pt-5 text-sm text-gray-300 sm:mt-6 sm:pt-6">

                <p>
                  <strong>Date:</strong>{" "}
                  {assignedEvent.date}
                </p>

                <p>
                  <strong>Venue:</strong>{" "}
                  {assignedEvent.venue}
                </p>

                <p>
                  <strong>Registration Type:</strong>{" "}
                  {assignedEvent.registrationType}
                </p>

              </div>

            </div>

          </section>

        </div>

        {/* MATCH MANAGEMENT */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h2 className="text-xl font-bold sm:text-2xl">
                Match Management
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                Manage matches and enter scores for the assigned
                event.
              </p>

            </div>

            {isAuthorized && (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

                <Link
                  href="/scoring/matches"
                  className="w-full rounded-lg bg-white px-6 py-3 text-center text-sm font-bold text-black transition hover:bg-gray-200 sm:w-auto"
                >
                  Manage Matches
                </Link>

                <Link
                  href="/scoring/dashboard"
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
                >
                  Tournament Dashboard
                </Link>

              </div>
            )}

          </div>

        </section>

      </div>
    </main>
  );
}