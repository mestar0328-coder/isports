import { getInChargeAccounts } from "./inchargeStorage";

export type InchargeAccess = {
  userId: string;
  userName: string;
  username: string;
  role: "Scoring Incharge";
  assignedEventIds: string[];
  accessType: "Temporary";
  active: boolean;
  expired: boolean;
};

export function getCurrentInchargeAccess(): InchargeAccess | null {
  if (typeof window === "undefined") return null;
  const savedUser = localStorage.getItem("isports_user");
  if (!savedUser) return null;

  try {
    const raw: unknown = JSON.parse(savedUser);
    if (!raw || typeof raw !== "object") return null;
    const user = raw as Record<string, unknown>;
    if (user.role !== "incharge") return null;

    const account = getInChargeAccounts().find((item) =>
      (typeof user.accountId === "string" && item.id === user.accountId) ||
      (typeof user.username === "string" &&
        item.username.toLowerCase() === user.username.toLowerCase())
    );
    if (!account) return null;

    const expiry = new Date(account.expiresAt).getTime();
    return {
      userId: account.id,
      userName: account.name,
      username: account.username,
      role: "Scoring Incharge",
      assignedEventIds: Array.isArray(account.assignedEventIds) ? account.assignedEventIds : [],
      accessType: "Temporary",
      active: account.isActive === true,
      expired: !Number.isFinite(expiry) || expiry < Date.now(),
    };
  } catch {
    return null;
  }
}

export function isInchargeAuthorized(): boolean {
  const a = getCurrentInchargeAccess();
  return !!a && a.role === "Scoring Incharge" && a.accessType === "Temporary" && a.active && !a.expired;
}

export function canAccessEvent(eventId: string): boolean {
  const a = getCurrentInchargeAccess();
  return !!eventId.trim() && !!a && a.active && !a.expired && a.assignedEventIds.includes(eventId);
}

export function canScoreEvent(eventId: string): boolean {
  return isInchargeAuthorized() && canAccessEvent(eventId);
}
