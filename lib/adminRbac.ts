export type AdminRole = "super_admin" | "admin" | "event_manager" | "score_manager" | "viewer";
 
export type AdminPermission =
  | "dashboard.view"
  | "registrations.view"
  | "registrations.manage"
  | "events.manage"
  | "sports.manage"
  | "applications.review"
  | "incharges.manage"
  | "scores.manage"
  | "audit.view"
  | "roles.manage";
 
export type AdminRoleDefinition = {
  role: AdminRole;
  label: string;
  description: string;
  permissions: AdminPermission[];
};
 
export type AdminRoleSession = {
  role?: string;
  adminRole?: AdminRole;
  username?: string;
  email?: string;
};
 
export const DEFAULT_ADMIN_ROLES: AdminRoleDefinition[] = [
  {
    role: "super_admin",
    label: "Super Admin",
    description: "Full system access, including role and permission configuration.",
    permissions: [
      "dashboard.view", "registrations.view", "registrations.manage",
      "events.manage", "sports.manage", "applications.review",
      "incharges.manage", "scores.manage", "audit.view", "roles.manage",
    ],
  },
  {
    role: "admin",
    label: "Administrator",
    description: "Manage the main administration workflow, excluding role configuration.",
    permissions: [
      "dashboard.view", "registrations.view", "registrations.manage",
      "events.manage", "sports.manage", "applications.review",
      "incharges.manage", "scores.manage", "audit.view",
    ],
  },
  {
    role: "event_manager",
    label: "Event Manager",
    description: "Manage events and view/manage student registrations.",
    permissions: [
      "dashboard.view", "registrations.view", "registrations.manage", "events.manage",
    ],
  },
  {
    role: "score_manager",
    label: "Score Manager",
    description: "Manage scoring assignments and view score audit information.",
    permissions: ["dashboard.view", "incharges.manage", "scores.manage", "audit.view"],
  },
  {
    role: "viewer",
    label: "Read-only Viewer",
    description: "View dashboard, registrations and audit information without editing.",
    permissions: ["dashboard.view", "registrations.view", "audit.view"],
  },
];
 
export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  "dashboard.view": "View admin dashboard",
  "registrations.view": "View student registrations",
  "registrations.manage": "Approve, reject and delete registrations",
  "events.manage": "Create and manage events",
  "sports.manage": "Manage sports",
  "applications.review": "Review admin applications",
  "incharges.manage": "Manage match in-charges",
  "scores.manage": "Manage scoring",
  "audit.view": "View audit logs and alerts",
  "roles.manage": "Manage roles and permissions",
};
 
const STORAGE_KEY = "isports_admin_role_definitions";
 
export function getAdminRoles(): AdminRoleDefinition[] {
  if (typeof window === "undefined") return DEFAULT_ADMIN_ROLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_ROLES;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ADMIN_ROLES;
    const saved = parsed as AdminRoleDefinition[];
    return DEFAULT_ADMIN_ROLES.map((base) => {
      const override = saved.find((item) => item.role === base.role);
      return override ? { ...base, permissions: override.permissions } : base;
    });
  } catch {
    return DEFAULT_ADMIN_ROLES;
  }
}
 
export function saveAdminRoles(roles: AdminRoleDefinition[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
}
 
export function hasAdminPermission(
  session: AdminRoleSession | null,
  permission: AdminPermission
): boolean {
  if (!session || session.role !== "admin") return false;
  const role = session.adminRole || "admin";
  const definition = getAdminRoles().find((item) => item.role === role);
  return Boolean(definition?.permissions.includes(permission));
}
