import type { SportEvent, ScoringEngine } from "@/types/events";
import { resolveScoringEngine } from "@/lib/scoring/resolveEngine";

const STORAGE_KEY = "isports_events";
export function getEventScoringEngine(event: SportEvent): ScoringEngine {
  return resolveScoringEngine(event);
}
export const getEvents = (): SportEvent[] => {
  if (typeof window === "undefined") return [];
  try {
    const v: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(v) ? v as SportEvent[] : [];
  } catch (e) { console.error("Unable to read events:", e); return []; }
};
export const addEvent = (event: SportEvent): void => {
  if (typeof window === "undefined") return;
  if (!event.id?.trim()) throw new Error("An event ID is required.");
  const events = getEvents();
  if (events.some(x => x.id === event.id)) throw new Error("An event with this ID already exists.");
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...events, { ...event, scoringEngine: resolveScoringEngine(event) }]));
};
export const deleteEvent = (id: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getEvents().filter(x => x.id !== id)));
};
export const getEventById = (id: string): SportEvent | null => getEvents().find(x => x.id === id) ?? null;
export const getAllEvents = getEvents;
export const updateEvent = (updated: SportEvent): void => {
  if (typeof window === "undefined") return;
  const events = getEvents();
  const old = events.find(x => x.id === updated.id);
  if (!old) throw new Error("Event not found.");
  const next = { ...updated, scoringEngine: updated.scoringEngine ?? old.scoringEngine ?? resolveScoringEngine(updated) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.map(x => x.id === next.id ? next : x)));
};
