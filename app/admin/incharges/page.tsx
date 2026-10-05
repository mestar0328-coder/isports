"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import {
  addInChargeAccount,
  deleteInChargeAccount,
  getInChargeAccounts,
  updateInChargeAccount,
} from "@/data/inchargeStorage";

import { getEvents } from "@/data/eventsStorage";
import type { SportEvent } from "@/types/events";

type InChargeAccount = {
  id: string;
  name: string;
  username: string;
  password: string;
  assignedSport: string;
  assignedEventIds: string[];
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
};

export default function InChargesPage() {
  const [accounts, setAccounts] =
    useState<InChargeAccount[]>([]);

  const [events, setEvents] =
    useState<SportEvent[]>([]);

  const [name, setName] = useState("");
  const [username, setUsername] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [assignedSport, setAssignedSport] =
    useState("");
  const [expiresAt, setExpiresAt] =
    useState("");

  const [selectedEvents, setSelectedEvents] =
    useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadedAccounts =
      getInChargeAccounts();

    const loadedEvents =
      getEvents();

    setAccounts(loadedAccounts);
    setEvents(loadedEvents);

    const initialSelections:
      Record<string, string[]> = {};

    loadedAccounts.forEach((account) => {
      initialSelections[account.id] =
        account.assignedEventIds || [];
    });

    setSelectedEvents(
      initialSelections
    );
  }, []);

  function handleCreateAccount(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !name.trim() ||
      !username.trim() ||
      !password.trim() ||
      !assignedSport.trim() ||
      !expiresAt
    ) {
      alert("Please fill in all fields.");
      return;
    }

    const newAccount: InChargeAccount = {
      id: crypto.randomUUID(),
      name: name.trim(),
      username: username.trim(),
      password,
      assignedSport:
        assignedSport.trim(),
      assignedEventIds: [],
      expiresAt,
      isActive: true,
      createdAt:
        new Date().toISOString(),
    };

    addInChargeAccount(
      newAccount
    );

    const updatedAccounts =
      getInChargeAccounts();

    setAccounts(updatedAccounts);

    setSelectedEvents((current) => ({
      ...current,
      [newAccount.id]: [],
    }));

    setName("");
    setUsername("");
    setPassword("");
    setAssignedSport("");
    setExpiresAt("");

    alert(
      "Match In-Charge account created successfully."
    );
  }

  function handleDeleteAccount(
    id: string
  ) {
    const confirmed = confirm(
      "Are you sure you want to delete this account?"
    );

    if (!confirmed) {
      return;
    }

    deleteInChargeAccount(id);

    const updatedAccounts =
      getInChargeAccounts();

    setAccounts(updatedAccounts);

    setSelectedEvents((current) => {
      const updated = {
        ...current,
      };

      delete updated[id];

      return updated;
    });
  }

  function handleEventToggle(
    accountId: string,
    eventId: string
  ) {
    setSelectedEvents((current) => {
      const currentEvents =
        current[accountId] || [];

      const alreadySelected =
        currentEvents.includes(
          eventId
        );

      const updatedEvents =
        alreadySelected
          ? currentEvents.filter(
              (id) => id !== eventId
            )
          : [
              ...currentEvents,
              eventId,
            ];

      return {
        ...current,
        [accountId]:
          updatedEvents,
      };
    });
  }

  function handleSaveAssignment(
    account: InChargeAccount
  ) {
    const eventIds =
      selectedEvents[account.id] || [];

    updateInChargeAccount(
      account.id,
      {
        assignedEventIds:
          eventIds,
      }
    );

    const updatedAccounts =
      getInChargeAccounts();

    setAccounts(updatedAccounts);

    alert(
      `Events assigned successfully to ${account.name}.`
    );
  }

  function getEventName(
    eventId: string
  ) {
    const event = events.find(
      (item) =>
        item.id === eventId
    );

    return (
      event?.name || eventId
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold">
              Manage Match In-Charges
            </h1>

            <p className="mt-2 text-gray-400">
              Create accounts and assign specific events to each Match In-Charge.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg bg-gray-700 px-4 py-2 font-semibold transition hover:bg-gray-600"
          >
            Back to Admin
          </Link>

        </div>

        {/* CREATE ACCOUNT */}

        <section className="mb-10 rounded-xl border border-gray-800 bg-gray-900 p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Create Temporary Account
          </h2>

          <form
            onSubmit={handleCreateAccount}
            className="grid gap-4 md:grid-cols-2"
          >

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Full name"
              className="rounded-lg bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              placeholder="Username"
              className="rounded-lg bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Temporary password"
              className="rounded-lg bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              value={assignedSport}
              onChange={(event) =>
                setAssignedSport(
                  event.target.value
                )
              }
              placeholder="Assigned sport, e.g. Basketball"
              className="rounded-lg bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Account expiry date
              </label>

              <input
                type="date"
                value={expiresAt}
                onChange={(event) =>
                  setExpiresAt(
                    event.target.value
                  )
                }
                className="w-full rounded-lg bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500"
            >
              Create Account
            </button>

          </form>

        </section>

        {/* EXISTING ACCOUNTS */}

        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Existing In-Charge Accounts
          </h2>

          {accounts.length === 0 ? (
            <p className="text-gray-400">
              No match in-charge accounts created yet.
            </p>
          ) : (
            <div className="space-y-6">

              {accounts.map(
                (account) => (
                  <div
                    key={account.id}
                    className="rounded-xl border border-gray-700 bg-gray-800 p-5"
                  >

                    {/* ACCOUNT INFORMATION */}

                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div>

                        <h3 className="text-lg font-semibold">
                          {account.name}
                        </h3>

                        <p className="text-sm text-gray-300">
                          Username:{" "}
                          {account.username}
                        </p>

                        <p className="text-sm text-yellow-300">
                          Password:{" "}
                          {account.password}
                        </p>

                        <p className="text-sm text-gray-300">
                          Sport:{" "}
                          {account.assignedSport}
                        </p>

                        <p className="text-sm text-gray-300">
                          Expires:{" "}
                          {account.expiresAt}
                        </p>

                        <span
                          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            account.isActive
                              ? "bg-green-600/20 text-green-300"
                              : "bg-red-600/20 text-red-300"
                          }`}
                        >
                          {account.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteAccount(
                            account.id
                          )
                        }
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold transition hover:bg-red-500"
                      >
                        Delete
                      </button>

                    </div>

                    {/* EVENT ASSIGNMENT */}

                    <div className="mt-6 border-t border-gray-700 pt-5">

                      <h4 className="text-base font-semibold">
                        Assign Events
                      </h4>

                      <p className="mt-1 text-sm text-gray-400">
                        Select the events this Match In-Charge is allowed to manage.
                      </p>

                      {events.length === 0 ? (
                        <div className="mt-4 rounded-lg border border-dashed border-gray-700 bg-gray-900 p-4">

                          <p className="text-sm text-gray-400">
                            No events available to assign.
                          </p>

                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">

                          {events.map(
                            (event) => {
                              const isSelected =
                                (
                                  selectedEvents[
                                    account.id
                                  ] || []
                                ).includes(
                                  event.id
                                );

                              return (
                                <label
                                  key={
                                    event.id
                                  }
                                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-700 bg-gray-900 p-4 transition hover:border-blue-600"
                                >

                                  <input
                                    type="checkbox"
                                    checked={
                                      isSelected
                                    }
                                    onChange={() =>
                                      handleEventToggle(
                                        account.id,
                                        event.id
                                      )
                                    }
                                    className="mt-1 h-4 w-4 accent-blue-600"
                                  />

                                  <div>

                                    <p className="font-semibold text-gray-100">
                                      {event.name}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-400">
                                      {event.sportId}{" "}
                                      •{" "}
                                      {event.venue}{" "}
                                      •{" "}
                                      {event.date}
                                    </p>

                                  </div>

                                </label>
                              );
                            }
                          )}

                        </div>
                      )}

                      {/* SAVE ASSIGNMENT */}

                      <button
                        type="button"
                        onClick={() =>
                          handleSaveAssignment(
                            account
                          )
                        }
                        className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
                      >
                        Save Event Assignment
                      </button>

                      {/* CURRENT ASSIGNMENTS */}

                      <div className="mt-5">

                        <p className="text-sm font-semibold text-gray-300">
                          Currently Assigned:
                        </p>

                        {(
                          selectedEvents[
                            account.id
                          ] || []
                        ).length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">
                            No events assigned.
                          </p>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-2">

                            {(
                              selectedEvents[
                                account.id
                              ] || []
                            ).map(
                              (eventId) => (
                                <span
                                  key={
                                    eventId
                                  }
                                  className="rounded-full border border-blue-800 bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-300"
                                >
                                  {getEventName(
                                    eventId
                                  )}
                                </span>
                              )
                            )}

                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}