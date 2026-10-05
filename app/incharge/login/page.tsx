"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInChargeAccounts } from "@/data/inchargeStorage";

export default function InChargeLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const accounts = getInChargeAccounts();

    const account = accounts.find(
      (item) =>
        item.username === username &&
        item.password === password
    );

    if (!account) {
      setError("Invalid username or password.");
      return;
    }

    if (!account.isActive) {
      setError("This account is inactive.");
      return;
    }

    if (new Date(account.expiresAt) < new Date()) {
      setError("This account has expired.");
      return;
    }

    localStorage.setItem(
      "isports_user",
      JSON.stringify({
        role: "incharge",
        accountId: account.id,
        name: account.name,
        username: account.username,
        assignedSport: account.assignedSport,
        assignedEventIds: account.assignedEventIds,
      })
    );

    router.push("/incharge/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8">
        <h1 className="mb-2 text-3xl font-bold">
          Match In-Charge Login
        </h1>

        <p className="mb-6 text-gray-400">
          Sign in using your temporary account.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="w-full rounded-lg bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-lg bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
          />

          {error && (
            <p className="rounded-lg bg-red-900/40 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold hover:bg-purple-500"
          >
            Login
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-gray-400 hover:text-white"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}