import type { SportEvent } from "@/types/events";

const STORAGE_KEY = "isports_events";

// Get all events
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

// Add an event
export const addEvent = (event: SportEvent): void => {
  if (typeof window === "undefined") {
    return;
  }

  const events = getEvents();

  const updatedEvents = [...events, event];

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

  const events = getEvents();

  const updatedEvents = events.filter(
    (event) => event.id !== id
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedEvents)
  );
};

// Get one event
export const getEventById = (
  id: string
): SportEvent | null => {
  const events = getEvents();

  return (
    events.find((event) => event.id === id) ?? null
  );
};
// Compatibility alias
export const getAllEvents = getEvents;

export const updateEvent = (updatedEvent: SportEvent): void => {
  if (typeof window === "undefined") return;

  const events = getEvents();

  const updatedEvents = events.map((event) =>
    event.id === updatedEvent.id ? updatedEvent : event
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
};