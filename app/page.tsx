"use client";

import Link from "next/link";
import SportCard from "@/components/SportCard";
import { getCustomSports } from "@/data/sportsStorage";

export default function Home() {
  const sports = getCustomSports();

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Hero */}
      <section className="px-4 py-20 sm:px-8 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 sm:text-base">
            iSports
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your World of Sports
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-8">
            Join sports events, register as a player and compete.
          </p>

          <Link
            href="/events"
            className="mt-8 inline-block rounded-lg bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:bg-gray-200 sm:text-base"
          >
            Explore Events
          </Link>

        </div>
      </section>

      {/* Sports */}
      <section className="border-t border-gray-800 px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">

          <div className="mb-8 sm:mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Sports
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Available Sports
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Sports created by the iSports admin.
            </p>
          </div>

          {sports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 p-10 text-center">

              <div className="text-4xl">🏟️</div>

              <h3 className="mt-4 font-bold">
                No sports available yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Sports will appear here when an admin creates them.
              </p>

            </div>
          ) : (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-3">

              {sports.map((sport) => (
                <SportCard
                  key={sport.id}
                  name={sport.name}
                  icon={sport.icon}
                  description={`${sport.name} events and players.`}
                  href={`/sports/${sport.id}`}
                />
              ))}

            </div>
          )}

        </div>
      </section>

    </main>
  );
}