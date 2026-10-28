import type { SportEvent, ScoringEngine } from "@/types/events";
import { findScoringEngineForSport } from "@/lib/scoring/registry";

const STORAGE_KEY = "isports_events";

// Resolve an event's scoring engine when one has not been selected.
export function getEventScoringEngine(
event: SportEvent
): ScoringEngine {
if (event.scoringEngine) {
return event.scoringEngine;
}

if (event.scoringMethod) {
const methodToEngine: Partial<
Record<
NonNullable<SportEvent["scoringMethod"]>,
ScoringEngine
>
> = {
time: "time-race",
distance: "distance-height",
height: "distance-height",
points: "goal-points",
goals: "goal-points",
runs:
event.sport.trim().toLowerCase() === "cricket"
? "cricket"
: "inning-runs",
sets: "rally-sets",
"win-draw-loss": "goal-points",
manual: "custom",
"rally-points": "rally-sets",
innings: "inning-runs",
cricket: "cricket",
"combat-points": "combat-points",
"judge-rounds": "judge-rounds",
"judged-performance": "judged-performance",
"target-shots": "target-precision",
"bowling-frames": "bowling",
"golf-strokes": "golf",
"strength-repetitions": "strength-performance",
"multi-event": "multi-event",
"match-play": "golf",
"digital-match": "digital-match",
};

const mappedEngine = methodToEngine[event.scoringMethod];

if (mappedEngine) {
  return mappedEngine;
}

}

return findScoringEngineForSport(event.sport)?.id ?? "custom";
}

// Get all events.
export const getEvents = (): SportEvent[] => {
if (typeof window === "undefined") {
return [];
}

try {
const stored = localStorage.getItem(STORAGE_KEY);

if (!stored) {
  return [];
}

const parsed: unknown = JSON.parse(stored);

if (!Array.isArray(parsed)) {
  return [];
}

return parsed as SportEvent[];

} catch (error) {
console.error("Unable to read events:", error);
return [];
}
};

// Add an event.
export const addEvent = (event: SportEvent): void => {
if (typeof window === "undefined") {
return;
}

if (!event.id?.trim()) {
throw new Error("An event ID is required.");
}

const events = getEvents();

if (events.some((existing) => existing.id === event.id)) {
throw new Error("An event with this ID already exists.");
}

const eventWithEngine: SportEvent = {
...event,
scoringEngine: getEventScoringEngine(event),
};

localStorage.setItem(
STORAGE_KEY,
JSON.stringify([...events, eventWithEngine])
);
};

// Delete an event.
export const deleteEvent = (id: string): void => {
if (typeof window === "undefined") {
return;
}

const updatedEvents = getEvents().filter(
(event) => event.id !== id
);

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(updatedEvents)
);
};

// Get one event.
export const getEventById = (
id: string
): SportEvent | null => {
return getEvents().find((event) => event.id === id) ?? null;
};

// Compatibility alias.
export const getAllEvents = getEvents;

// Update an event while retaining its scoring engine.
export const updateEvent = (updatedEvent: SportEvent): void => {
if (typeof window === "undefined") {
return;
}

const events = getEvents();
const existingEvent = events.find(
(event) => event.id === updatedEvent.id
);

if (!existingEvent) {
throw new Error("Event not found.");
}

const eventWithEngine: SportEvent = {
...updatedEvent,
scoringEngine:
updatedEvent.scoringEngine ??
existingEvent.scoringEngine ??
getEventScoringEngine(updatedEvent),
};

const updatedEvents = events.map((event) =>
event.id === eventWithEngine.id ? eventWithEngine : event
);

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(updatedEvents)
);
};