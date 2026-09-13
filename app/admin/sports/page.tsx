"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Sport } from "@/types/sports";
import {
  addCustomSport,
  getAllSports,
} from "@/data/sportsStorage";

export default function AdminSportsPage() {
  const router = useRouter();

  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAllSports(getAllSports());
  }, []);

  const handleAddSport = () => {
    const trimmedName = name.trim();
    const trimmedIcon = icon.trim();

    if (!trimmedName) {
      setMessage("Please enter a sport name.");
      return;
    }

    if (!trimmedIcon) {
      setMessage("Please enter a sport icon.");
      return;
    }

    const id = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!id) {
      setMessage("Invalid sport name.");
      return;
    }

    const alreadyExists = allSports.some(
      (sport) => sport.id === id
    );

    if (alreadyExists) {
      setMessage("This sport already exists.");
      return;
    }

    const newSport: Sport = {
      id,
      name: trimmedName,
      icon: trimmedIcon,
    };

    addCustomSport(newSport);

    setAllSports((current) => [
      ...current,
      newSport,
    ]);

    setName("");
    setIcon("");

    setMessage(
      `✓ ${trimmedName} added successfully.`
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <header className="rounded-xl border border-gray-800 bg-gray-900 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            iSports Admin
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Sports Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            Create sports that can be used when publishing
            sports events.
          </p>
        </header>

        {/* ADD SPORT */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6 sm:p-8">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Create Sport
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Add New Sport
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_160px_auto]">

            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setMessage("");
              }}
              placeholder="Sport name"
              className="rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-gray-500"
            />

            <input
              value={icon}
              onChange={(e) => {
                setIcon(e.target.value);
                setMessage("");
              }}
              placeholder="Icon 🏐"
              className="rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-gray-500"
            />

            <button
              type="button"
              onClick={handleAddSport}
              className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-gray-200"
            >
              + Add Sport
            </button>

          </div>

          {message && (
            <p className="mt-4 text-sm font-semibold text-gray-300">
              {message}
            </p>
          )}

        </section>

        {/* SPORTS LIST */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6 sm:p-8">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                Available Sports
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {allSports.length}{" "}
                {allSports.length === 1
                  ? "Sport"
                  : "Sports"}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-gray-950"
            >
              Back Home
            </button>

          </div>

          {allSports.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-700 p-10 text-center">
              <div className="text-4xl">🏟️</div>

              <p className="mt-4 font-bold">
                No sports created yet
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Add your first sport using the form above.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {allSports.map((sport) => (
                <div
                  key={sport.id}
                  className="rounded-xl border border-gray-800 bg-gray-950 p-5"
                >
                  <div className="flex items-center gap-4">

                    <span className="text-3xl">
                      {sport.icon}
                    </span>

                    <div>
                      <h3 className="font-bold text-white">
                        {sport.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        ID: {sport.id}
                      </p>
                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}