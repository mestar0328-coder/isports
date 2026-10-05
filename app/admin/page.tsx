"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Registration,
  RegistrationStatus,
} from "@/data/registrations";
import {
  getRegistrations,
  saveRegistrations,
} from "@/data/registrationStorage";

export default function AdminPage() {
  const router = useRouter();

  const [registrations, setRegistrations] = useState<Registration[]>(
    []
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Admin login protection
  useEffect(() => {
    const savedUser = localStorage.getItem("isports_user");

    if (!savedUser) {
      router.replace("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (user.role !== "admin") {
        router.replace("/admin/login");
      }
    } catch {
      localStorage.removeItem("isports_user");
      router.replace("/admin/login");
    }
  }, [router]);

  // Load registrations
  useEffect(() => {
    setRegistrations(getRegistrations());
  }, []);

  function updateStatus(
    id: string,
    status: RegistrationStatus
  ) {
    const updatedRegistrations = registrations.map(
      (registration) =>
        registration.id === id
          ? { ...registration, status }
          : registration
    );

    setRegistrations(updatedRegistrations);
    saveRegistrations(updatedRegistrations);
  }

  function deleteRegistration(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this registration?"
    );

    if (!confirmed) return;

    const updatedRegistrations = registrations.filter(
      (registration) => registration.id !== id
    );

    setRegistrations(updatedRegistrations);
    saveRegistrations(updatedRegistrations);
  }

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((registration) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        registration.applicantName
          .toLowerCase()
          .includes(searchText) ||
        registration.eventName
          .toLowerCase()
          .includes(searchText) ||
        registration.college
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        registration.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, search, statusFilter]);

  const totalRegistrations = registrations.length;

  const pendingRegistrations = registrations.filter(
    (registration) => registration.status === "Pending"
  ).length;

  const approvedRegistrations = registrations.filter(
    (registration) => registration.status === "Approved"
  ).length;

  const rejectedRegistrations = registrations.filter(
    (registration) => registration.status === "Rejected"
  ).length;

  function exportCSV() {
    const headers = [
      "Applicant Name",
      "Event",
      "College",
      "Registration Type",
      "Team Name",
      "Status",
      "Registered At",
    ];

    const rows = filteredRegistrations.map((registration) => [
      registration.applicantName,
      registration.eventName,
      registration.college,
      registration.registrationType,
      registration.teamName ?? "",
      registration.status,
      registration.registeredAt,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "registrations.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Admin
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Registration Dashboard
            </h1>

            <p className="mt-2 text-gray-400">
              Manage student registrations and sports events.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/events")}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500"
            >
              Manage Events
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/events/new")}
              className="rounded-lg border border-blue-500 px-5 py-3 font-semibold text-blue-400 hover:bg-blue-500 hover:text-white"
            >
              Create Event
            </button>

            <button
              type="button"
              onClick={exportCSV}
              className="rounded-lg border border-gray-700 px-5 py-3 font-semibold text-gray-200 hover:bg-gray-800"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-gray-700 px-5 py-3 font-semibold text-gray-200 hover:bg-gray-800"
            >
              Home
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm font-semibold text-gray-400">
              Total Registrations
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {totalRegistrations}
            </p>
          </div>

          <div className="rounded-xl border border-yellow-900 bg-yellow-950/30 p-5">
            <p className="text-sm font-semibold text-yellow-400">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-300">
              {pendingRegistrations}
            </p>
          </div>

          <div className="rounded-xl border border-green-900 bg-green-950/30 p-5">
            <p className="text-sm font-semibold text-green-400">
              Approved
            </p>

            <p className="mt-2 text-3xl font-bold text-green-300">
              {approvedRegistrations}
            </p>
          </div>

          <div className="rounded-xl border border-red-900 bg-red-950/30 p-5">
            <p className="text-sm font-semibold text-red-400">
              Rejected
            </p>

            <p className="mt-2 text-3xl font-bold text-red-300">
              {rejectedRegistrations}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Search by applicant, event, or college..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          Showing {filteredRegistrations.length} registration(s)
        </p>

        {filteredRegistrations.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
            No registrations found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-6"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-xl font-bold">
                      {registration.applicantName}
                    </h2>

                    <p className="mt-1 text-blue-400">
                      {registration.eventName}
                    </p>

                    <p className="mt-2 text-gray-400">
                      College: {registration.college}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Type: {registration.registrationType}
                    </p>

                    {registration.teamName && (
                      <p className="mt-1 text-sm text-gray-400">
                        Team: {registration.teamName}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-gray-500">
                      Status: {registration.status}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Registered on: {registration.registeredAt}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(registration.id, "Approved")
                      }
                      className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-500"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(registration.id, "Rejected")
                      }
                      className="rounded-lg bg-yellow-600 px-4 py-2 font-semibold hover:bg-yellow-500"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteRegistration(registration.id)
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
<Link
  href="/admin/incharges"
  className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500"
>
  Manage Match In-Charges
</Link>