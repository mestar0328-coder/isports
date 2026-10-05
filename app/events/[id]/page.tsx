"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { SportEvent } from "@/types/events";
import { getEvents } from "@/data/eventsStorage";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [event, setEvent] = useState<SportEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paramValues = Object.values(params ?? {});
    const eventId = String(paramValues[0] ?? "").trim();

    if (!eventId) {
      setLoading(false);
      return;
    }

    const foundEvent = getEvents().find(
      (item) => String(item.id).trim() === eventId
    );

    setEvent(foundEvent ?? null);
    setLoading(false);
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        Loading event details...
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">Event Not Found</h1>

          <button
            type="button"
            onClick={() => router.push("/events")}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
          >
            Back to Events
          </button>
        </div>
      </main>
    );
  }

  const registrationOpen =
    new Date(event.registrationDeadline) >= new Date();

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => router.push("/events")}
          className="mb-6 text-sm font-semibold text-blue-400 hover:text-blue-300"
        >
          ← Back to All Events
        </button>

        <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            {event.sport}
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            {event.name}
          </h1>

          <p className="mt-5 text-lg leading-8 text-gray-300">
            {event.description}
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-900 p-4">
              <p className="text-sm text-gray-400">Date</p>
              <p className="mt-1 font-semibold">{event.date}</p>
            </div>

            <div className="rounded-lg bg-gray-900 p-4">
              <p className="text-sm text-gray-400">Venue</p>
              <p className="mt-1 font-semibold">{event.venue}</p>
            </div>

            <div className="rounded-lg bg-gray-900 p-4">
              <p className="text-sm text-gray-400">
                Registration Type
              </p>
              <p className="mt-1 font-semibold capitalize">
                {event.registrationType}
              </p>
            </div>

            <div className="rounded-lg bg-gray-900 p-4">
              <p className="text-sm text-gray-400">
                Registration Deadline
              </p>
              <p className="mt-1 font-semibold">
                {event.registrationDeadline}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">Eligibility</h2>

            {event.eligibility.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-300">
                {event.eligibility.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-gray-400">
                No specific eligibility requirements listed.
              </p>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">Rules</h2>

            {event.rules.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-300">
                {event.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-gray-400">
                No specific rules listed.
              </p>
            )}
          </div>

          <div className="mt-8 border-t border-gray-800 pt-6">
            {registrationOpen ? (
              <button
                type="button"
                onClick={() =>
                  router.push(`/events/${event.id}/register`)
                }
                className="w-full rounded-lg bg-green-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-green-500"
              >
                Register for This Event
              </button>
            ) : (
              <div className="rounded-lg bg-red-950 p-4 text-center font-semibold text-red-300">
                Registration is closed for this event.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}