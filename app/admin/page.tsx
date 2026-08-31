"use client";

import { useEffect, useState } from "react";

import type { Registration } from "@/data/registrations";

import {
  getRegistrations,
  saveRegistrations,
} from "@/data/registrationStorage";

export default function AdminPage() {
  const [applications, setApplications] =
    useState<Registration[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [eventFilter, setEventFilter] =
    useState("All");

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [viewApplication, setViewApplication] =
    useState<Registration | null>(null);

  // Load registrations from localStorage
  useEffect(() => {
    const savedRegistrations = getRegistrations();

    setApplications(savedRegistrations);
  }, []);

  // Filter registrations
  const filteredApplications = applications.filter(
    (application) => {
      const searchText = search.toLowerCase();

      const applicantName =
        application.applicantName.toLowerCase();

      const eventName =
        application.eventName.toLowerCase();

      const teamName =
        application.teamName?.toLowerCase() || "";

      const matchesSearch =
        applicantName.includes(searchText) ||
        eventName.includes(searchText) ||
        teamName.includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        application.status === statusFilter;

      const matchesEvent =
        eventFilter === "All" ||
        application.eventName === eventFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesEvent
      );
    }
  );

  // Select / Unselect registration
  const toggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  // Update registration status
  const changeStatus = (
    id: string,
    status: Registration["status"]
  ) => {
    const updatedApplications =
      applications.map((application) =>
        application.id === id
          ? {
              ...application,
              status,
            }
          : application
      );

    setApplications(updatedApplications);

    // Save permanently in browser
    saveRegistrations(updatedApplications);

    setViewApplication(null);
  };

  // Approve selected registrations
  const approveSelected = () => {
    const updatedApplications =
      applications.map((application) =>
        selectedIds.includes(application.id)
          ? {
              ...application,
              status: "Approved" as const,
            }
          : application
      );

    setApplications(updatedApplications);

    saveRegistrations(updatedApplications);

    setSelectedIds([]);
  };

  // Reject selected registrations
  const rejectSelected = () => {
    const updatedApplications =
      applications.map((application) =>
        selectedIds.includes(application.id)
          ? {
              ...application,
              status: "Rejected" as const,
            }
          : application
      );

    setApplications(updatedApplications);

    saveRegistrations(updatedApplications);

    setSelectedIds([]);
  };

  // Statistics
  const pendingCount = applications.filter(
    (application) =>
      application.status === "Pending"
  ).length;

  const approvedCount = applications.filter(
    (application) =>
      application.status === "Approved"
  ).length;

  const rejectedCount = applications.filter(
    (application) =>
      application.status === "Rejected"
  ).length;

  // Get unique events automatically
  const eventNames = Array.from(
    new Set(
      applications.map(
        (application) => application.eventName
      )
    )
  );

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">

      {/* Header */}

      <header>
        <h1 className="text-4xl font-bold">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-gray-400">
          Manage sports event registrations.
        </p>
      </header>

      {/* Statistics */}

      <section className="mt-8 grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400">
            Pending
          </p>

          <p className="mt-2 text-3xl font-bold">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400">
            Approved
          </p>

          <p className="mt-2 text-3xl font-bold">
            {approvedCount}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 p-6">
          <p className="text-gray-400">
            Rejected
          </p>

          <p className="mt-2 text-3xl font-bold">
            {rejectedCount}
          </p>
        </div>

      </section>

      {/* Search and Filters */}

      <section className="mt-8 rounded-xl border border-gray-800 p-6">

        <div className="flex flex-col gap-4 md:flex-row">

          {/* Search */}

          <input
            type="text"
            placeholder="Search student, team or event..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none"
          />

          {/* Status Filter */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-white"
          >
            <option value="All">
              All Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Rejected">
              Rejected
            </option>
          </select>

          {/* Event Filter */}

          <select
            value={eventFilter}
            onChange={(e) =>
              setEventFilter(e.target.value)
            }
            className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-white"
          >
            <option value="All">
              All Events
            </option>

            {eventNames.map((eventName) => (
              <option
                key={eventName}
                value={eventName}
              >
                {eventName}
              </option>
            ))}

          </select>

        </div>

      </section>

      {/* Bulk Actions */}

      {selectedIds.length > 0 && (
        <section className="mt-4 flex gap-3">

          <button
            onClick={approveSelected}
            className="rounded-lg bg-green-600 px-5 py-3 font-semibold hover:bg-green-700"
          >
            Approve Selected
          </button>

          <button
            onClick={rejectSelected}
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-700"
          >
            Reject Selected
          </button>

        </section>
      )}

      {/* Registration Table */}

      <section className="mt-6 overflow-x-auto rounded-xl border border-gray-800">

        <table className="w-full text-left">

          <thead className="bg-gray-900">

            <tr>

              <th className="p-4">
                Select
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
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredApplications.length > 0 ? (
              filteredApplications.map(
                (application) => (
                  <tr
                    key={application.id}
                    className="border-t border-gray-800"
                  >

                    <td className="p-4">

                      <input
                        type="checkbox"
                        checked={selectedIds.includes(
                          application.id
                        )}
                        onChange={() =>
                          toggleSelection(
                            application.id
                          )
                        }
                      />

                    </td>

                    {/* Applicant / Team */}

                    <td className="p-4">

                      <div className="font-semibold">

                        {application.registrationType ===
                        "Team"
                          ? application.teamName
                          : application.applicantName}

                      </div>

                      {application.registrationType ===
                        "Team" && (
                        <div className="text-sm text-gray-500">
                          Captain:{" "}
                          {application.applicantName}
                        </div>
                      )}

                    </td>

                    {/* Event */}

                    <td className="p-4 text-gray-400">
                      {application.eventName}
                    </td>

                    {/* Type */}

                    <td className="p-4">
                      {application.registrationType}
                    </td>

                    {/* Status */}

                    <td className="p-4">
                      {application.status}
                    </td>

                    {/* View */}

                    <td className="p-4">

                      <button
                        onClick={() =>
                          setViewApplication(application)
                        }
                        className="rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800"
                      >
                        View
                      </button>

                    </td>

                  </tr>
                )
              )
            ) : (
              <tr>

                <td
                  colSpan={6}
                  className="p-8 text-center text-gray-400"
                >
                  No registrations found.
                </td>

              </tr>
            )}

          </tbody>

        </table>

      </section>

      {/* Registration Details Modal */}

      {viewApplication && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-6">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-950 p-8">

            {/* Header */}

            <div className="flex items-center justify-between">

              <h2 className="text-2xl font-bold">
                Registration Details
              </h2>

              <button
                onClick={() =>
                  setViewApplication(null)
                }
                className="text-xl text-gray-400 hover:text-white"
              >
                ✕
              </button>

            </div>

            {/* Details */}

            <div className="mt-6 space-y-4">

              <p>
                <strong>Registration ID:</strong>{" "}
                {viewApplication.id}
              </p>

              <p>
                <strong>Applicant:</strong>{" "}
                {viewApplication.applicantName}
              </p>

              {viewApplication.registrationType ===
                "Team" && (
                <p>
                  <strong>Team Name:</strong>{" "}
                  {viewApplication.teamName}
                </p>
              )}

              <p>
                <strong>Event:</strong>{" "}
                {viewApplication.eventName}
              </p>

              <p>
                <strong>Registration Type:</strong>{" "}
                {viewApplication.registrationType}
              </p>

              <p>
                <strong>College:</strong>{" "}
                {viewApplication.college}
              </p>

              <p>
                <strong>Registered On:</strong>{" "}
                {viewApplication.registeredAt}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {viewApplication.status}
              </p>

            </div>

            {/* Team Members */}

            {viewApplication.registrationType ===
              "Team" &&
              viewApplication.teamMembers && (
                <section className="mt-8">

                  <h3 className="text-xl font-bold">
                    Team Members
                  </h3>

                  <div className="mt-4 space-y-2">

                    {viewApplication.teamMembers.map(
                      (member, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-gray-800 p-3"
                        >
                          {index + 1}. {member}
                        </div>
                      )
                    )}

                  </div>

                </section>
              )}

            {/* Approve / Reject */}

            {viewApplication.status === "Pending" && (
              <div className="mt-8 flex gap-3">

                <button
                  onClick={() =>
                    changeStatus(
                      viewApplication.id,
                      "Approved"
                    )
                  }
                  className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-bold hover:bg-green-700"
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    changeStatus(
                      viewApplication.id,
                      "Rejected"
                    )
                  }
                  className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-bold hover:bg-red-700"
                >
                  Reject
                </button>

              </div>
            )}

            {/* Close */}

            <button
              onClick={() =>
                setViewApplication(null)
              }
              className="mt-3 w-full rounded-lg border border-gray-700 px-6 py-3 font-bold hover:bg-gray-900"
            >
              Close
            </button>

          </div>

        </div>
      )}

    </main>
  );
}