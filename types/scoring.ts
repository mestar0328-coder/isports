import type { ScoringEngine, SportEvent } from "@/types/events";

export type ScoreStatus =
  | "draft"
  | "submitted"
  | "locked";

export type ScoreSide = {
  id: string;
  name: string;
  score: number;
};

export type ScoreAuditEntry = {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
};

export type CricketDelivery = {
  id: string;
  innings: number;
  over: number;
  ball: number;

  batterId?: string;
  bowlerId?: string;

  batRuns: number;
  extraRuns: number;

  extraType?:
    | "wide"
    | "no-ball"
    | "bye"
    | "leg-bye"
    | "penalty";

  isWicket: boolean;

  wicketType?:
    | "bowled"
    | "caught"
    | "lbw"
    | "run-out"
    | "stumped"
    | "hit-wicket"
    | "retired-out"
    | "other";

  dismissedPlayerId?: string;

  timestamp: string;
};

export type CricketInnings = {
  inningsNumber: number;
  battingTeamId: string;

  runs: number;
  wickets: number;

  legalBalls: number;
  completed: boolean;

  deliveries: CricketDelivery[];
  target?: number;
};

export type CricketScore = {
  innings: CricketInnings[];
  totalOvers: number;
  target?: number;
  winnerTeamId?: string;
  result?: string;
};

export type InningRunsScore = {
  inningsCount: number;

  teamA: number[];
  teamB: number[];

  winnerTeamId?: string;
};

export type CombatScore = {
  teamOrAthleteA: number;
  teamOrAthleteB: number;

  penaltiesA: number;
  penaltiesB: number;

  disqualifiedA: boolean;
  disqualifiedB: boolean;

  winnerId?: string;
  result?: string;
};

export type JudgeRound = {
  round: number;

  judgeScoresA: number[];
  judgeScoresB: number[];

  winnerA: number;
  winnerB: number;
};

export type JudgeRoundsScore = {
  rounds: JudgeRound[];
  winnerId?: string;
  result?: string;
};

export type JudgedPerformanceScore = {
  difficulty: number;
  execution: number;
  deductions: number;

  finalScore: number;
};

export type TargetScore = {
  athleteId: string;

  rounds: number[][];
  total: number;
};

export type BowlingFrame = {
  rolls: number[];
  score: number;
  notation?: string;
};

export type BowlingScore = {
  frames: BowlingFrame[];
  total: number;
};

export type GolfScore = {
  mode: "stroke-play" | "match-play";

  strokesByHole: number[];
  parByHole: number[];

  totalStrokes: number;
  totalPar: number;

  relativeToPar: number;
  holesWon?: number;
  holesLost?: number;
};

export type RaceScore = {
  athleteId: string;
  elapsedMilliseconds: number;
  finishPosition?: number;
};

export type DistanceHeightScore = {
  athleteId: string;
  attempts: number[];
  bestResult: number;
};

export type RallySetsScore = {
  sets: {
    sideA: number;
    sideB: number;
  }[];

  gamesWonA: number;
  gamesWonB: number;

  winnerId?: string;
};

export type StrengthScore = {
  athleteId: string;
  attempts: number[];
  bestResult: number;
};

export type MultiEventScore = {
  athleteId: string;

  eventScores: {
    eventId: string;
    score: number;
    points: number;
  }[];

  totalPoints: number;
};

export type GenericScore = {
  values: Record<string, unknown>;
  sides?: ScoreSide[];
  winnerId?: string;
  result?: string;
};

export type SportScoreData =
  | CricketScore
  | InningRunsScore
  | CombatScore
  | JudgeRoundsScore
  | JudgedPerformanceScore
  | TargetScore
  | BowlingScore
  | GolfScore
  | RaceScore
  | DistanceHeightScore
  | RallySetsScore
  | StrengthScore
  | MultiEventScore
  | GenericScore;

export type EventScoreRecord = {
  id: string;
  eventId: string;

  sportId?: string;
  scoringEngine: ScoringEngine;

  status: ScoreStatus;

  data: SportScoreData;

  createdAt: string;
  updatedAt: string;

  submittedAt?: string;
  lockedAt?: string;

  submittedBy?: string;
  lockedBy?: string;

  auditLog: ScoreAuditEntry[];
};

export type ScoringEventReference = Pick<
  SportEvent,
  | "id"
  | "sport"
  | "sportId"
  | "scoringEngine"
  | "scoringMethod"
  | "scoringConfig"
>;