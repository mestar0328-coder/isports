"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Registration } from "@/data/registrations";
import {
  getRegistrations,
  saveRegistrations,
} from "@/data/registrationStorage";

export default function AdminPage() {
  const router = useRouter();

  // Day 21 - Step 1: Admin Authorization
  const isAdminAuthorized = true;

  const [applications, setApplications] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [eventFilter, setEventFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewApplication, setViewApplication] =
    useState<Registration | null>(null);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "name"
  >("newest");

  useEffect(() => {
    const timer = setTimeout(() => {
      setApplications(getRegistrations());
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    let list = applications.filter((a) => {
      const s = search.toLowerCase();

      return (
        (a.applicantName.toLowerCase().includes(s) ||
          a.eventName.toLowerCase().includes(s) ||
          a.teamName?.toLowerCase().includes(s)) &&
        (statusFilter === "All" || a.status === statusFilter) &&
        (eventFilter === "All" || a.eventName === eventFilter)
      );
    });

    if (sortBy === "newest") {
      list = [...list].sort(
        (a, b) =>
          new Date(b.registeredAt).getTime() -
          new Date(a.registeredAt).getTime()
      );
    }

    if (sortBy === "oldest") {
      list = [...list].sort(
        (a, b) =>
          new Date(a.registeredAt).getTime() -
          new Date(b.registeredAt).getTime()
      );
    }

    if (sortBy === "name") {
      list = [...list].sort((a, b) =>
        a.applicantName.localeCompare(b.applicantName)
      );
    }

    return list;
  }, [
    applications,
    search,
    statusFilter,
    eventFilter,
    sortBy,
  ]);

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((a) => selectedIds.includes(a.id));

  const toggle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(
      allFilteredSelected
        ? (current) =>
            current.filter(
              (id) =>
                !filtered.some((a) => a.id === id)
            )
        : (current) => [
            ...current,
            ...filtered
              .map((a) => a.id)
              .filter(
                (id) => !current.includes(id)
              ),
          ]
    );
  };

  const save = (list: Registration[]) => {
    setApplications(list);
    saveRegistrations(list);
  };

  const del = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this registration? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    save(
      applications.filter(
        (a) => a.id !== id
      )
    );

    setSelectedIds((current) =>
      current.filter(
        (selectedId) => selectedId !== id
      )
    );

    setViewApplication(null);
  };

  const changeStatus = (
    id: string,
    status: Registration["status"]
  ) => {
    save(
      applications.map((a) =>
        a.id === id
          ? { ...a, status }
          : a
      )
    );

    setViewApplication(null);
  };

  const bulk = (
    status: Registration["status"]
  ) => {
    save(
      applications.map((a) =>
        selectedIds.includes(a.id)
          ? { ...a, status }
          : a
      )
    );

    setSelectedIds([]);
  };

  const bulkDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected registration${
        selectedIds.length === 1 ? "" : "s"
      }? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const updatedApplications =
      applications.filter(
        (application) =>
          !selectedIds.includes(
            application.id
          )
      );

    save(updatedApplications);
    setSelectedIds([]);
  };

  const pending = applications.filter(
    (a) => a.status === "Pending"
  ).length;

  const approved = applications.filter(
    (a) => a.status === "Approved"
  ).length;

  const rejected = applications.filter(
    (a) => a.status === "Rejected"
  ).length;

  const events = Array.from(
    new Set(
      applications.map(
        (a) => a.eventName
      )
    )
  );

  const exportCSV = () => {
    const rows = [
      [
        "ID",
        "Applicant",
        "Team",
        "Event",
        "Type",
        "Status",
        "College",
        "Date",
      ],
      ...filtered.map((a) => [
        a.id,
        a.applicantName,
        a.teamName || "",
        a.eventName,
        a.registrationType,
        a.status,
        a.college,
        a.registeredAt,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${value}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "registrations.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  if (!isAdminAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
        <div className="w-full max-w-md rounded-xl border border-red-900/50 bg-gray-900 p-6 text-center shadow-sm sm:p-8">
          <div className="text-4xl sm:text-5xl">
            🔒
          </div>

          <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-red-400">
            iSports Admin
          </p>

          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            Access Denied
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            You are not authorized to access the Admin Dashboard.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="mt-6 w-full rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-gray-200 sm:w-auto"
          >
            Return Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                iSports Admin
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
                Manage, review and export sports registrations.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-green-800 bg-green-950/30 px-3 py-1.5 text-xs font-semibold text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Admin Authorized
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex">
              <button
                type="button"
                onClick={exportCSV}
                className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-200"
              >
                ⬇ Export CSV
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/")
                }
                className="rounded-lg border border-gray-700 bg-gray-950 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-900"
              >
                Home
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/events")
                }
                className="rounded-lg border border-gray-700 bg-gray-950 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-900"
              >
                Events
              </button>
            </div>

          </div>
        </header>

        {/* STATS */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total",
              value: applications.length,
              color: "text-white",
              active:
                statusFilter === "All",
              filter: "All",
              sub: "All registrations",
              icon: "📊",
            },
            {
              label: "Pending",
              value: pending,
              color: "text-yellow-400",
              active:
                statusFilter === "Pending",
              filter: "Pending",
              sub: "Awaiting review",
              icon: "⏳",
            },
            {
              label: "Approved",
              value: approved,
              color: "text-green-400",
              active:
                statusFilter === "Approved",
              filter: "Approved",
              sub: "Approved",
              icon: "✅",
            },
            {
              label: "Rejected",
              value: rejected,
              color: "text-red-400",
              active:
                statusFilter === "Rejected",
              filter: "Rejected",
              sub: "Rejected",
              icon: "❌",
            },
          ].map((c) => (
            <button
              type="button"
              key={c.label}
              onClick={() => {
                setStatusFilter(
                  c.filter
                );
                setSelectedIds([]);
              }}
              className={`rounded-xl border p-5 text-left transition sm:p-6 ${
                c.active
                  ? "border-gray-500 bg-gray-800"
                  : "border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-400">
                  {c.label}
                </p>

                <span className="text-lg sm:text-xl">
                  {c.icon}
                </span>
              </div>

              <p
                className={`mt-3 text-3xl font-bold sm:text-4xl ${c.color}`}
              >
                {c.value}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {c.sub}
              </p>
            </button>
          ))}
        </section>

        {/* FILTERS */}

        <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:p-6">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Registrations
            </p>

            <h2 className="mt-1 text-lg font-bold sm:text-xl">
              Search & Filters
            </h2>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-12">

            <div className="relative lg:col-span-5">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                🔎
              </span>

              <input
                value={search}
                onChange={(e) => {
                  setSearch(
                    e.target.value
                  );
                  setSelectedIds([]);
                }}
                placeholder="Search student, team, event, college..."
                className="w-full rounded-lg border border-gray-700 bg-gray-950 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(
                  e.target.value
                );
                setSelectedIds([]);
              }}
              className="rounded-lg border border-gray-700 bg-gray-950 px-4 py-3.5 text-sm text-gray-200 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 lg:col-span-2"
            >
              <option value="All">
                All Status
              </option>

              <option>
                Pending
              </option>

              <option>
                Approved
              </option>

              <option>
                Rejected
              </option>
            </select>

            <select
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(
                  e.target.value
                );
                setSelectedIds([]);
              }}
              className="rounded-lg border border-gray-700 bg-gray-950 px-4 py-3.5 text-sm text-gray-200 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 lg:col-span-2"
            >
              <option value="All">
                All Events
              </option>

              {events.map(
                (event) => (
                  <option
                    key={event}
                    value={event}
                  >
                    {event}
                  </option>
                )
              )}
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "newest"
                    | "oldest"
                    | "name"
                )
              }
              className="rounded-lg border border-gray-700 bg-gray-950 px-4 py-3.5 text-sm text-gray-200 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 lg:col-span-2"
            >
              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="name">
                Name A-Z
              </option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter(
                  "All"
                );
                setEventFilter(
                  "All"
                );
                setSelectedIds([]);
              }}
              className="rounded-lg border border-gray-700 px-5 py-3.5 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-950 lg:col-span-1"
            >
              Reset
            </button>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-800 pt-4 text-sm text-gray-500">
            <span>
              Showing{" "}
              <span className="font-bold text-white">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-white">
                {applications.length}
              </span>
            </span>

            {selectedIds.length > 0 && (
              <span className="font-semibold text-gray-300">
                {selectedIds.length} selected
              </span>
            )}
          </div>

        </section>

        {/* BULK */}

        {selectedIds.length > 0 && (
          <section className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-bold">
                  {selectedIds.length}
                </span>

                <p className="text-sm font-bold sm:text-base">
                  {selectedIds.length === 1
                    ? "1 registration selected"
                    : `${selectedIds.length} registrations selected`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Approve ${selectedIds.length}?`
                      )
                    ) {
                      bulk("Approved");
                    }
                  }}
                  className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-bold transition hover:bg-green-600"
                >
                  Approve
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Reject ${selectedIds.length}?`
                      )
                    ) {
                      bulk("Rejected");
                    }
                  }}
                  className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-bold transition hover:bg-red-600"
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={bulkDelete}
                  className="rounded-lg border border-red-900 bg-red-950/30 px-5 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-900/40"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds([])
                  }
                  className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-gray-950"
                >
                  Clear
                </button>
              </div>

            </div>
          </section>
        )}

        {/* TABLE */}

        <section className="mt-6 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-sm">

          <div className="border-b border-gray-800 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold">
              Registration List
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Review and manage submitted registrations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-gray-950 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="p-4">
                    <input
                      type="checkbox"
                      checked={
                        allFilteredSelected
                      }
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-900"
                    />
                  </th>

                  <th className="p-4">
                    Applicant / Team
                  </th>

                  <th className="p-4">
                    Event
                  </th>

                  <th className="p-4">
                    Type
                  </th>

                  <th className="p-4">
                    Status
                  </th>

                  <th className="p-4">
                    Date
                  </th>

                  <th className="p-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.length ? (
                  filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-gray-800 transition hover:bg-gray-950/70"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(
                            a.id
                          )}
                          onChange={() =>
                            toggle(a.id)
                          }
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900"
                        />
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-white">
                          {a.registrationType ===
                          "Team"
                            ? a.teamName ||
                              "Unnamed Team"
                            : a.applicantName}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {a.registrationType ===
                          "Team"
                            ? `Captain: ${a.applicantName}`
                            : a.college}{" "}
                          •{" "}
                          {a.id.slice(0, 8)}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="inline-block rounded-full border border-gray-700 bg-gray-950 px-3 py-1 text-xs font-medium text-gray-300">
                          {a.eventName}
                        </span>
                      </td>

                      <td className="p-4 text-sm text-gray-400">
                        {a.registrationType}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                            a.status ===
                            "Pending"
                              ? "border-yellow-800 bg-yellow-950/40 text-yellow-300"
                              : a.status ===
                                "Approved"
                              ? "border-green-800 bg-green-950/40 text-green-300"
                              : "border-red-800 bg-red-950/40 text-red-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              a.status ===
                              "Pending"
                                ? "bg-yellow-400"
                                : a.status ===
                                  "Approved"
                                ? "bg-green-400"
                                : "bg-red-400"
                            }`}
                          />

                          {a.status}
                        </span>
                      </td>

                      <td className="p-4 text-sm text-gray-400">
                        {a.registeredAt}
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() =>
                            setViewApplication(
                              a
                            )
                          }
                          className="rounded-lg border border-gray-700 bg-gray-950 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-12 text-center sm:p-16"
                    >
                      <div className="mx-auto max-w-sm">
                        <div className="text-4xl sm:text-5xl">
                          📭
                        </div>

                        <p className="mt-4 text-lg font-bold text-white">
                          {statusFilter !==
                          "All"
                            ? `No ${statusFilter.toLowerCase()} registrations found`
                            : eventFilter !==
                              "All"
                            ? `No registrations found for ${eventFilter}`
                            : search
                            ? "No matching registrations found"
                            : "No registrations found"}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                          {statusFilter !==
                          "All"
                            ? `There are currently no ${statusFilter.toLowerCase()} registrations.`
                            : eventFilter !==
                              "All"
                            ? "Try selecting another event or clearing the event filter."
                            : search
                            ? "Try a different search term or clear the search."
                            : "There are no registrations available yet."}
                        </p>

                        {(search ||
                          statusFilter !==
                            "All" ||
                          eventFilter !==
                            "All") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch(
                                ""
                              );
                              setStatusFilter(
                                "All"
                              );
                              setEventFilter(
                                "All"
                              );
                              setSelectedIds(
                                []
                              );
                            }}
                            className="mt-5 rounded-lg border border-gray-700 bg-gray-950 px-5 py-2.5 text-sm font-bold text-gray-300 transition hover:border-gray-600 hover:bg-gray-900"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>

        {/* MODAL */}

        {viewApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">

              <div className="sticky top-0 flex items-center justify-between border-b border-gray-800 bg-gray-900 p-5 sm:p-6">
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Registration
                  </p>

                  <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                    Registration Details
                  </h2>

                  <p className="mt-1 truncate text-xs text-gray-500">
                    ID:{" "}
                    {viewApplication.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewApplication(
                      null
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 sm:p-6">

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [
                      "Applicant",
                      viewApplication.applicantName,
                    ],
                    [
                      "Event",
                      viewApplication.eventName,
                    ],
                    [
                      "Type",
                      viewApplication.registrationType,
                    ],
                    [
                      "College",
                      viewApplication.college,
                    ],
                    [
                      "Status",
                      viewApplication.status,
                    ],
                    [
                      "Date",
                      viewApplication.registeredAt,
                    ],
                  ].map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          {key}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-gray-200">
                          {value}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {viewApplication.registrationType ===
                  "Team" &&
                  viewApplication.teamMembers && (
                    <div className="mt-6 rounded-lg border border-gray-800 bg-gray-950 p-5">
                      <h3 className="font-bold text-gray-200">
                        Team:{" "}
                        {
                          viewApplication.teamName
                        }
                      </h3>

                      <div className="mt-4 space-y-2">
                        {viewApplication.teamMembers.map(
                          (
                            member,
                            index
                          ) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 p-3 text-sm text-gray-300"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-gray-400">
                                {index +
                                  1}
                              </span>

                              {member}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {viewApplication.status ===
                  "Pending" && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        changeStatus(
                          viewApplication.id,
                          "Approved"
                        )
                      }
                      className="rounded-lg bg-green-700 py-3.5 text-sm font-bold transition hover:bg-green-600"
                    >
                      ✓ Approve
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changeStatus(
                          viewApplication.id,
                          "Rejected"
                        )
                      }
                      className="rounded-lg bg-red-700 py-3.5 text-sm font-bold transition hover:bg-red-600"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    del(
                      viewApplication.id
                    )
                  }
                  className="mt-3 w-full rounded-lg border border-red-900 bg-red-950/30 py-3 text-sm font-bold text-red-300 transition hover:bg-red-900/30"
                >
                  Delete Registration
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewApplication(
                      null
                    )
                  }
                  className="mt-3 w-full rounded-lg border border-gray-700 py-3 text-sm font-bold text-gray-300 transition hover:bg-gray-800"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}
      </div>
    </main>
  );
}