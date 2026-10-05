import { inchargeAccounts } from "./incharges.ts";
import type { InChargeAccount } from "./incharges.ts";

const STORAGE_KEY = "isports_incharge_accounts";

export function getInChargeAccounts(): InChargeAccount[] {
  if (typeof window === "undefined") {
    return inchargeAccounts;
  }

  const savedAccounts = localStorage.getItem(STORAGE_KEY);

  if (!savedAccounts) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(inchargeAccounts)
    );

    return inchargeAccounts;
  }

  try {
    return JSON.parse(savedAccounts);
  } catch {
    return [];
  }
}

export function saveInChargeAccounts(
  accounts: InChargeAccount[]
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(accounts)
  );
}

export function addInChargeAccount(
  account: InChargeAccount
) {
  const currentAccounts = getInChargeAccounts();

  const updatedAccounts = [
    ...currentAccounts,
    account,
  ];

  saveInChargeAccounts(updatedAccounts);

  return updatedAccounts;
}

export function updateInChargeAccount(
  id: string,
  updates: Partial<InChargeAccount>
) {
  const currentAccounts = getInChargeAccounts();

  const updatedAccounts = currentAccounts.map(
    (account) =>
      account.id === id
        ? { ...account, ...updates }
        : account
  );

  saveInChargeAccounts(updatedAccounts);

  return updatedAccounts;
}

export function deleteInChargeAccount(id: string) {
  const currentAccounts = getInChargeAccounts();

  const updatedAccounts = currentAccounts.filter(
    (account) => account.id !== id
  );

  saveInChargeAccounts(updatedAccounts);

  return updatedAccounts;
}