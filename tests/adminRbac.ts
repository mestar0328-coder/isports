import { describe, expect, it } from "vitest";
import { DEFAULT_ADMIN_ROLES, hasAdminPermission, type AdminRoleSession } from "@/lib/adminRbac";
 
describe("admin role permission model", () => {
  it("defines all permissions for Super Admin", () => {
    const superAdmin = DEFAULT_ADMIN_ROLES.find((role) => role.role === "super_admin");
    expect(superAdmin).toBeDefined();
    expect(superAdmin?.permissions).toHaveLength(10);
  });
 
  it("allows the demo Super Admin to manage roles", () => {
    const session: AdminRoleSession = { role: "admin", adminRole: "super_admin" };
    expect(hasAdminPermission(session, "roles.manage")).toBe(true);
  });
 
  it("does not allow an Event Manager to manage roles", () => {
    const session: AdminRoleSession = { role: "admin", adminRole: "event_manager" };
    expect(hasAdminPermission(session, "roles.manage")).toBe(false);
    expect(hasAdminPermission(session, "events.manage")).toBe(true);
  });
 
  it("rejects missing or non-admin sessions", () => {
    expect(hasAdminPermission(null, "dashboard.view")).toBe(false);
    expect(hasAdminPermission({ role: "student" }, "dashboard.view")).toBe(false);
  });
});
