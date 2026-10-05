"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SportEvent } from "@/types/events";
import {
  deleteEvent,
  getEvents,
} from "@/data/eventsStorage";

export default function AdminEventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState<SportEvent[]>([]);

  useEffect(() => {
    setEvents(getEvents());
  }, []);

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmed) return;

    deleteEvent(id);
    setEvents(getEvents());
  };

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Admin
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Manage Events
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/events/new")}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Create Event
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-lg border border-gray-700 px-5 py-3 font-semibold text-gray-200 transition hover:bg-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center">
            <h2 className="text-xl font-semibold">
              No events found
            </h2>

            <p className="mt-2 text-gray-400">
              Create your first sports event to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col justify-between gap-5 rounded-xl border border-gray-800 bg-gray-900 p-6 md:flex-row md:items-center"
              >
                <div>
                  <h2 className="text-2xl font-bold">
                    {event.name}
                  </h2>

                  <p className="mt-1 font-semibold capitalize text-blue-400">
                    {event.sport}
                  </p>

                  <p className="mt-2 text-sm text-gray-400">
                    {event.date} • {event.venue}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Registration: {event.registrationType}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
  console.log("Editing event ID:", event.id);
  router.push(`/admin/events/edit/${event.id}`);
}}
                    className="rounded-lg border border-blue-500 px-4 py-2 font-semibold text-blue-400 transition hover:bg-blue-500 hover:text-white"
                  >
                    Edit Event
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(event.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500"
                  >
                    Delete Event
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}