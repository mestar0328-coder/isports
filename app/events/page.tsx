"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getEvents } from "@/data/eventsStorage";
import type { SportEvent } from "@/types/events";

function isRegistrationOpen(deadline: string) {
  const deadlineDate = new Date(deadline);
  return !Number.isNaN(deadlineDate.getTime()) && deadlineDate >= new Date();
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function EventsPage() {
const router = useRouter();

const [events, setEvents] = useState<SportEvent[]>([]);
const [isLoaded, setIsLoaded] = useState(false);
const [isStudent, setIsStudent] = useState(false);
const [showLoginPrompt, setShowLoginPrompt] = useState(false);
const [search, setSearch] = useState("");
const [selectedSport, setSelectedSport] = useState("All");
const [studentAge, setStudentAge] = useState("");
const [datePreset, setDatePreset] = useState("all");
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
const [registrationFilter, setRegistrationFilter] = useState("all");

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

const goToStudentLogin = () => {
router.push("/student/login");
};

const sportOptions = useMemo(
  () => Array.from(new Set(events.map((event) => event.sport).filter(Boolean))).sort(),
  [events]
);

const filteredEvents = useMemo(() => {
  const query = search.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = getLocalDateString(today);

  let from = dateFrom;
  let to = dateTo;

  if (datePreset === "today") {
    from = todayString;
    to = todayString;
  } else if (datePreset === "recent") {
    const recentStart = new Date(today);
    recentStart.setDate(recentStart.getDate() - 30);
    from = getLocalDateString(recentStart);
    to = todayString;
  } else if (datePreset === "7days") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    from = getLocalDateString(start);
    to = todayString;
  } else if (datePreset === "30days") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    from = getLocalDateString(start);
    to = todayString;
  } else if (datePreset === "upcoming") {
    from = todayString;
    to = "";
  } else if (datePreset === "past") {
    from = "";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    to = getLocalDateString(yesterday);
  }

  const age = studentAge.trim() ? Number(studentAge) : null;

  return events.filter((event) => {
    const searchableText = [
      event.name,
      event.sport,
      event.description,
      event.venue,
      event.ageGroup || "",
      event.category || "",
      event.genderCategory || "",
    ].join(" ").toLowerCase();

    if (query && !searchableText.includes(query)) return false;
    if (selectedSport !== "All" && event.sport !== selectedSport) return false;

    if (age !== null && Number.isFinite(age)) {
      if (event.minAge !== undefined && age < event.minAge) return false;
      if (event.maxAge !== undefined && age > event.maxAge) return false;
    }

    const eventDate = event.date?.slice(0, 10) || "";
    if (from && (!eventDate || eventDate < from)) return false;
    if (to && (!eventDate || eventDate > to)) return false;

    const registrationOpen = isRegistrationOpen(event.registrationDeadline);
    if (registrationFilter === "open" && !registrationOpen) return false;
    if (registrationFilter === "closed" && registrationOpen) return false;

    return true;
  });
}, [
  events,
  search,
  selectedSport,
  studentAge,
  datePreset,
  dateFrom,
  dateTo,
  registrationFilter,
]);

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
â† Back to Home
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

    {isLoaded && events.length > 0 && (
      <section className="mb-8 rounded-2xl border border-slate-700 bg-[#0b1f38] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Find Sports Events</h2>
            <p className="mt-1 text-sm text-slate-400">
              Filter events by age eligibility, sport, date and registration status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedSport("All");
              setStudentAge("");
              setDatePreset("all");
              setDateFrom("");
              setDateTo("");
              setRegistrationFilter("all");
            }}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium text-slate-300">
            Search event
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Event name, venue, sport..."
              className="mt-2 w-full rounded-lg border border-slate-600 bg-[#071a30] px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
            />
          </label>

          <label className="text-sm font-medium text-slate-300">
            Sport
            <select
              value={selectedSport}
              onChange={(event) => setSelectedSport(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-[#071a30] px-3 py-2.5 text-white focus:border-blue-400"
            >
              <option value="All">All Sports</option>
              {sportOptions.map((sport) => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-300">
            Your age (years)
            <input
              type="number"
              min="1"
              max="120"
              value={studentAge}
              onChange={(event) => setStudentAge(event.target.value)}
              placeholder="Enter age to check eligibility"
              className="mt-2 w-full rounded-lg border border-slate-600 bg-[#071a30] px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
            />
          </label>

          <label className="text-sm font-medium text-slate-300">
            Event date
            <select
              value={datePreset}
              onChange={(event) => setDatePreset(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-[#071a30] px-3 py-2.5 text-white focus:border-blue-400"
            >
              <option value="all">All dates</option>
              <option value="recent">Recent (last 30 days)</option>
              <option value="today">Today</option>
              <option value="7days">Past 7 days</option>
              <option value="30days">Past 30 days</option>
              <option value="upcoming">Upcoming events</option>
              <option value="past">Past events</option>
              <option value="custom">Specific date range</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-300">
            Registration
            <select
              value={registrationFilter}
              onChange={(event) => setRegistrationFilter(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-[#071a30] px-3 py-2.5 text-white focus:border-blue-400"
            >
              <option value="all">All registration statuses</option>
              <option value="open">Registration open</option>
              <option value="closed">Registration closed</option>
            </select>
          </label>

          {datePreset === "custom" && (
            <>
              <label className="text-sm font-medium text-slate-300">
                From date
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-600 bg-[#071a30] px-3 py-2.5 text-white"
                />
              </label>
              <label className="text-sm font-medium text-slate-300">
                To date
                <input
                  type="date"
                  min={dateFrom || undefined}
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-600 bg-[#071a30] px-3 py-2.5 text-white"
                />
              </label>
            </>
          )}
        </div>

        <p className="mt-4 text-sm text-slate-400" aria-live="polite">
          Showing <span className="font-semibold text-blue-300">{filteredEvents.length}</span> of {events.length} events
        </p>
      </section>
    )}

    {!isLoaded ? (
      <div className="rounded-2xl border border-slate-700 bg-[#0b1f38] p-10 text-center">
        <p className="text-slate-300">Loading sports events...</p>
      </div>
    ) : events.length === 0 ? (
      <div className="rounded-2xl border border-slate-700 bg-[#0b1f38] p-10 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
          ðŸ†
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
            {filteredEvents.length} {filteredEvents.length === 1 ? "Event" : "Events"}
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-[#0b1f38] p-10 text-center">
            <h2 className="text-2xl font-bold text-white">No Matching Events</h2>
            <p className="mt-3 text-slate-400">
              No events match the selected age, sport, date or registration filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedSport("All");
                setStudentAge("");
                setDatePreset("all");
                setDateFrom("");
                setDateTo("");
                setRegistrationFilter("all");
              }}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500"
            >
              Clear Filters
            </button>
          </div>
        ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
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
                          Register Now â†’
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
        )}
      </>
    )}

    <footer className="mt-14 border-t border-slate-700 pt-6 text-center text-sm text-slate-400">
      <p>iSports â€” Sports Management System</p>
      <p className="mt-2">
        Explore events freely. Log in with your student account to
        register.
      </p>
    </footer>
  </div>
</main>

);
}
