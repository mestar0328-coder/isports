"use client";

import { useEffect, useState } from "react";

import { getRegistrations } from "@/data/registrationStorage";
import type { Registration } from "@/data/registrations";

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    setRegistrations(getRegistrations());
  }, []);

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
          <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-400">
            No registrations found.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-5"
              >
                <h2 className="text-xl font-bold">
                  {registration.eventName}
                </h2>

                <div className="mt-3 space-y-1 text-sm text-gray-400">
                  <p>
                    <strong className="text-gray-200">Name:</strong>{" "}
                    {registration.applicantName}
                  </p>

                  <p>
                    <strong className="text-gray-200">College:</strong>{" "}
                    {registration.college}
                  </p>

                  <p>
                    <strong className="text-gray-200">Type:</strong>{" "}
                    {registration.registrationType}
                  </p>

                  <p>
                    <strong className="text-gray-200">Status:</strong>{" "}
                    {registration.status}
                  </p>

                  <p>
                    <strong className="text-gray-200">Registered on:</strong>{" "}
                    {registration.registeredAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}