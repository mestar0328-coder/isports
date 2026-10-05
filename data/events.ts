import type { SportEvent } from "@/types/events";

const STORAGE_KEY = "isports_events";

// Default event used by the scoring pages
export const events: SportEvent[] = [
  {
    id: "event-1",
    name: "iSports Tournament",
    sportId: "football",
    sport: "Football",
    rules: [
      "Play fair and respect referees and opponents.",
      "All matches must be held within the scheduled time.",
    ],
    eligibility: [
      "Open to all registered participants and teams.",
    ],
    registrationDeadline: "2026-10-01",
    registrationType: "team",
    description:
      "Official iSports tournament event with live match scoring and results.",
    venue: "Main Sports Ground",
    date: "2026-10-05",
  },
];

// Get all stored events
export const getEvents = (): SportEvent[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as SportEvent[];
  } catch {
    return [];
  }
};

// Add a new event
export const addEvent = (event: SportEvent): void => {
  if (typeof window === "undefined") {
    return;
  }

  const storedEvents = getEvents();

  const updatedEvents = [...storedEvents, event];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedEvents)
  );
};

// Delete an event
export const deleteEvent = (id: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  const storedEvents = getEvents();

  const updatedEvents = storedEvents.filter(
    (event) => event.id !== id
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedEvents)
  );
};

// Get one event by ID
export const getEventById = (
  id: string
): SportEvent | null => {
  const storedEvents = getEvents();

  return (
    storedEvents.find((event) => event.id === id) ?? null
  );
};

// Update an existing event
export const updateEvent = (
  updatedEvent: SportEvent
): void => {
  if (typeof window === "undefined") {
    return;
  }

  const storedEvents = getEvents();

  const updatedEvents = storedEvents.map((event) =>
    event.id === updatedEvent.id
      ? updatedEvent
      : event
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedEvents)
  );
};

// Compatibility alias
export const getAllEvents = getEvents;