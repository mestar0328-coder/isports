import type { StudentAccount } from "@/types/studentAccount";
 
const STORAGE_KEY = "isports_student_accounts";
 
export function getStudentAccounts(): StudentAccount[] {
  if (typeof window === "undefined") return [];
 
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
 
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StudentAccount[]) : [];
  } catch {
    return [];
  }
}
 
export function createStudentAccount(
  account: StudentAccount
): { success: true } | { success: false; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Registration is available in the browser only." };
  }
 
  const accounts = getStudentAccounts();
  const emailExists = accounts.some(
    (item) => item.email.toLowerCase() === account.email.toLowerCase()
  );
  if (emailExists) {
    return { success: false, message: "An account with this email already exists." };
  }
 
  const mobileExists = accounts.some(
    (item) => item.mobileNumber === account.mobileNumber
  );
  if (mobileExists) {
    return { success: false, message: "An account with this mobile number already exists." };
  }
 
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...accounts, account]));
    return { success: true };
  } catch {
    return {
      success: false,
      message: "Unable to save the account. The browser may be out of storage space.",
    };
  }
}

 