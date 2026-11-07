"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DEFAULT_ADMIN_ROLES,
  getAdminRoles,
  hasAdminPermission,
  PERMISSION_LABELS,
  saveAdminRoles,
  type AdminPermission,
  type AdminRoleDefinition,
  type AdminRoleSession,
} from "@/lib/adminRbac";
 
const permissionKeys = Object.keys(PERMISSION_LABELS) as AdminPermission[];
 
export default function AdminRolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<AdminRoleDefinition[]>(DEFAULT_ADMIN_ROLES);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
 
  useEffect(() => {
    let session: AdminRoleSession | null = null;
    try {
      const raw = localStorage.getItem("isports_user");
      session = raw ? (JSON.parse(raw) as AdminRoleSession) : null;
    } catch {
      session = null;
    }
    if (!session || !hasAdminPermission(session, "roles.manage")) {
      router.replace("/admin");
      return;
    }
    setRoles(getAdminRoles());
    setReady(true);
  }, [router]);
 
  function togglePermission(roleName: AdminRoleDefinition["role"], permission: AdminPermission) {
    setRoles((current) =>
      current.map((role) => {
        if (role.role !== roleName) return role;
        if (role.role === "super_admin") return role;
        const exists = role.permissions.includes(permission);
        return {
          ...role,
          permissions: exists
            ? role.permissions.filter((item) => item !== permission)
            : [...role.permissions, permission],
        };
      })
    );
    setMessage("");
    setError("");
  }
 
  function handleSave() {
    try {
      const superAdmin = roles.find((role) => role.role === "super_admin");
      if (!superAdmin || permissionKeys.some((key) => !superAdmin.permissions.includes(key))) {
        setError("Super Admin must retain every permission.");
        return;
      }
      saveAdminRoles(roles);
      setMessage("Role permissions saved in this browser.");
      setError("");
    } catch {
      setError("Unable to save role permissions. Check browser storage.");
    }
  }
 
  function resetDefaults() {
    setRoles(DEFAULT_ADMIN_ROLES);
    saveAdminRoles(DEFAULT_ADMIN_ROLES);
    setMessage("Default role permissions restored.");
    setError("");
  }
 
  if (!ready) return <main className="min-h-screen bg-gray-950 p-8 text-white">Checking access...</main>;
 
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">Access Control</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Admin Roles & Permissions</h1>
            <p className="mt-2 text-gray-400">Configure the permission sets assigned to each admin role.</p>
          </div>
          <Link href="/admin" className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800">Back to Dashboard</Link>
        </div>
 
        <div className="mb-6 rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-200">
          Development-mode RBAC: role definitions are saved in this browser's localStorage. This page is restricted to the Super Admin demo session. These client-side checks improve UI access control but are not a substitute for server-side authorization.
        </div>
 
        <div className="space-y-5">
          {roles.map((role) => (
            <section key={role.role} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
              <div className="border-b border-gray-800 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold">{role.label}</h2>
                  <span className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300">{role.permissions.length} / {permissionKeys.length} permissions</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">{role.description}</p>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {permissionKeys.map((permission) => (
                  <label key={permission} className={`flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-950 p-3 ${role.role === "super_admin" ? "opacity-75" : "cursor-pointer hover:border-gray-600"}`}>
                    <input
                      type="checkbox"
                      checked={role.permissions.includes(permission)}
                      disabled={role.role === "super_admin"}
                      onChange={() => togglePermission(role.role, permission)}
                      className="mt-1 h-4 w-4 accent-purple-500"
                    />
                    <span className="text-sm text-gray-200">{PERMISSION_LABELS[permission]}</span>
                  </label>
                ))}
              </div>
              {role.role === "super_admin" && <p className="px-5 pb-5 text-xs text-amber-300">Super Admin permissions are locked and cannot be removed.</p>}
            </section>
          ))}
        </div>
 
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-lg border border-green-800 bg-green-950/40 p-3 text-sm text-green-300">{message}</p>}
 
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={handleSave} className="rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500">Save Permissions</button>
          <button type="button" onClick={resetDefaults} className="rounded-lg border border-gray-700 px-6 py-3 font-semibold hover:bg-gray-800">Restore Defaults</button>
        </div>
      </div>
    </main>
  );
}
