"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

type UserRole = "Admin" | "User";

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const router = useRouter();

 const userRole: UserRole = "Admin";

  const isAdminAuthorized = userRole === "Admin";

  if (!isAdminAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0f] p-6 text-white">
        <div className="w-full max-w-md rounded-[24px] border border-red-900/50 bg-gray-900 p-8 text-center shadow-2xl">
          <div className="text-5xl">🔒</div>

          <h1 className="mt-5 text-3xl font-black">
            Access Denied
          </h1>

          <p className="mt-3 text-gray-400">
            You do not have permission to access the Admin Dashboard.
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-white px-6 py-3 font-bold text-black hover:bg-gray-200"
          >
            Return Home
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}