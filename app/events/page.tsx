"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SportEvent } from "@/types/events";
import { getEvents } from "@/data/eventsStorage";

export default function EventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState<SportEvent[]>([]);

  useEffect(() => {
    setEvents(getEvents());
  }, []);

  function isRegistrationOpen(deadline: string) {
    return new Date(deadline) >= new Date();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Upcoming Sports Events
          </h1>

          <p className="mt-3 text-gray-400">
            Explore sports events and register before the deadline.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-8 text-center">
            <h2 className="text-2xl font-semibold">
              No Events Available
            </h2>

            <p className="mt-2 text-gray-400">
              New sports events will appear here when published.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const registrationOpen = isRegistrationOpen(
                event.registrationDeadline
              );

              return (
                <div
                  key={event.id}
                  className="flex flex-col rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-lg"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                    {event.sport}
                  </p>

                  <h2 className="mt-3 text-2xl font-bold">
                    {event.name}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-gray-400">
                    {event.description}
                  </p>

                  <div className="mt-5 space-y-2 text-sm text-gray-300">
                    <p>
                      <span className="font-semibold">Date:</span>{" "}
                      {event.date}
                    </p>

                    <p>
                      <span className="font-semibold">Venue:</span>{" "}
                      {event.venue}
                    </p>

                    <p>
                      <span className="font-semibold">
                        Registration deadline:
                      </span>{" "}
                      {event.registrationDeadline}
                    </p>
                  </div>

                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/events/${event.id}`)
                      }
                      className="w-full rounded-lg border border-blue-500 px-4 py-3 font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-white"
                    >
                      View Event Details
                    </button>

                    {registrationOpen ? (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/events/${event.id}/register`
                          )
                        }
                        className="mt-3 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-500"
                      >
                        Register Now
                      </button>
                    ) : (
                      <p className="mt-3 rounded-lg bg-red-950 px-4 py-3 text-center text-sm font-semibold text-red-300">
                        Registration Closed
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}