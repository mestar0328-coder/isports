"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { addEvent } from "@/data/eventsStorage";
import type { SportEvent } from "@/types/events";

export default function NewAdminEventPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [registrationDeadline, setRegistrationDeadline] =
    useState("");
  const [registrationType, setRegistrationType] = useState<
    "team" | "individual"
  >("individual");
  const [teamSize, setTeamSize] = useState("");
  const [rules, setRules] = useState("");
  const [eligibility, setEligibility] = useState("");

  const submitEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !sport.trim() ||
      !description.trim() ||
      !date ||
      !venue.trim() ||
      !registrationDeadline
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (
      registrationType === "team" &&
      (!teamSize || Number(teamSize) < 2)
    ) {
      alert("Please enter a valid team size.");
      return;
    }

    const newEvent: SportEvent = {
      id: `event-${Date.now()}`,
      name: name.trim(),
      sport: sport.trim(),
      description: description.trim(),
      date,
      venue: venue.trim(),

      rules: rules
        .split("\n")
        .map((rule) => rule.trim())
        .filter(Boolean),

      eligibility: eligibility
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),

      minAge: minAge ? Number(minAge) : undefined,
      maxAge: maxAge ? Number(maxAge) : undefined,

      registrationDeadline,

      registrationType,

      teamSize:
        registrationType === "team"
          ? Number(teamSize)
          : undefined,
    };

    addEvent(newEvent);

    alert("Event published successfully!");

    router.push("/events");
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
          iSports Admin
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Publish New Sports Event
        </h1>

        <p className="mt-3 text-gray-400">
          Add a new sports event for students to view and register.
        </p>

        <form
          onSubmit={submitEvent}
          className="mt-8 space-y-6 rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-8"
        >
          <div>
            <label className="block text-sm font-semibold">
              Event Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Inter College Football Tournament"
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">
              Sport *
            </label>
            <input
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              placeholder="Football"
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the event..."
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold">
                Event Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold">
                Registration Deadline *
              </label>
              <input
                type="date"
                value={registrationDeadline}
                onChange={(e) =>
                  setRegistrationDeadline(e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold">
              Venue *
            </label>
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="College Stadium"
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold">
                Minimum Age
              </label>
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                placeholder="17"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold">
                Maximum Age
              </label>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                placeholder="21"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold">
              Registration Type
            </label>

            <select
              value={registrationType}
              onChange={(e) =>
                setRegistrationType(
                  e.target.value as "team" | "individual"
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
            >
              <option value="individual">Individual</option>
              <option value="team">Team</option>
            </select>
          </div>

          {registrationType === "team" && (
            <div>
              <label className="block text-sm font-semibold">
                Team Size *
              </label>
              <input
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="6"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold">
              Rules
            </label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder={"One rule per line"}
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">
              Eligibility Requirements
            </label>
            <textarea
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              placeholder={"One requirement per line"}
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-black hover:bg-gray-200"
            >
              Publish Event
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-lg border border-gray-700 px-6 py-3.5 text-sm font-semibold text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}