import type { ScoringEngine } from "@/types/events";
import type { SportScoreData } from "@/types/scoring";

export function createInitialScore(
engine: ScoringEngine,
configuration: Record<string, unknown> = {}
): SportScoreData {
switch (engine) {
case "cricket":
return {
innings: [],
totalOvers: 0,
...configuration,
} as SportScoreData;

case "inning-runs":
  return {
    inningsCount: 9,
    teamA: Array(9).fill(0),
    teamB: Array(9).fill(0),
    ...configuration,
  } as SportScoreData;

case "combat-points":
  return {
    teamOrAthleteA: 0,
    teamOrAthleteB: 0,
    penaltiesA: 0,
    penaltiesB: 0,
    disqualifiedA: false,
    disqualifiedB: false,
    ...configuration,
  } as SportScoreData;

case "judge-rounds":
  return {
    rounds: [],
    ...configuration,
  } as SportScoreData;

case "judged-performance":
  return {
    difficulty: 0,
    execution: 0,
    deductions: 0,
    finalScore: 0,
    ...configuration,
  } as SportScoreData;

case "target-precision":
  return {
    athleteId: "",
    rounds: [],
    total: 0,
    ...configuration,
  } as SportScoreData;

case "bowling":
  return {
    frames: Array.from({ length: 10 }, () => ({
      rolls: [],
      score: 0,
    })),
    total: 0,
    ...configuration,
  } as SportScoreData;

case "golf":
  return {
    mode: "stroke-play",
    strokesByHole: Array(18).fill(0),
    parByHole: Array(18).fill(4),
    totalStrokes: 0,
    totalPar: 72,
    relativeToPar: 0,
    ...configuration,
  } as SportScoreData;

case "time-race":
  return {
    athleteId: "",
    elapsedMilliseconds: 0,
    ...configuration,
  } as SportScoreData;

case "distance-height":
  return {
    athleteId: "",
    attempts: [],
    bestResult: 0,
    ...configuration,
  } as SportScoreData;

case "rally-sets":
  return {
    sets: [],
    gamesWonA: 0,
    gamesWonB: 0,
    ...configuration,
  } as SportScoreData;

case "strength-performance":
  return {
    athleteId: "",
    attempts: [],
    bestResult: 0,
    ...configuration,
  } as SportScoreData;

case "multi-event":
  return {
    athleteId: "",
    eventScores: [],
    totalPoints: 0,
    ...configuration,
  } as SportScoreData;

case "goal-points":
case "digital-match":
case "custom":
default:
  return {
    values: {},
    sides: [
      { id: "A", name: "Side A", score: 0 },
      { id: "B", name: "Side B", score: 0 },
    ],
    ...configuration,
  } as SportScoreData;

}
}