export type AdminActivityAction =
  | "In-Charge Created"
  | "In-Charge Updated"
  | "In-Charge Deleted"
  | "Events Assigned"
  | "Account Activated"
  | "Account Deactivated";
 
export type AdminActivityLog = {
  id: string;
  action: AdminActivityAction;
  actor: string;
  targetId: string;
  targetName: string;
  details: string;
  timestamp: string;
};
 
const STORAGE_KEY = "isports_admin_activity_log";
 
function createId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
 
export function getAdminActivityLogs(): AdminActivityLog[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? (parsed as AdminActivityLog[]) : [];
  } catch {
    return [];
  }
}
 
export function addAdminActivityLog(
  action: AdminActivityAction,
  actor: string,
  targetId: string,
  targetName: string,
  details: string
): AdminActivityLog[] {
  if (typeof window === "undefined") return [];
  const entry: AdminActivityLog = {
    id: createId(),
    action,
    actor: actor.trim() || "admin",
    targetId,
    targetName,
    details,
    timestamp: new Date().toISOString(),
  };
  const next = [entry, ...getAdminActivityLogs()];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    throw new Error("Unable to save the admin activity log. Browser storage may be full.");
  }
}
 
export function clearAdminActivityLogs(): void {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}

 