import {
  registrations,
  type Registration,
} from "./registrations";

const STORAGE_KEY = "isports_registrations";

export function getRegistrations(): Registration[] {
  if (typeof window === "undefined") {
    return registrations;
  }

  const savedRegistrations =
    localStorage.getItem(STORAGE_KEY);

  if (!savedRegistrations) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(registrations)
    );

    return registrations;
  }

  try {
    return JSON.parse(savedRegistrations);
  } catch {
    return [];
  }
}

export function saveRegistrations(
  registrationsList: Registration[]
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(registrationsList)
  );
}

export function hasRegistered(
  applicantName: string,
  eventId: string
): boolean {
  const currentRegistrations =
    getRegistrations();

  return currentRegistrations.some(
    (registration) =>
      registration.eventId === eventId &&
      registration.applicantName.trim().toLowerCase() ===
        applicantName.trim().toLowerCase()
  );
}

export function addRegistration(
  registration: Registration
) {
  const currentRegistrations =
    getRegistrations();

  const updatedRegistrations = [
    ...currentRegistrations,
    registration,
  ];

  saveRegistrations(updatedRegistrations);

  return updatedRegistrations;
}

export function updateRegistrationStatus(
  id: string,
  status: Registration["status"]
) {
  const currentRegistrations =
    getRegistrations();

  const updatedRegistrations =
    currentRegistrations.map((registration) =>
      registration.id === id
        ? {
            ...registration,
            status,
          }
        : registration
    );

  saveRegistrations(updatedRegistrations);

  return updatedRegistrations;
}