import { getInChargeAccounts } from "./inchargeStorage";

export type InchargeAccess = {
  userName: string;
  role: "Scoring Incharge";
  assignedEventIds: string[];
  accessType: "Temporary";
  active: boolean;
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

    if (parsedUser.role !== "incharge") {
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

    return {
      userName: account.name,
      role: "Scoring Incharge",
      assignedEventIds:
        account.assignedEventIds || [],
      accessType: "Temporary",
      active: account.isActive,
    };
  } catch {
    return null;
  }
}

export function isInchargeAuthorized(): boolean {
  const access = getCurrentInchargeAccess();

  if (!access) {
    return false;
  }

  return (
    access.role === "Scoring Incharge" &&
    access.accessType === "Temporary" &&
    access.active
  );
}

export function canAccessEvent(
  eventId: string
): boolean {
  const access = getCurrentInchargeAccess();

  if (!access) {
    return false;
  }

  return (
    access.assignedEventIds.includes(eventId)
  );
}