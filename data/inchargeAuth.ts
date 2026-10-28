import { getInChargeAccounts } from "./inchargeStorage";

export type InchargeAccess = {
  userName: string;
  role: "Scoring Incharge";
  assignedEventIds: string[];
  accessType: "Temporary";
  active: boolean;
  expired: boolean;
};

export function getCurrentInchargeAccess(): InchargeAccess | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedUser = localStorage.getItem("isports_user");

  if (!savedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(savedUser);

    if (
      !parsedUser ||
      typeof parsedUser !== "object" ||
      parsedUser.role !== "incharge"
    ) {
      return null;
    }

    const accounts = getInChargeAccounts();

    const account = accounts.find(
      (item) =>
        item.id === parsedUser.accountId ||
        item.username === parsedUser.username
    );

    if (!account) {
      return null;
    }

    const expiryDate = new Date(account.expiresAt);

    const expired =
      Number.isNaN(expiryDate.getTime()) ||
      expiryDate.getTime() < Date.now();

    return {
      userName: account.name,
      role: "Scoring Incharge",
      assignedEventIds: Array.isArray(account.assignedEventIds)
        ? account.assignedEventIds
        : [],
      accessType: "Temporary",
      active: account.isActive === true,
      expired,
    };
  } catch {
    return null;
  }
}

export function isInchargeAuthorized(): boolean {
  const access = getCurrentInchargeAccess();

  return (
    access !== null &&
    access.role === "Scoring Incharge" &&
    access.accessType === "Temporary" &&
    access.active &&
    !access.expired
  );
}

export function canAccessEvent(eventId: string): boolean {
  if (!eventId.trim() || !isInchargeAuthorized()) {
    return false;
  }

  const access = getCurrentInchargeAccess();

  return access !== null && access.assignedEventIds.includes(eventId);
}

export function canScoreEvent(eventId: string): boolean {
  return isInchargeAuthorized() && canAccessEvent(eventId);
}