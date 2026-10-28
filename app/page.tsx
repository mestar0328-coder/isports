"use client";

import Link from "next/link";
import SportCard from "@/components/SportCard";
import { getCustomSports } from "@/data/sportsStorage";

export default function Home() {
const sports = getCustomSports();

return (
<main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
{/* Hero Section */}
<section className="relative isolate overflow-hidden bg-white">
{/* Background decoration */}
<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
<div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-blue-100/80 blur-3xl" />
<div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-sky-100/70 blur-3xl" />
<div className="absolute inset-0 bg-gradient-to-br from-white via-white/90 to-blue-50/70" />
</div>

    <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:py-32">
      {/* Hero Text */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Your Campus. Your Competition. Your Victory.
        </div>

        <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
          Compete
          <span className="block text-blue-600">Beyond Limits.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
          Discover sports events, register for competitions, follow match
          results, and celebrate every victory — all in one place with
          iSports.
        </p>

        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-1 hover:bg-blue-700"
          >
            Explore Events
            <span aria-hidden="true">→</span>
          </Link>

          <Link
            href="/student/login"
            className="rounded-xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            Student Login
          </Link>
        </div>

        {/* Highlights */}
        <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-7">
          <div>
            <p className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Events
            </p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Discover sports
            </p>
          </div>

          <div className="border-l border-slate-200 pl-4">
            <p className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Results
            </p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Follow matches
            </p>
          </div>

          <div className="border-l border-slate-200 pl-4">
            <p className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              iSports
            </p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Play to achieve
            </p>
          </div>
        </div>
      </div>

      {/* Sports Visual Panel */}
      <div className="relative">
        <div className="absolute -inset-4 rounded-[2rem] bg-blue-200/50 blur-2xl" />

        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-900/10 sm:p-8">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                The Game Starts Here
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Find Your Sport
              </h2>
            </div>

            <span className="text-4xl" aria-hidden="true">
              🏟️
            </span>
          </div>

          <div className="relative mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50">
              <div className="text-4xl" aria-hidden="true">
                🏀
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                Basketball
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Team up and compete
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50">
              <div className="text-4xl" aria-hidden="true">
                ⚽
              </div>
              <h3 className="mt-4 font-bold text-slate-900">Football</h3>
              <p className="mt-1 text-sm text-slate-500">
                Chase the victory
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50">
              <div className="text-4xl" aria-hidden="true">
                🏐
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                Volleyball
              </h3>
              <p className="mt-1 text-sm text-slate-500">Play as one</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50">
              <div className="text-4xl" aria-hidden="true">
                🏸
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                Badminton
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Bring your best
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <span className="text-2xl" aria-hidden="true">
              🏆
            </span>
            <div>
              <p className="text-sm font-bold text-green-800">
                Every Game Matters
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Participate, compete, and track your progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Login Portals */}
  <section className="border-t border-slate-200 bg-slate-50 px-5 py-20 sm:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
          Access iSports
        </p>

        <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Your Portal, Your Purpose
        </h2>

        <p className="mt-4 leading-7 text-slate-600">
          Choose your role to access the tools and features designed for
          you.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Student */}
        <Link
          href="/student/login"
          className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/70"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl ring-1 ring-blue-100">
            🎓
          </div>

          <h3 className="mt-6 text-xl font-extrabold text-slate-900">
            Student Portal
          </h3>

          <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">
            Discover events, register for competitions, track applications,
            and check results.
          </p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-blue-700">
              Student Login
            </span>
            <span className="text-xl text-blue-600 transition group-hover:translate-x-1">
              →
            </span>
          </div>
        </Link>

        {/* Admin */}
        <Link
          href="/admin/login"
          className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/70"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-3xl ring-1 ring-purple-100">
            🛡️
          </div>

          <h3 className="mt-6 text-xl font-extrabold text-slate-900">
            Admin Portal
          </h3>

          <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">
            Manage sports events, registrations, match operations, and
            administrative tools.
          </p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-purple-700">
              Admin Login
            </span>
            <span className="text-xl text-purple-600 transition group-hover:translate-x-1">
              →
            </span>
          </div>
        </Link>

        {/* In-Charge */}
        <Link
          href="/incharge/login"
          className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-green-300 hover:shadow-xl hover:shadow-green-100/70"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-3xl ring-1 ring-green-100">
            🏆
          </div>

          <h3 className="mt-6 text-xl font-extrabold text-slate-900">
            Match In-Charge
          </h3>

          <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">
            Access assigned events, manage matches, and enter competition
            scores.
          </p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-green-700">
              In-Charge Login
            </span>
            <span className="text-xl text-green-600 transition group-hover:translate-x-1">
              →
            </span>
          </div>
        </Link>
      </div>
    </div>
  </section>

  {/* Available Sports */}
  <section className="bg-white px-5 py-20 sm:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            Explore
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Available Sports
          </h2>

          <p className="mt-3 max-w-xl leading-7 text-slate-600">
            Explore the sports created by the iSports administrator and
            find your next competition.
          </p>
        </div>

        <Link
          href="/events"
          className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
        >
          Browse Events →
        </Link>
      </div>

      {sports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <div className="text-5xl" aria-hidden="true">
            🏟️
          </div>

          <h3 className="mt-5 text-xl font-bold text-slate-900">
            Your Next Sport Starts Here
          </h3>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            No sports have been added yet. Once an administrator creates
            sports, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport) => (
            <SportCard
              key={sport.id}
              name={sport.name}
              icon={typeof sport.icon === "string" ? sport.icon : "🏅"}
              description={`${sport.name} events and players.`}
              href={`/sports/${sport.id}`}
            />
          ))}
        </div>
      )}
    </div>
  </section>

  {/* Homepage Footer */}
  <footer className="border-t border-slate-200 bg-slate-50 px-5 py-8 sm:px-8">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
      <div>
        <p className="text-lg font-extrabold text-slate-900">
          <span className="text-blue-600">i</span>Sports
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Organize. Compete. Achieve.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-5 text-sm font-medium text-slate-600">
        <Link
          href="/events"
          className="transition hover:text-blue-700"
        >
          Events
        </Link>
        <Link
          href="/results"
          className="transition hover:text-blue-700"
        >
          Results
        </Link>
        <Link
          href="/student/login"
          className="transition hover:text-blue-700"
        >
          Student Login
        </Link>
      </div>

      <p className="text-xs text-slate-500">
        © {new Date().getFullYear()} iSports. All rights reserved.
      </p>
    </div>
  </footer>
</main>

);
}