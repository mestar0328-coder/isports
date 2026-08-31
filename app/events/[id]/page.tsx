"use client";
import Link from "next/link";
import { events } from "../../../data/events";
import { students } from "../../../data/students";

type EventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventDetailsPage({
  params,
}: EventPageProps) {
  const { id } = await params;

  const event = events.find((event) => event.id === id);

  const student = students[0];

  if (!event) {
    return (
      <main className="min-h-screen bg-gray-950 p-8 text-white">
        <h1 className="text-3xl font-bold">
          Event Not Found
        </h1>

        <p className="mt-4 text-gray-400">
          The event you are looking for does not exist.
        </p>
      </main>
    );
  }

  const isEligible =
    student.course === "Diploma" &&
    student.age >= 17 &&
    student.age <= 21;

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">

      {/* Event Header */}
      <section>
        <p className="text-sm font-semibold text-blue-400">
          {event.sport}
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          {event.name}
        </h1>

        <p className="mt-4 text-gray-400">
          {event.description}
        </p>
      </section>

      {/* Event Details */}
      <section className="mt-10 rounded-xl border border-gray-800 p-6">
        <h2 className="text-2xl font-bold">
          Event Details
        </h2>

        <div className="mt-6 space-y-4">
          <p>📅 <strong>Date:</strong> {event.date}</p>

          <p>📍 <strong>Venue:</strong> {event.venue}</p>

          <p>
            ⏰ <strong>Registration Deadline:</strong>{" "}
            {event.registrationDeadline}
          </p>

          <p>
            👥 <strong>Registration Type:</strong>{" "}
            {event.registrationType === "team"
              ? `Team (${event.teamSize} players)`
              : "Individual"}
          </p>
        </div>
      </section>

      {/* Eligibility */}
      <section className="mt-8 rounded-xl border border-gray-800 p-6">
        <h2 className="text-2xl font-bold">
          Eligibility Criteria
        </h2>

        <ul className="mt-5 list-disc space-y-2 pl-6 text-gray-300">
          {event.eligibility.map((criteria, index) => (
            <li key={index}>
              {criteria}
            </li>
          ))}
        </ul>
      </section>

      {/* Eligibility Result */}
      <section className="mt-8 rounded-xl border border-gray-800 p-6">
        <h2 className="text-2xl font-bold">
          Your Eligibility
        </h2>

        {isEligible ? (
          <div className="mt-4">
            <p className="font-semibold text-green-400">
              ✓ You are eligible to register.
            </p>

            <Link
  href={`/events/${event.id}/register`}
  className="mt-6 block w-full rounded-lg bg-white px-6 py-4 text-center text-lg font-bold text-black transition hover:bg-gray-200"
>
  Register for this Event
</Link>
                   </div>
        ) : (
          <p className="mt-4 font-semibold text-red-400">
            ✕ You are not eligible for this event.
          </p>
        )}
      </section>

      {/* Rules */}
      <section className="mt-8 rounded-xl border border-gray-800 p-6">
        <h2 className="text-2xl font-bold">
          Rules
        </h2>

        <ul className="mt-5 list-disc space-y-2 pl-6 text-gray-300">
          {event.rules.map((rule, index) => (
            <li key={index}>
              {rule}
            </li>
          ))}
        </ul>
      </section>

    </main>
  );
}