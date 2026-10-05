"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { SportEvent } from "@/types/events";
import { getEvents, updateEvent } from "@/data/eventsStorage";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();

  const [event, setEvent] = useState<SportEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paramValues = Object.values(params ?? {});

const eventId = String(paramValues[0] ?? "").trim();

    console.log("Edit page ID:", eventId);

    if (!eventId) {
      setLoading(false);
      return;
    }

    const allEvents = getEvents();

    console.log("All stored events:", allEvents);
    console.log(
      "All stored IDs:",
      allEvents.map((item) => item.id)
    );

    const foundEvent = allEvents.find(
      (item) => String(item.id).trim() === eventId
    );

    console.log("Found event:", foundEvent);

    setEvent(foundEvent ?? null);
    setLoading(false);
  }, [params]);

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

  function handleSubmit(
    formEvent: React.FormEvent<HTMLFormElement>
  ) {
    formEvent.preventDefault();

    if (!event) return;

    updateEvent(event);

    alert("Event updated successfully!");

    router.push("/admin/events");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 p-10 text-white">
        Loading event...
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-gray-950 p-10 text-white">
        <h1 className="text-2xl font-bold">
          Event not found
        </h1>

        <button
          type="button"
          onClick={() => router.push("/admin/events")}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
        >
          Back to Events
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold">
          Edit Event
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-gray-800 bg-gray-900 p-6"
        >
          <div>
            <label className="mb-2 block font-semibold">
              Event Name
            </label>

            <input
              required
              value={event.name}
              onChange={(e) =>
                handleChange("name", e.target.value)
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Sport
            </label>

            <input
              required
              value={event.sport}
              onChange={(e) =>
                handleChange("sport", e.target.value)
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Description
            </label>

            <textarea
              required
              value={event.description}
              onChange={(e) =>
                handleChange("description", e.target.value)
              }
              rows={4}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Date
            </label>

            <input
              required
              type="date"
              value={event.date}
              onChange={(e) =>
                handleChange("date", e.target.value)
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Venue
            </label>

            <input
              required
              value={event.venue}
              onChange={(e) =>
                handleChange("venue", e.target.value)
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Registration Deadline
            </label>

            <input
              required
              type="date"
              value={event.registrationDeadline}
              onChange={(e) =>
                handleChange(
                  "registrationDeadline",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-500"
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/events")}
              className="rounded-lg border border-gray-700 px-6 py-3 font-semibold hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}