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
 
type RegistrationAction = "Approved" | "Rejected" | "Deleted";
 
export default function AdminPage() {
  const router = useRouter();
 
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedActions, setSelectedActions] = useState<
    Record<string, RegistrationAction>
  >({});
  const [viewingRegistration, setViewingRegistration] =
    useState<Registration | null>(null);
 
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
 
  // Load registrations and reflect their existing status in the action buttons.
  useEffect(() => {
    const savedRegistrations = getRegistrations();
    setRegistrations(savedRegistrations);
 
    const initialActions: Record<string, RegistrationAction> = {};
    savedRegistrations.forEach((registration) => {
      if (
        registration.status === "Approved" ||
        registration.status === "Rejected"
      ) {
        initialActions[registration.id] = registration.status;
      }
    });
    setSelectedActions(initialActions);
  }, []);
 
  function updateStatus(id: string, status: RegistrationStatus) {
    const updatedRegistrations = registrations.map((registration) =>
      registration.id === id
        ? { ...registration, status }
        : registration
    );
 
    setRegistrations(updatedRegistrations);
    saveRegistrations(updatedRegistrations);
    setSelectedActions((current) => {
      if (status === "Pending") {
        const next = { ...current };
        delete next[id];
        return next;
      }

      return {
        ...current,
        [id]: status,
      };
    });
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
    setSelectedActions((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
 
    if (viewingRegistration?.id === id) {
      setViewingRegistration(null);
    }
  }
 
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((registration) => {
      const searchText = search.toLowerCase().trim();
 
      const matchesSearch =
        registration.applicantName.toLowerCase().includes(searchText) ||
        registration.eventName.toLowerCase().includes(searchText) ||
        registration.college.toLowerCase().includes(searchText);
 
      const matchesStatus =
        statusFilter === "All" || registration.status === statusFilter;
 
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
 
  // Export registrations as CSV
  function exportCSV() {
    const headers = [
      "Applicant Name",
      "Event",
      "College",
      "Registration Type",
      "Team Name",
      "Team Members",
      "Status",
      "Registered At",
    ];
 
    const rows = filteredRegistrations.map((registration) => [
      registration.applicantName,
      registration.eventName,
      registration.college,
      registration.registrationType,
      registration.teamName ?? "",
      registration.teamMembers?.join("; ") ?? "",
      registration.status,
      registration.registeredAt,
    ]);
 
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
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
 
  function actionButtonClass(
    registrationId: string,
    action: RegistrationAction,
    colorClass: string
  ) {
    const selectedAction = selectedActions[registrationId];
    const hasSelection = Boolean(selectedAction);
    const isSelected = selectedAction === action;
 
    return [
      "rounded-lg px-4 py-2 font-semibold transition-all duration-150",
      colorClass,
      hasSelection && !isSelected
        ? "opacity-35 saturate-50"
        : "opacity-100",
      isSelected
        ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 shadow-lg"
        : "hover:brightness-110",
    ].join(" ");
  }
 
  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Dashboard Header */}
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
 
          {/* Dashboard Navigation Buttons */}
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
              onClick={() => router.push("/admin/sports")}
              className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-500"
            >
              Sports Management
            </button>
 
            <Link
              href="/admin/incharges"
              className="rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-500"
            >
              Manage Match In-Charges
            </Link>
 
            <Link
              href="/admin/audit"
              className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500"
            >
              Score Audit Log
            </Link>
 
            <Link
              href="/admin/audit/alerts"
              className="rounded-lg border border-red-500 bg-red-50 px-4 py-2 font-semibold text-red-700 hover:bg-red-100"
            >
              Alert Management
            </Link>
 
            <button
              type="button"
              onClick={() => router.push("/admin/event/new")}
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
            <p className="text-sm font-semibold text-yellow-400">Pending</p>
            <p className="mt-2 text-3xl font-bold text-yellow-300">
              {pendingRegistrations}
            </p>
          </div>
 
          <div className="rounded-xl border border-green-900 bg-green-950/30 p-5">
            <p className="text-sm font-semibold text-green-400">Approved</p>
            <p className="mt-2 text-3xl font-bold text-green-300">
              {approvedRegistrations}
            </p>
          </div>
 
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-5">
            <p className="text-sm font-semibold text-red-400">Rejected</p>
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
 
        {/* Registration List */}
        {filteredRegistrations.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
            No registrations found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => {
              const selectedAction = selectedActions[registration.id];
 
              return (
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
 
                    {/* Registration Actions */}
                    <div className="flex flex-col items-start gap-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-pressed={selectedAction === "Approved"}
                          onClick={() =>
                            updateStatus(registration.id, "Approved")
                          }
                          className={actionButtonClass(
                            registration.id,
                            "Approved",
                            "bg-green-600 text-white"
                          )}
                        >
                          Approve
                        </button>
 
                        <button
                          type="button"
                          aria-pressed={selectedAction === "Rejected"}
                          onClick={() =>
                            updateStatus(registration.id, "Rejected")
                          }
                          className={actionButtonClass(
                            registration.id,
                            "Rejected",
                            "bg-yellow-600 text-white"
                          )}
                        >
                          Reject
                        </button>
 
                        <button
                          type="button"
                          onClick={() => deleteRegistration(registration.id)}
                          className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
 
                      {selectedAction && (
                        <p className="text-xs font-medium text-gray-400">
                          Last selected action:{" "}
                          <span
                            className={
                              selectedAction === "Approved"
                                ? "text-green-400"
                                : selectedAction === "Rejected"
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }
                          >
                            {selectedAction}
                          </span>
                        </p>
                      )}
 
                      {/* View button below Approve / Reject / Delete */}
                      <button
                        type="button"
                        onClick={() => setViewingRegistration(registration)}
                        className="w-full rounded-lg border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-600 hover:text-white"
                      >
                        View Applicant Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
 
      {/* Complete Applicant Details Modal */}
      {viewingRegistration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setViewingRegistration(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="applicant-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                  Registration information
                </p>
                <h2
                  id="applicant-details-title"
                  className="mt-1 text-2xl font-bold text-white"
                >
                  Complete Applicant Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingRegistration(null)}
                aria-label="Close applicant details"
                className="rounded-lg border border-gray-700 px-3 py-2 text-gray-300 hover:bg-gray-800"
              >
                Close
              </button>
            </div>
 
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail label="Applicant Name" value={viewingRegistration.applicantName} />
              <Detail label="Registration ID" value={viewingRegistration.id} />
              <Detail label="Event Name" value={viewingRegistration.eventName} />
              <Detail label="Event ID" value={viewingRegistration.eventId} />
              <Detail label="College" value={viewingRegistration.college} />
              <Detail label="Registration Type" value={viewingRegistration.registrationType} />
              <Detail label="Team Name" value={viewingRegistration.teamName || "Not applicable"} />
              <Detail label="Status" value={viewingRegistration.status} />
              <Detail label="Registered At" value={viewingRegistration.registeredAt} />
              <div className="rounded-lg border border-gray-700 bg-gray-950 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Team Members
                </p>
                {viewingRegistration.teamMembers?.length ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-200">
                    {viewingRegistration.teamMembers.map((member, index) => (
                      <li key={`${index}-${member}`}>{member}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-300">
                    No team-member details were supplied for this registration.
                  </p>
                )}
              </div>
            </div>
 
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingRegistration(null)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
 
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-gray-100">{value}</p>
    </div>
  );
}