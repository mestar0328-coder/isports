"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { SportEvent } from "@/types/events";
import { getEventById, updateEvent } from "@/data/eventsStorage";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [event, setEvent] = useState<SportEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existingEvent = getEventById(id);
    setEvent(existingEvent);
    setLoading(false);
  }, [id]);

  function handleChange(
    field: keyof SportEvent,
    value: string
  ) {
    if (!event) return;

    setEvent({
      ...event,
      [field]: value,
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!event) return;

    updateEvent(event);
    router.push("/admin/events");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Loading event...
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <h1 className="text-2xl font-bold">Event Not Found</h1>

        <button
          type="button"
          onClick={() => router.push("/admin/events")}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold"
        >
          Back to Events
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">
          Edit Event
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-gray-800 bg-gray-950 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Event Name
            </label>

            <input
              required
              value={event.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Sport
            </label>

            <input
              required
              value={event.sport}
              onChange={(e) => handleChange("sport", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Description
            </label>

            <textarea
              required
              value={event.description}
              onChange={(e) =>
                handleChange("description", e.target.value)
              }
              className="min-h-32 w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Date
            </label>

            <input
              required
              type="date"
              value={event.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Venue
            </label>

            <input
              required
              value={event.venue}
              onChange={(e) => handleChange("venue", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Registration Deadline
            </label>

            <input
              required
              type="date"
              value={event.registrationDeadline}
              onChange={(e) =>
                handleChange("registrationDeadline", e.target.value)
              }
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-3 font-bold hover:bg-blue-500"
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/events")}
              className="rounded-lg border border-gray-700 px-5 py-3 font-semibold hover:bg-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}