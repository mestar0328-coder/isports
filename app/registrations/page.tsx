"use client";

import { useEffect, useMemo, useState } from "react";

import { getRegistrations } from "@/data/registrationStorage";
import type { Registration } from "@/data/registrations";

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setRegistrations(getRegistrations());
  }, []);

  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return registrations.filter((registration) => {
      const searchableText = [
        registration.eventName,
        registration.applicantName,
        registration.college,
        registration.registrationType,
        registration.status,
        registration.teamName || "",
        ...(registration.teamMembers || []),
      ].join(" ").toLowerCase();

      if (query && !searchableText.includes(query)) return false;
      if (statusFilter !== "All" && registration.status !== statusFilter) {
        return false;
      }
      if (
        typeFilter !== "All" &&
        registration.registrationType !== typeFilter
      ) {
        return false;
      }

      const registeredDate = new Date(registration.registeredAt);
      if (!Number.isNaN(registeredDate.getTime())) {
        const dateOnly = [
          registeredDate.getFullYear(),
          String(registeredDate.getMonth() + 1).padStart(2, "0"),
          String(registeredDate.getDate()).padStart(2, "0"),
        ].join("-");

        if (dateFrom && dateOnly < dateFrom) return false;
        if (dateTo && dateOnly > dateTo) return false;
      }

      return true;
    });
  }, [registrations, search, statusFilter, typeFilter, dateFrom, dateTo]);

  function getStatusStyle(status: Registration["status"]) {
    if (status === "Approved") {
      return {
        badge: "border-green-500/40 bg-green-500/15 text-green-300",
        card: "border-green-500/30",
        label: "Approved",
      };
    }

    if (status === "Rejected") {
      return {
        badge: "border-red-500/40 bg-red-500/15 text-red-300",
        card: "border-red-500/30",
        label: "Rejected",
      };
    }

    return {
      badge: "border-amber-500/40 bg-amber-500/15 text-amber-300",
      card: "border-amber-500/30",
      label: "Pending",
    };
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
          iSports
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          My Registrations
        </h1>

        <p className="mt-3 text-gray-400">
          View the events you have registered for.
        </p>

        {registrations.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-400">
            No registrations found.
          </div>
        ) : (
          <>
            <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg shadow-black/20">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Filter Registrations</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Search and filter your event applications.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-blue-400 hover:bg-slate-800"
                >
                  Clear Filters
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm font-medium text-slate-300">
                  Search
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Event, applicant, college, team..."
                    className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>

                <label className="text-sm font-medium text-slate-300">
                  Registration Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-400"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-300">
                  Registration Type
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-400"
                  >
                    <option value="All">All Types</option>
                    <option value="Individual">Individual</option>
                    <option value="Team">Team</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-300">
                  Registered From
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-400"
                  />
                </label>

                <label className="text-sm font-medium text-slate-300">
                  Registered To
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-400"
                  />
                </label>
              </div>

              <p className="mt-4 text-sm text-slate-400" aria-live="polite">
                Showing <span className="font-semibold text-blue-300">{filteredRegistrations.length}</span> of {registrations.length} registrations
              </p>
            </section>

            {filteredRegistrations.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-8 text-center">
                <h2 className="text-xl font-bold text-white">No Matching Registrations</h2>
                <p className="mt-2 text-slate-400">
                  Try changing your search or filters.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredRegistrations.map((registration) => {
                  const statusStyle = getStatusStyle(registration.status);

                  return (
                    <article
                      key={registration.id}
                      className={`rounded-xl border bg-slate-900 p-5 shadow-lg shadow-black/10 transition hover:bg-slate-900/80 ${statusStyle.card}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white">
                            {registration.eventName}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            Registration ID: {registration.id}
                          </p>
                        </div>
                        <span
                          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${statusStyle.badge}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <p className="text-slate-400">
                          <strong className="text-slate-200">Name:</strong>{" "}
                          {registration.applicantName}
                        </p>
                        <p className="text-slate-400">
                          <strong className="text-slate-200">College:</strong>{" "}
                          {registration.college}
                        </p>
                        <p className="text-slate-400">
                          <strong className="text-slate-200">Type:</strong>{" "}
                          {registration.registrationType}
                        </p>
                        <p className="text-slate-400">
                          <strong className="text-slate-200">Registered on:</strong>{" "}
                          {registration.registeredAt}
                        </p>
                        {registration.teamName && (
                          <p className="text-slate-400">
                            <strong className="text-slate-200">Team:</strong>{" "}
                            {registration.teamName}
                          </p>
                        )}
                        {registration.teamMembers?.length ? (
                          <p className="text-slate-400 sm:col-span-2">
                            <strong className="text-slate-200">Team Members:</strong>{" "}
                            {registration.teamMembers.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
