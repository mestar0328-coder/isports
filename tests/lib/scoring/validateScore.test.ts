import { describe, expect, it } from "vitest";
import { validateScore } from "@/lib/validateScore";

describe("Score validation", () => {
  describe("Common validation", () => {
    it("rejects null data", () => {
      const result = validateScore("goal-points", null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Score data must be a valid object."
      );
    });

    it("rejects array data", () => {
      const result = validateScore("goal-points", []);

      expect(result.valid).toBe(false);
    });

    it("rejects non-object data", () => {
      const result = validateScore("goal-points", "invalid");

      expect(result.valid).toBe(false);
    });
  });

  describe("Goal points", () => {
    it("accepts valid score values", () => {
      const result = validateScore("goal-points", {
        values: { teamA: 2, teamB: 1 },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects missing score values", () => {
      const result = validateScore("goal-points", {});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Score values must be an object."
      );
    });

    it("rejects invalid side scores", () => {
      const result = validateScore("goal-points", {
        values: {},
        sides: [
          {
            id: "A",
            name: "Team A",
            score: -5,
          },
        ],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Side 1 must have a valid score."
      );
    });

    it("rejects an invalid winner ID", () => {
      const result = validateScore("goal-points", {
        values: {},
        winnerId: 123,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Rally and sets", () => {
    it("accepts valid set scores", () => {
      const result = validateScore("rally-sets", {
        sets: [
          { sideA: 21, sideB: 18 },
          { sideA: 21, sideB: 15 },
        ],
        gamesWonA: 2,
        gamesWonB: 0,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects negative set scores", () => {
      const result = validateScore("rally-sets", {
        sets: [{ sideA: -1, sideB: 18 }],
        gamesWonA: 1,
        gamesWonB: 0,
      });

      expect(result.valid).toBe(false);
    });

    it("rejects missing sets", () => {
      const result = validateScore("rally-sets", {
        gamesWonA: 1,
        gamesWonB: 0,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Time and race", () => {
    it("accepts a valid race result", () => {
      const result = validateScore("time-race", {
        athleteId: "athlete-1",
        elapsedMilliseconds: 12500,
        finishPosition: 1,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects negative elapsed time", () => {
      const result = validateScore("time-race", {
        athleteId: "athlete-1",
        elapsedMilliseconds: -100,
      });

      expect(result.valid).toBe(false);
    });

    it("rejects an invalid finish position", () => {
      const result = validateScore("time-race", {
        athleteId: "athlete-1",
        elapsedMilliseconds: 12500,
        finishPosition: 0,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Distance and strength", () => {
    it("accepts valid attempts", () => {
      const result = validateScore("distance-height", {
        athleteId: "athlete-1",
        attempts: [5.2, 5.5, 5.8],
        bestResult: 5.8,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects invalid attempts", () => {
      const result = validateScore("strength-performance", {
        athleteId: "athlete-1",
        attempts: [100, -20, 120],
        bestResult: 120,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Cricket", () => {
    it("accepts valid innings data", () => {
      const result = validateScore("cricket", {
        innings: [
          {
            runs: 150,
            wickets: 5,
            legalBalls: 120,
            deliveries: [],
            completed: true,
          },
        ],
        totalOvers: 20,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects invalid innings data", () => {
      const result = validateScore("cricket", {
        innings: [
          {
            runs: -10,
            wickets: 5,
            legalBalls: 120,
            deliveries: [],
            completed: true,
          },
        ],
        totalOvers: 20,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Inning runs", () => {
    it("accepts matching team score arrays", () => {
      const result = validateScore("inning-runs", {
        inningsCount: 2,
        teamA: [100, 120],
        teamB: [90, 110],
      });

      expect(result.valid).toBe(true);
    });

    it("rejects mismatched innings arrays", () => {
      const result = validateScore("inning-runs", {
        inningsCount: 2,
        teamA: [100],
        teamB: [90, 110],
      });

      expect(result.valid).toBe(false);
    });

    it("rejects a non-positive innings count", () => {
      const result = validateScore("inning-runs", {
        inningsCount: 0,
        teamA: [],
        teamB: [],
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Combat points", () => {
    it("accepts valid combat scores", () => {
      const result = validateScore("combat-points", {
        teamOrAthleteA: 10,
        teamOrAthleteB: 8,
        penaltiesA: 1,
        penaltiesB: 0,
        disqualifiedA: false,
        disqualifiedB: false,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects invalid disqualification status", () => {
      const result = validateScore("combat-points", {
        teamOrAthleteA: 10,
        teamOrAthleteB: 8,
        penaltiesA: 1,
        penaltiesB: 0,
        disqualifiedA: "no",
        disqualifiedB: false,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Judge rounds", () => {
    it("accepts valid judge rounds", () => {
      const result = validateScore("judge-rounds", {
        rounds: [
          {
            round: 1,
            judgeScoresA: [9, 10, 9],
            judgeScoresB: [8, 8, 9],
            winnerA: true,
            winnerB: false,
          },
        ],
      });

      expect(result.valid).toBe(true);
    });

    it("rejects invalid judge scores", () => {
      const result = validateScore("judge-rounds", {
        rounds: [
          {
            round: 1,
            judgeScoresA: [9, -1, 9],
            judgeScoresB: [8, 8, 9],
            winnerA: true,
            winnerB: false,
          },
        ],
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Judged performance", () => {
    it("accepts valid performance scores", () => {
      const result = validateScore("judged-performance", {
        difficulty: 8,
        execution: 9,
        deductions: 1,
        finalScore: 16,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects negative deductions", () => {
      const result = validateScore("judged-performance", {
        difficulty: 8,
        execution: 9,
        deductions: -1,
        finalScore: 16,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Target precision", () => {
    it("accepts valid target scores", () => {
      const result = validateScore("target-precision", {
        athleteId: "athlete-1",
        rounds: [
          [10, 9, 8],
          [10, 10, 9],
        ],
        total: 56,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects negative target scores", () => {
      const result = validateScore("target-precision", {
        athleteId: "athlete-1",
        rounds: [[10, -2, 8]],
        total: 16,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Bowling", () => {
    it("accepts valid bowling data", () => {
      const result = validateScore("bowling", {
        frames: [
          {
            rolls: [10],
            score: 20,
            notation: "X",
          },
        ],
        total: 20,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects invalid bowling rolls", () => {
      const result = validateScore("bowling", {
        frames: [
          {
            rolls: [-1, 5],
            score: 4,
          },
        ],
        total: 4,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Golf", () => {
    it("accepts a valid stroke-play result", () => {
      const result = validateScore("golf", {
        mode: "stroke-play",
        strokesByHole: [4, 3, 5],
        parByHole: [4, 4, 5],
        totalStrokes: 12,
        totalPar: 13,
        relativeToPar: -1,
      });

      expect(result.valid).toBe(true);
    });

    it("accepts a positive relative-to-par result", () => {
      const result = validateScore("golf", {
        mode: "stroke-play",
        strokesByHole: [5, 5],
        parByHole: [4, 4],
        totalStrokes: 10,
        totalPar: 8,
        relativeToPar: 2,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects mismatched golf arrays", () => {
      const result = validateScore("golf", {
        mode: "stroke-play",
        strokesByHole: [4, 5],
        parByHole: [4],
        totalStrokes: 9,
        totalPar: 4,
        relativeToPar: 5,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Multi-event", () => {
    it("accepts valid multi-event results", () => {
      const result = validateScore("multi-event", {
        athleteId: "athlete-1",
        eventScores: [
          {
            eventId: "event-1",
            score: 100,
            points: 50,
          },
        ],
        totalPoints: 50,
      });

      expect(result.valid).toBe(true);
    });

    it("rejects missing event IDs", () => {
      const result = validateScore("multi-event", {
        athleteId: "athlete-1",
        eventScores: [
          {
            eventId: "",
            score: 100,
            points: 50,
          },
        ],
        totalPoints: 50,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Other engines", () => {
    it("accepts valid digital-match data", () => {
      const result = validateScore("digital-match", {
        values: {
          teamA: 2,
          teamB: 1,
        },
      });

      expect(result.valid).toBe(true);
    });

    it("accepts valid custom scoring data", () => {
      const result = validateScore("custom", {
        values: {
          participantA: 10,
          participantB: 8,
        },
      });

      expect(result.valid).toBe(true);
    });
  });
});