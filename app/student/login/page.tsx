"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStudentAccounts } from "@/data/studentAccountStorage";

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 120000,
      hash: "SHA-256",
    },
    key,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function StudentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const registeredEmail = params.get("email");
    if (registeredEmail) {
      setEmail(registeredEmail);
      setNotice("Registration saved in this browser. Sign in with your new account.");
    } else if (params.get("registered") === "1") {
      setNotice("Registration completed. Please sign in.");
    }
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const account = getStudentAccounts().find(
        (item) => item.email.toLowerCase() === normalizedEmail
      );

      if (!account) {
        setError("No student account was found for this email. Register first.");
        return;
      }

      if (account.accountStatus !== "Active") {
        setError("This student account is not active.");
        return;
      }

      const enteredHash = await hashPassword(password, account.passwordSalt);
      if (enteredHash !== account.passwordHash) {
        setError("Incorrect email or password.");
        return;
      }

      localStorage.setItem(
        "isports_user",
        JSON.stringify({
          role: "student",
          studentId: account.id,
          email: account.email,
          name: `${account.firstName} ${account.lastName}`.trim(),
        })
      );

      router.push("/student/dashboard");
    } catch {
      setError("Unable to sign in in this browser. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <div className="text-center">
          <h1 className="mt-2 text-3xl font-bold">Student Login</h1>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to register for sports events and view your results.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {notice && (
            <p role="status" className="rounded-lg border border-green-800 bg-green-950/30 px-4 py-3 text-sm text-green-300">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Login as Student"}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center">
          <p className="text-sm text-gray-400">
            New to iSports?{" "}
            <Link href="/student/register" className="font-semibold text-blue-400 transition hover:text-blue-300">
              Create Student Account
            </Link>
          </p>
          <Link href="/" className="text-sm text-gray-400 transition hover:text-white">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
