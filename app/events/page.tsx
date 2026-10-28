"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEvents } from "@/data/eventsStorage";
import type { SportEvent } from "@/types/events";

export default function EventsPage() {
const router = useRouter();

const [events, setEvents] = useState<SportEvent[]>([]);
const [isLoaded, setIsLoaded] = useState(false);
const [isStudent, setIsStudent] = useState(false);
const [showLoginPrompt, setShowLoginPrompt] = useState(false);

useEffect(() => {
const loadPage = () => {
const storedUser = localStorage.getItem("isports_user");

  try {
    const user = storedUser ? JSON.parse(storedUser) : null;
    setIsStudent(user?.role === "student");
  } catch {
    localStorage.removeItem("isports_user");
    setIsStudent(false);
  }

  setEvents(getEvents());
  setIsLoaded(true);
};

loadPage();

}, []);

const isRegistrationOpen = (deadline: string) => {
const deadlineDate = new Date(deadline);
return !Number.isNaN(deadlineDate.getTime()) &&
deadlineDate >= new Date();
};

const goToStudentLogin = () => {
router.push("/student/login");
};

const handleRegister = (eventId: string) => {
const storedUser = localStorage.getItem("isports_user");

try {
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (user?.role !== "student") {
    setIsStudent(false);
    setShowLoginPrompt(true);
    return;
  }

  router.push(`/events/${eventId}/register`);
} catch {
  localStorage.removeItem("isports_user");
  setIsStudent(false);
  setShowLoginPrompt(true);
}

};

return (
<main className="min-h-screen bg-[#081f3f] px-6 py-10 text-white">
<div className="mx-auto max-w-7xl">
<div className="mb-10">
<button
type="button"
onClick={() => router.push("/")}
className="mb-6 text-sm font-semibold text-blue-300 hover:text-blue-200"
>
← Back to Home
</button>

      <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400">
        iSports
      </p>

      <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
        Sports Events
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-300">
        Discover competitions, explore event details, and find your next
        sporting challenge.
      </p>
    </div>

    {showLoginPrompt && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        aria-describedby="login-prompt-description"
        className="mb-8 rounded-2xl border border-blue-400/30 bg-[#102744] p-6"
      >
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 id="login-prompt-title" className="text-xl font-bold">
              Student Login Required
            </h2>

            <p
              id="login-prompt-description"
              className="mt-2 max-w-2xl text-sm leading-6 text-slate-300"
            >
              You can explore sports events without logging in. Please
              log in to your student account to register for an event.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:min-w-48">
            <button
              type="button"
              onClick={goToStudentLogin}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500"
            >
              Login to Register
            </button>

            <button
              type="button"
              onClick={() => setShowLoginPrompt(false)}
              className="rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-700"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      </div>
    )}

    {!isLoaded ? (
      <div className="rounded-2xl border border-slate-700 bg-[#0b1f38] p-10 text-center">
        <p className="text-slate-300">Loading sports events...</p>
      </div>
    ) : events.length === 0 ? (
      <div className="rounded-2xl border border-slate-700 bg-[#0b1f38] p-10 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
          🏆
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">
          No Events Available
        </h2>

        <p className="mx-auto mt-3 max-w-md text-slate-400">
          New sports events will appear here when they are published.
          Please check back later.
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
        >
          Back to Home
        </button>
      </div>
    ) : (
      <>
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-300">
            Explore the available competitions.
          </p>

          <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
            {events.length} {events.length === 1 ? "Event" : "Events"}
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const registrationOpen = isRegistrationOpen(
              event.registrationDeadline
            );

            return (
              <article
                key={event.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1f38] shadow-lg transition duration-200 hover:-translate-y-1 hover:border-blue-500/70 hover:shadow-blue-950/40"
              >
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400" />

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">
                      {event.sport}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        registrationOpen
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {registrationOpen ? "Open" : "Closed"}
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-white">
                    {event.name}
                  </h2>

                  <p className="mt-3 line-clamp-3 leading-6 text-slate-400">
                    {event.description}
                  </p>

                  <div className="mt-6 space-y-4 rounded-xl border border-slate-700/80 bg-[#102744] p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Event Date
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {event.date}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Venue
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {event.venue}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Registration Deadline
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {event.registrationDeadline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 pt-6">
                    <button
                      type="button"
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="w-full rounded-xl border border-blue-500/70 px-4 py-3 font-semibold text-blue-300 hover:bg-blue-600 hover:text-white"
                    >
                      View Event Details
                    </button>

                    {isStudent &&
                      (registrationOpen ? (
                        <button
                          type="button"
                          onClick={() => handleRegister(event.id)}
                          className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white shadow-md shadow-green-950/30 hover:bg-green-500"
                        >
                          Register Now →
                        </button>
                      ) : (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm font-semibold text-red-300">
                          Registration Closed
                        </div>
                      ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </>
    )}

    <footer className="mt-14 border-t border-slate-700 pt-6 text-center text-sm text-slate-400">
      <p>iSports — Sports Management System</p>
      <p className="mt-2">
        Explore events freely. Log in with your student account to
        register.
      </p>
    </footer>
  </div>
</main>

);
}