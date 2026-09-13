"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";

import { events } from "@/data/events";
import { getAllEvents } from "@/data/eventsStorage";
import { students } from "@/data/students";

export default function EventDetailsPage() {
  const params = useParams();

  const id = params.id as string;

  const allEvents = useMemo(
    () => getAllEvents(events),
    []
  );

  const event = allEvents.find(
    (event) => event.id === id
  );

  const student = students[0];

  if (!id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports
          </p>

          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            Loading Event...
          </h1>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
        <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 text-center shadow-sm sm:p-8">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports Events
          </p>

          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
            Event Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            The event you are looking for does not exist.
          </p>

          <Link
            href="/events"
            className="mt-6 inline-block w-full rounded-lg bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-200 sm:w-auto"
          >
            Back to Events
          </Link>

        </div>
      </main>
    );
  }

  const isEligible =
    student.course === "Diploma" &&
    student.age >= (event.minAge ?? 0) &&
    student.age <= (event.maxAge ?? 100);

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-4xl">

        {/* EVENT HEADER */}

        <section className="border-b border-gray-800 pb-8 sm:pb-10">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            {event.sport}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {event.name}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base sm:leading-7">
            {event.description}
          </p>

        </section>

        {/* EVENT DETAILS */}

        <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-10 sm:p-7">

          <h2 className="text-xl font-bold sm:text-2xl">
            Event Details
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Date
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-200">
                {event.date}
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Venue
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-200">
                {event.venue}
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Registration Deadline
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-200">
                {event.registrationDeadline}
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Registration Type
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-200">
                {event.registrationType === "team"
                  ? `Team (${event.teamSize} players)`
                  : "Individual"}
              </p>
            </div>

          </div>

        </section>

        {/* ELIGIBILITY */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <h2 className="text-xl font-bold sm:text-2xl">
            Eligibility Criteria
          </h2>

          <ul className="mt-5 space-y-3">
            {event.eligibility.map(
              (criterion, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-sm leading-6 text-gray-300"
                >
                  {criterion}
                </li>
              )
            )}
          </ul>

        </section>

        {/* REGISTRATION */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <h2 className="text-xl font-bold sm:text-2xl">
            Registration
          </h2>

          {isEligible ? (
            <div className="mt-5">

              <div className="rounded-lg border border-green-800 bg-green-950/30 p-4">
                <p className="text-sm font-semibold text-green-400">
                  ✓ You are eligible to register.
                </p>
              </div>

              <Link
                href={`/events/${event.id}/register`}
                className="mt-5 block w-full rounded-lg bg-white px-6 py-3.5 text-center text-sm font-bold text-black transition hover:bg-gray-200 sm:py-4 sm:text-base"
              >
                Register for this Event
              </Link>

            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-red-800 bg-red-950/30 p-4">
              <p className="text-sm font-semibold text-red-400">
                ✕ You are not eligible for this event.
              </p>
            </div>
          )}

        </section>

        {/* RULES */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:mt-8 sm:p-7">

          <h2 className="text-xl font-bold sm:text-2xl">
            Rules
          </h2>

          <ul className="mt-5 space-y-3">
            {event.rules.map(
              (rule, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-sm leading-6 text-gray-300"
                >
                  {rule}
                </li>
              )
            )}
          </ul>

        </section>

        {/* BACK BUTTON */}

        <div className="mt-6 sm:mt-8">

          <Link
            href="/events"
            className="inline-block w-full rounded-lg border border-gray-700 px-5 py-3 text-center text-sm font-semibold transition hover:border-gray-600 hover:bg-gray-900 sm:w-auto"
          >
            ← Back to Events
          </Link>

        </div>

      </div>
    </main>
  );
}