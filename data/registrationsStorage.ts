export type Registration = {
  id: string;
  eventId: string;
  playerName: string;
  createdAt: string;
};

const STORAGE_KEY = "isports-registrations";

export function getRegistrations(): Registration[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as Registration[];
  } catch {
    return [];
  }
}

export function addRegistration(
  registration: Registration
): void {
  const registrations = getRegistrations();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      ...registrations,
      registration,
    ])
  );
}

export function isRegistered(eventId: string): boolean {
  return getRegistrations().some(
    (registration) =>
      registration.eventId === eventId
  );
}

// Get all registrations for one event
export function getRegistrationsByEvent(
  eventId: string
): Registration[] {
  return getRegistrations().filter(
    (registration) =>
      registration.eventId === eventId
  );
}