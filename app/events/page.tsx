"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { events } from "@/data/events";
import { getAllEvents } from "@/data/eventstorage";
import type { SportsEvent } from "@/types/sports";

export default function EventsPage() {
  const [allEvents, setAllEvents] = useState<SportsEvent[]>([]);

  useEffect(() => {
    const storedEvents = getAllEvents(events);

    setAllEvents(storedEvents);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">

      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <h1 className="text-4xl font-bold">
          Sports Events
        </h1>

        <p className="mt-3 text-gray-400">
          Discover available sports events and
          register before the deadline.
        </p>

        {/* Events */}

        <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {allEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-600"
            >

              {/* Sport */}

              <p className="text-sm font-semibold text-gray-400">
                {event.sport}
              </p>

              {/* Event Name */}

              <h2 className="mt-2 text-2xl font-bold">
                {event.name}
              </h2>

              {/* Description */}

              <p className="mt-3 text-gray-400">
                {event.description}
              </p>

              {/* Event Information */}

              <div className="mt-5 space-y-2 text-sm">

                <p>
                  <span className="font-semibold">
                    Date:
                  </span>{" "}
                  {event.date}
                </p>

                <p>
                  <span className="font-semibold">
                    Venue:
                  </span>{" "}
                  {event.venue}
                </p>

                <p>
                  <span className="font-semibold">
                    Registration:
                  </span>{" "}
                  {event.registrationType === "team"
                    ? `Team (${event.teamSize} players)`
                    : "Individual"}
                </p>

                <p className="text-gray-400">
                  Deadline:{" "}
                  {event.registrationDeadline}
                </p>

              </div>

              {/* Register Button */}

              <Link
                href={`/events/${event.id}/register`}
                className="mt-6 block rounded-lg bg-white px-5 py-3 text-center font-bold text-black hover:bg-gray-200"
              >
                Register Now
              </Link>

            </div>
          ))}

        </section>

      </div>

    </main>
  );
}