"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Sport } from "@/types/sports";
import type { SportEvent } from "@/types/events";
import type { Registration } from "@/data/registrationsStorage";

import { getAllSports } from "@/data/sportsStorage";
import { getEvents } from "@/data/eventsStorage";
import {
  getRegistrations,
} from "@/data/registrationsStorage";

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<
    Registration[]
  >([]);

  const [events, setEvents] = useState<SportEvent[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => {
    setRegistrations(getRegistrations());
    setEvents(getEvents());
    setSports(getAllSports());
  }, []);

  function getEvent(eventId: string) {
    return events.find(
      (event) => event.id === eventId
    );
  }

  function getSport(sportId: string) {
    return sports.find(
      (sport) => sport.id === sportId
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <header className="rounded-xl border border-gray-800 bg-gray-900 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            My Registrations
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            View the sports events you have registered
            for.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-gray-200"
            >
              ← Browse Events
            </Link>

            <Link
              href="/"
              className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-gray-950"
            >
              Home
            </Link>
          </div>
        </header>

        {/* REGISTRATIONS */}
        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6 sm:p-8">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Your Activity
          </p>

          <h2 className="mt-2 text-xl font-bold">
            {registrations.length}{" "}
            {registrations.length === 1
              ? "Registration"
              : "Registrations"}
          </h2>

          {registrations.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-700 p-10 text-center">

              <div className="text-4xl">
                📋
              </div>

              <h3 className="mt-4 font-bold">
                No registrations yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Browse available events and register
                to play.
              </p>

              <Link
                href="/events"
                className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-bold text-black hover:bg-gray-200"
              >
                Browse Events
              </Link>

            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {registrations.map((registration) => {
                const event = getEvent(
                  registration.eventId
                );

                if (!event) {
                  return (
                    <article
                      key={registration.id}
                      className="rounded-xl border border-red-900 bg-gray-950 p-5"
                    >
                      <p className="font-bold text-red-300">
                        Event no longer available
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        Registration ID:{" "}
                        {registration.id}
                      </p>
                    </article>
                  );
                }

                const sport = getSport(event.sportId);

                return (
                  <article
                    key={registration.id}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-5 sm:p-6"
                  >

                    {/* EVENT HEADER */}
                    <div className="flex items-start gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-2xl">
                        {sport?.icon || "🏟️"}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-lg font-bold">
                            {event.name}
                          </h3>

                          <span className="rounded-full border border-green-800 bg-green-950/40 px-2.5 py-1 text-xs font-bold text-green-300">
                            ✓ Registered
                          </span>

                        </div>

                        <p className="mt-1 text-sm text-blue-400">
                          {sport?.name ||
                            event.sportId}
                        </p>

                      </div>
                    </div>

                    {/* PLAYER */}
                    <div className="mt-5 rounded-lg border border-gray-800 bg-gray-900 p-4">

                      <p className="text-xs text-gray-500">
                        Registered Player
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white">
                        👤 {registration.playerName}
                      </p>

                    </div>

                    {/* EVENT DETAILS */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">

                      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                        <p className="text-xs text-gray-500">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-200">
                          📅 {event.date}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                        <p className="text-xs text-gray-500">
                          Time
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-200">
                          🕐 {event.time}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                        <p className="text-xs text-gray-500">
                          Venue
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-200">
                          📍 {event.venue}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                        <p className="text-xs text-gray-500">
                          Maximum Players
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-200">
                          👥 {event.maxPlayers}
                        </p>
                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>
      </div>
    </main>
  );
}