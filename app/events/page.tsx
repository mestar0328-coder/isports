"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Sport } from "@/types/sports";
import type { SportEvent } from "@/types/events";

import { getAllSports } from "@/data/sportsStorage";
import { getEvents } from "@/data/eventsStorage";

import {
  addRegistration,
  isRegistered,
} from "@/data/registrationsStorage";

export default function EventsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] =
    useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadedSports = getAllSports();
    const loadedEvents = getEvents();

    setSports(loadedSports);
    setEvents(loadedEvents);

    const registered = loadedEvents
      .filter((event) => isRegistered(event.id))
      .map((event) => event.id);

    setRegisteredEvents(registered);
  }, []);

  function getSport(sportId: string) {
    return sports.find(
      (sport) => sport.id === sportId
    );
  }

  function handleRegister(event: SportEvent) {
    setMessage("");

    if (event.status !== "Open") {
      setMessage(
        "Registration for this event is closed."
      );
      return;
    }

    if (isRegistered(event.id)) {
      setRegisteredEvents((current) =>
        current.includes(event.id)
          ? current
          : [...current, event.id]
      );

      setMessage(
        `You are already registered for ${event.name}.`
      );
      return;
    }

    const playerName = window.prompt(
      "Enter your name to register:"
    );

    if (!playerName || !playerName.trim()) {
      setMessage(
        "Registration cancelled. Please enter your name."
      );
      return;
    }

    addRegistration({
      id: `registration-${Date.now()}`,
      eventId: event.id,
      playerName: playerName.trim(),
      createdAt: new Date().toISOString(),
    });

    setRegisteredEvents((current) => [
      ...current,
      event.id,
    ]);

    setMessage(
      `Successfully registered for ${event.name}.`
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
            Sports Events
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            Discover upcoming sports events and register
            to play with other players.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-gray-950"
          >
            ← Back Home
          </Link>
        </header>

        {/* EVENTS */}
        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6 sm:p-8">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Upcoming
          </p>

          <h2 className="mt-2 text-xl font-bold">
            {events.length}{" "}
            {events.length === 1
              ? "Event"
              : "Events"}
          </h2>

          {/* MESSAGE */}
          {message && (
            <div className="mt-5 rounded-lg border border-blue-800 bg-blue-950/40 px-4 py-3 text-sm font-semibold text-blue-300">
              {message}
            </div>
          )}

          {/* NO EVENTS */}
          {events.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-700 p-10 text-center">
              <div className="text-4xl">
                📅
              </div>

              <h3 className="mt-4 font-bold">
                No events available
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                There are no sports events published yet.
                Check back later.
              </p>
            </div>
          ) : (
            /* EVENT LIST */
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {events.map((event) => {
                const sport = getSport(event.sportId);
                const registered =
                  registeredEvents.includes(event.id);

                return (
                  <article
                    key={event.id}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-5 sm:p-6"
                  >

                    {/* EVENT TITLE */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-2xl">
                        {sport?.icon || "🏟️"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">
                            {event.name}
                          </h3>

                          <span
                            className={
                              event.status === "Open"
                                ? "rounded-full border border-green-800 bg-green-950/40 px-2.5 py-1 text-xs font-bold text-green-300"
                                : "rounded-full border border-red-800 bg-red-950/40 px-2.5 py-1 text-xs font-bold text-red-300"
                            }
                          >
                            {event.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-blue-400">
                          {sport?.name || event.sportId}
                        </p>
                      </div>
                    </div>

                    {/* DESCRIPTION */}
                    {event.description && (
                      <p className="mt-5 text-sm leading-6 text-gray-400">
                        {event.description}
                      </p>
                    )}

                    {/* EVENT DETAILS */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

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
                          Players
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-200">
                          👥 Up to {event.maxPlayers}
                        </p>
                      </div>

                    </div>

                    {/* REGISTER BUTTON */}
                    <button
                      type="button"
                      onClick={() =>
                        handleRegister(event)
                      }
                      disabled={
                        event.status !== "Open" ||
                        registered
                      }
                      className={
                        registered
                          ? "mt-5 w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-bold text-white"
                          : "mt-5 w-full rounded-lg bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                      }
                    >
                      {registered
                        ? "✓ Registered"
                        : event.status === "Open"
                        ? "Register to Play"
                        : "Registration Closed"}
                    </button>

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