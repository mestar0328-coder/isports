import type { ScoringEngine } from "@/types/events";

export type ScoringEngineDefinition = {
id: ScoringEngine;
name: string;
description: string;
sports: string[];
};

export const SCORING_ENGINES: ScoringEngineDefinition[] = [
{
id: "goal-points",
name: "Goals & Points",
description: "Goals, points, penalties, match clock, and results.",
sports: [
"Football",
"Soccer",
"Hockey",
"Basketball",
"Handball",
"Rugby",
"Kabaddi",
"Water Polo",
],
},
{
id: "rally-sets",
name: "Rally & Sets",
description: "Rallies, games, sets, tie-breaks, and match results.",
sports: [
"Badminton",
"Tennis",
"Table Tennis",
"Volleyball",
"Squash",
"Pickleball",
],
},
{
id: "time-race",
name: "Time & Race",
description: "Race timing, heats, finish positions, and rankings.",
sports: [
"Athletics",
"Swimming",
"Cycling",
"Marathon",
"Speed Skating",
"Rowing",
],
},
{
id: "distance-height",
name: "Distance & Height",
description: "Attempts, distances, heights, and best performances.",
sports: [
"Long Jump",
"Triple Jump",
"High Jump",
"Pole Vault",
"Shot Put",
"Javelin",
"Discus",
],
},
{
id: "cricket",
name: "Cricket",
description: "Runs, wickets, overs, balls, extras, and innings.",
sports: ["Cricket"],
},
{
id: "inning-runs",
name: "Inning Runs",
description: "Team runs by inning and inning-by-inning results.",
sports: ["Baseball", "Softball"],
},
{
id: "combat-points",
name: "Combat Points",
description: "Points, penalties, disqualification, and match outcomes.",
sports: [
"Karate",
"Taekwondo",
"Judo",
"Wrestling",
"Fencing",
],
},
{
id: "judge-rounds",
name: "Judge Rounds",
description: "Judge-by-judge scores for each round.",
sports: ["Boxing", "MMA"],
},
{
id: "judged-performance",
name: "Judged Performance",
description: "Difficulty, execution, deductions, and final scores.",
sports: [
"Gymnastics",
"Rhythmic Gymnastics",
"Figure Skating",
"Diving",
],
},
{
id: "target-precision",
name: "Target & Precision",
description: "Shots, target values, rounds, and accumulated scores.",
sports: ["Archery", "Shooting", "Darts"],
},
{
id: "bowling",
name: "Bowling",
description: "Frame-by-frame rolls, strikes, spares, and totals.",
sports: ["Ten-pin Bowling"],
},
{
id: "golf",
name: "Golf",
description: "Stroke play, match play, holes, and scores relative to par.",
sports: ["Golf"],
},
{
id: "strength-performance",
name: "Strength & Performance",
description: "Attempts, lifted weights, repetitions, and records.",
sports: ["Weightlifting", "Powerlifting", "Fitness"],
},
{
id: "multi-event",
name: "Multi-Event",
description: "Combined results and points across multiple events.",
sports: [
"Decathlon",
"Heptathlon",
"Triathlon",
"Pentathlon",
],
},
{
id: "digital-match",
name: "Digital Match",
description: "Configurable rounds, maps, match points, and results.",
sports: ["Esports"],
},
{
id: "custom",
name: "Custom Scoring",
description: "Configurable scoring for other sports and competitions.",
sports: [],
},
];

export function getScoringEngines(): ScoringEngineDefinition[] {
return [...SCORING_ENGINES];
}

export function getScoringEngineById(
id: string
): ScoringEngineDefinition | undefined {
return SCORING_ENGINES.find((engine) => engine.id === id);
}

export function findScoringEngineForSport(
sportName: string
): ScoringEngineDefinition | undefined {
const normalizedName = sportName.trim().toLowerCase();

return SCORING_ENGINES.find((engine) =>
engine.sports.some(
(sport) => sport.toLowerCase() === normalizedName
)
);
}