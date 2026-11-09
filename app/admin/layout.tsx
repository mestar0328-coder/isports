"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { hasAdminPermission, type AdminPermission, type AdminRoleSession } from "@/lib/adminRbac";

type AdminLayoutProps = { children: ReactNode };

const routePermissions: Array<{ prefix: string; permission: AdminPermission }> = [
  { prefix: "/admin/roles", permission: "roles.manage" },
  { prefix: "/admin/applications", permission: "applications.review" },
  { prefix: "/admin/incharges", permission: "incharges.manage" },
  { prefix: "/admin/activity", permission: "audit.view" },
  { prefix: "/admin/audit", permission: "audit.view" },
  { prefix: "/admin/events", permission: "events.manage" },
  { prefix: "/admin/event", permission: "events.manage" },
  { prefix: "/admin/sports", permission: "sports.manage" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login" || pathname === "/admin/register") {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    let session: AdminRoleSession | null = null;
    try {
      const raw = localStorage.getItem("isports_user");
      session = raw ? (JSON.parse(raw) as AdminRoleSession) : null;
    } catch {
      localStorage.removeItem("isports_user");
    }

    if (!session || session.role !== "admin") {
      setAuthorized(false);
      setChecking(false);
      router.replace("/admin/login");
      return;
    }

    const required = routePermissions.find(({ prefix }) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
    )?.permission;

    if (required && !hasAdminPermission(session, required)) {
      setAuthorized(false);
      setChecking(false);
      router.replace("/admin");
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">Checking admin access...</main>;
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <h1 className="text-2xl font-bold">Access restricted</h1>
          <p className="mt-3 text-gray-400">Your current admin session does not have access to this page.</p>
          <Link href="/admin" className="mt-6 inline-block rounded-lg bg-purple-600 px-5 py-3 font-semibold">Return to dashboard</Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
