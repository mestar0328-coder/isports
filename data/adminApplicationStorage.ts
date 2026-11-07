import type { AdminApplication } from "@/types/adminApplication";
 
const STORAGE_KEY = "isports_admin_applications";
 
export function getAdminApplications(): AdminApplication[] {
  if (typeof window === "undefined") return [];
 
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminApplication[]) : [];
  } catch {
    return [];
  }
}
 
export function createAdminApplication(
  application: AdminApplication
): { success: true } | { success: false; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Applications can be submitted in the browser only." };
  }
 
  const applications = getAdminApplications();
  const emailExists = applications.some(
    (item) => item.officialEmail.toLowerCase() === application.officialEmail.toLowerCase()
  );
  if (emailExists) {
    return { success: false, message: "An application with this official email already exists." };
  }
 
  const mobileExists = applications.some(
    (item) => item.mobileNumber === application.mobileNumber
  );
  if (mobileExists) {
    return { success: false, message: "An application with this mobile number already exists." };
  }
 
  const staffIdExists = applications.some(
    (item) =>
      item.staffId.toLowerCase() === application.staffId.toLowerCase() &&
      item.collegeName.toLowerCase() === application.collegeName.toLowerCase()
  );
  if (staffIdExists) {
    return { success: false, message: "An application with this Staff ID already exists for this college." };
  }
 
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...applications, application]));
    return { success: true };
  } catch {
    return {
      success: false,
      message: "Unable to save the application. The selected files may exceed browser storage capacity.",
    };
  }
}
 
 
export function reviewAdminApplication(
  id: string,
  status: "Approved" | "Rejected",
  reviewedBy: string,
  reviewNote: string
): { success: true; application: AdminApplication } | { success: false; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Applications can be reviewed in the browser only." };
  }
 
  const applications = getAdminApplications();
  const index = applications.findIndex((item) => item.id === id);
  if (index < 0) {
    return { success: false, message: "The application could not be found. Refresh the page." };
  }
 
  const updated: AdminApplication = {
    ...applications[index],
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy,
    reviewNote: reviewNote.trim(),
  };
  const next = [...applications];
  next[index] = updated;
 
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { success: true, application: updated };
  } catch {
    return { success: false, message: "Unable to save the review. Browser storage may be full." };
  }
}
