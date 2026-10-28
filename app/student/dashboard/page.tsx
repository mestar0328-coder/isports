"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("isports_user");

    if (!savedUser) {
      router.replace("/student/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (user.role !== "student") {
        localStorage.removeItem("isports_user");
        router.replace("/student/login");
        return;
      }

      setAuthorized(true);
    } catch {
      localStorage.removeItem("isports_user");
      router.replace("/student/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("isports_user");
    router.push("/");
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400">Checking access...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              iSports
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Student Dashboard
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-red-500 hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-400">
            Welcome
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Welcome to your dashboard 🎓
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-gray-400">
            From here, you can explore sports events, register for competitions
            and view your registration status.
          </p>
        </div>

        {/* Dashboard Actions */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Link
            href="/events"
            className="rounded-2xl border border-gray-800 bg-gray-900 p-6 transition hover:-translate-y-1 hover:border-blue-500 hover:bg-gray-800"
          >
            <div className="text-4xl">🏟️</div>

            <h3 className="mt-4 text-xl font-bold">
              Explore Events
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              View available sports events and register to participate.
            </p>

            <span className="mt-5 inline-block text-sm font-bold text-blue-400">
              View Events →
            </span>
          </Link>

          <Link
            href="/registrations"
            className="rounded-2xl border border-gray-800 bg-gray-900 p-6 transition hover:-translate-y-1 hover:border-purple-500 hover:bg-gray-800"
          >
            <div className="text-4xl">📋</div>

            <h3 className="mt-4 text-xl font-bold">
              My Registrations
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Check your submitted registrations and approval status.
            </p>

            <span className="mt-5 inline-block text-sm font-bold text-purple-400">
              View Registrations →
            </span>
          </Link>

          <Link
            href="/scoring/results"
            className="rounded-2xl border border-gray-800 bg-gray-900 p-6 transition hover:-translate-y-1 hover:border-green-500 hover:bg-gray-800"
          >
            <div className="text-4xl">🏆</div>

            <h3 className="mt-4 text-xl font-bold">
              Results
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              View published match scores and competition results.
            </p>

            <span className="mt-5 inline-block text-sm font-bold text-green-400">
              View Results →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}