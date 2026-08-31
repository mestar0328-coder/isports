import type { SportsEvent } from "@/types/sports";

const STORAGE_KEY = "isports_events";

// Get all custom events
export const getCustomEvents = (): SportsEvent[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedEvents = localStorage.getItem(STORAGE_KEY);

  if (!storedEvents) {
    return [];
  }

  return JSON.parse(storedEvents);
};

// Save a new custom event
export const addCustomEvent = (
  event: SportsEvent
) => {
  const existingEvents = getCustomEvents();

  const updatedEvents = [
    ...existingEvents,
    event,
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedEvents)
  );
};

// Get sample + custom events together
export const getAllEvents = (
  sampleEvents: SportsEvent[]
): SportsEvent[] => {
  const customEvents = getCustomEvents();

  return [
    ...sampleEvents,
    ...customEvents,
  ];
};