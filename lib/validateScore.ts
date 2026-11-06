import type { ScoringEngine } from "@/types/events";

// --------------------------------------------------
// VALIDATION RESULT
// --------------------------------------------------

export type ScoreValidationResult = {
  valid: boolean;
  errors: string[];
};

// --------------------------------------------------
// COMMON HELPERS
// --------------------------------------------------

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonNegativeNumber(
  value: unknown
): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumberArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(isNonNegativeNumber)
  );
}

function isStringOrUndefined(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isBoolean(value: unknown): boolean {
  return typeof value === "boolean";
}

// --------------------------------------------------
// MAIN VALIDATOR
// --------------------------------------------------

export function validateScore(
  engine: ScoringEngine,
  data: unknown
): ScoreValidationResult {
  const errors: string[] = [];

  if (!isRecord(data)) {
    return {
      valid: false,
      errors: ["Score data must be a valid object."],
    };
  }

  switch (engine) {

    // ----------------------------------------------
    // GOALS / POINTS
    // ----------------------------------------------

    case "goal-points":
    case "digital-match":
    case "custom": {
      if (!isRecord(data.values)) {
        errors.push("Score values must be an object.");
      }

      if (data.sides !== undefined) {
        if (!Array.isArray(data.sides)) {
          errors.push("Sides must be an array.");
        } else {
          data.sides.forEach((side, index) => {
            if (!isRecord(side)) {
              errors.push(`Side ${index + 1} must be an object.`);
              return;
            }

            if (!isString(side.id) || !side.id.trim()) {
              errors.push(`Side ${index + 1} must have an ID.`);
            }

            if (!isString(side.name) || !side.name.trim()) {
              errors.push(`Side ${index + 1} must have a name.`);
            }

            if (!isNonNegativeNumber(side.score)) {
              errors.push(
                `Side ${index + 1} must have a valid score.`
              );
            }
          });
        }
      }

      if (!isStringOrUndefined(data.winnerId)) {
        errors.push("Winner ID must be a string.");
      }

      break;
    }

    // ----------------------------------------------
    // RALLY / SETS
    // ----------------------------------------------

    case "rally-sets": {
      if (!Array.isArray(data.sets)) {
        errors.push("Sets must be an array.");
        break;
      }

      data.sets.forEach((set, index) => {
        if (!isRecord(set)) {
          errors.push(`Set ${index + 1} must be an object.`);
          return;
        }

        if (!isNonNegativeNumber(set.sideA)) {
          errors.push(`Set ${index + 1} has an invalid Side A score.`);
        }

        if (!isNonNegativeNumber(set.sideB)) {
          errors.push(`Set ${index + 1} has an invalid Side B score.`);
        }
      });

      if (!isNonNegativeNumber(data.gamesWonA)) {
        errors.push("Side A games won must be a valid number.");
      }

      if (!isNonNegativeNumber(data.gamesWonB)) {
        errors.push("Side B games won must be a valid number.");
      }

      break;
    }

    // ----------------------------------------------
    // TIME / RACE
    // ----------------------------------------------

    case "time-race": {
      if (!isString(data.athleteId)) {
        errors.push("Athlete ID must be a string.");
      }

      if (!isNonNegativeNumber(data.elapsedMilliseconds)) {
        errors.push("Elapsed time must be a valid non-negative number.");
      }

      if (
        data.finishPosition !== undefined &&
        (
          typeof data.finishPosition !== "number" ||
          !Number.isInteger(data.finishPosition) ||
          data.finishPosition <= 0
        )
      ) {
        errors.push("Finish position must be a positive integer.");
      }

      break;
    }

    // ----------------------------------------------
    // DISTANCE / HEIGHT
    // ----------------------------------------------

    case "distance-height":
    case "strength-performance": {
      if (!isString(data.athleteId)) {
        errors.push("Athlete ID must be a string.");
      }

      if (!isNumberArray(data.attempts)) {
        errors.push("Attempts must contain valid non-negative numbers.");
      }

      if (!isNonNegativeNumber(data.bestResult)) {
        errors.push("Best result must be a valid non-negative number.");
      }

      break;
    }

    // ----------------------------------------------
    // CRICKET
    // ----------------------------------------------

    case "cricket": {
      if (!Array.isArray(data.innings)) {
        errors.push("Cricket innings must be an array.");
      } else {
        data.innings.forEach((innings, index) => {
          if (!isRecord(innings)) {
            errors.push(`Innings ${index + 1} must be an object.`);
            return;
          }

          if (!isNonNegativeNumber(innings.runs)) {
            errors.push(`Innings ${index + 1} has invalid runs.`);
          }

          if (!isNonNegativeNumber(innings.wickets)) {
            errors.push(`Innings ${index + 1} has invalid wickets.`);
          }

          if (!isNonNegativeNumber(innings.legalBalls)) {
            errors.push(`Innings ${index + 1} has invalid legal balls.`);
          }

          if (!Array.isArray(innings.deliveries)) {
            errors.push(`Innings ${index + 1} deliveries must be an array.`);
          }

          if (typeof innings.completed !== "boolean") {
            errors.push(`Innings ${index + 1} completion status is invalid.`);
          }
        });
      }

      if (!isNonNegativeNumber(data.totalOvers)) {
        errors.push("Total overs must be a valid non-negative number.");
      }

      break;
    }

    // ----------------------------------------------
    // INNING RUNS
    // ----------------------------------------------

    case "inning-runs": {
      if (
        typeof data.inningsCount !== "number" ||
        !Number.isInteger(data.inningsCount) ||
        data.inningsCount <= 0
      ) {
        errors.push("Innings count must be a positive integer.");
      }

      if (!isNumberArray(data.teamA)) {
        errors.push("Team A scores must be valid non-negative numbers.");
      }

      if (!isNumberArray(data.teamB)) {
        errors.push("Team B scores must be valid non-negative numbers.");
      }

      if (
        Array.isArray(data.teamA) &&
        Array.isArray(data.teamB) &&
        typeof data.inningsCount === "number" &&
        (
          data.teamA.length !== data.inningsCount ||
          data.teamB.length !== data.inningsCount
        )
      ) {
        errors.push("Team score arrays must match the innings count.");
      }

      break;
    }

    // ----------------------------------------------
    // COMBAT POINTS
    // ----------------------------------------------

    case "combat-points": {
      const numericFields = [
        "teamOrAthleteA",
        "teamOrAthleteB",
        "penaltiesA",
        "penaltiesB",
      ];

      numericFields.forEach((field) => {
        if (!isNonNegativeNumber(data[field])) {
          errors.push(`${field} must be a valid non-negative number.`);
        }
      });

      if (!isBoolean(data.disqualifiedA)) {
        errors.push("Side A disqualification status must be boolean.");
      }

      if (!isBoolean(data.disqualifiedB)) {
        errors.push("Side B disqualification status must be boolean.");
      }

      break;
    }

    // ----------------------------------------------
    // JUDGE ROUNDS
    // ----------------------------------------------

    case "judge-rounds": {
      if (!Array.isArray(data.rounds)) {
        errors.push("Judge rounds must be an array.");
        break;
      }

      data.rounds.forEach((round, index) => {
        if (!isRecord(round)) {
          errors.push(`Round ${index + 1} must be an object.`);
          return;
        }

        if (
          !Number.isInteger(round.round) ||
          typeof round.round !== "number" ||
          round.round <= 0
        ) {
          errors.push(`Round ${index + 1} has an invalid round number.`);
        }

        if (!isNumberArray(round.judgeScoresA)) {
          errors.push(`Round ${index + 1} has invalid Side A judge scores.`);
        }

        if (!isNumberArray(round.judgeScoresB)) {
          errors.push(`Round ${index + 1} has invalid Side B judge scores.`);
        }

        if (
          !isBoolean(round.winnerA) ||
          !isBoolean(round.winnerB)
        ) {
          errors.push(`Round ${index + 1} has invalid winner indicators.`);
        }
      });

      break;
    }

    // ----------------------------------------------
    // JUDGED PERFORMANCE
    // ----------------------------------------------

    case "judged-performance": {
      const fields = [
        "difficulty",
        "execution",
        "deductions",
        "finalScore",
      ];

      fields.forEach((field) => {
        if (!isNonNegativeNumber(data[field])) {
          errors.push(`${field} must be a valid non-negative number.`);
        }
      });

      break;
    }

    // ----------------------------------------------
    // TARGET / ARCHERY
    // ----------------------------------------------

    case "target-precision": {
      if (!isString(data.athleteId)) {
        errors.push("Athlete ID must be a string.");
      }

      if (!Array.isArray(data.rounds)) {
        errors.push("Target rounds must be an array.");
      } else {
        data.rounds.forEach((round, index) => {
          if (!isNumberArray(round)) {
            errors.push(`Target round ${index + 1} contains invalid scores.`);
          }
        });
      }

      if (!isNonNegativeNumber(data.total)) {
        errors.push("Target total must be a valid non-negative number.");
      }

      break;
    }

    // ----------------------------------------------
    // BOWLING
    // ----------------------------------------------

    case "bowling": {
      if (!Array.isArray(data.frames)) {
        errors.push("Bowling frames must be an array.");
      } else {
        data.frames.forEach((frame, index) => {
          if (!isRecord(frame)) {
            errors.push(`Frame ${index + 1} must be an object.`);
            return;
          }

          if (!isNumberArray(frame.rolls)) {
            errors.push(`Frame ${index + 1} contains invalid rolls.`);
          }

          if (!isNonNegativeNumber(frame.score)) {
            errors.push(`Frame ${index + 1} has an invalid score.`);
          }

          if (!isStringOrUndefined(frame.notation)) {
            errors.push(`Frame ${index + 1} has invalid notation.`);
          }
        });
      }

      if (!isNonNegativeNumber(data.total)) {
        errors.push("Bowling total must be a valid non-negative number.");
      }

      break;
    }

    // ----------------------------------------------
    // GOLF
    // ----------------------------------------------

    case "golf": {
      if (
        data.mode !== "stroke-play" &&
        data.mode !== "match-play"
      ) {
        errors.push("Golf mode must be stroke-play or match-play.");
      }

      if (!isNumberArray(data.strokesByHole)) {
        errors.push("Golf strokes must be a valid number array.");
      }

      if (!isNumberArray(data.parByHole)) {
        errors.push("Golf par values must be a valid number array.");
      }

      if (
        Array.isArray(data.strokesByHole) &&
        Array.isArray(data.parByHole) &&
        data.strokesByHole.length !== data.parByHole.length
      ) {
        errors.push("Golf strokes and par arrays must have matching lengths.");
      }

      if (!isNonNegativeNumber(data.totalStrokes)) {
        errors.push("Golf total strokes must be valid.");
      }

      if (!isNonNegativeNumber(data.totalPar)) {
        errors.push("Golf total par must be valid.");
      }

      if (
        typeof data.relativeToPar !== "number" ||
        !Number.isFinite(data.relativeToPar)
      ) {
        errors.push("Golf relative-to-par value must be a valid number.");
      }

      break;
    }

    // ----------------------------------------------
    // MULTI-EVENT
    // ----------------------------------------------

    case "multi-event": {
      if (!isString(data.athleteId)) {
        errors.push("Athlete ID must be a string.");
      }

      if (!Array.isArray(data.eventScores)) {
        errors.push("Event scores must be an array.");
      } else {
        data.eventScores.forEach((item, index) => {
          if (!isRecord(item)) {
            errors.push(`Event score ${index + 1} must be an object.`);
            return;
          }

          if (!isString(item.eventId) || !item.eventId.trim()) {
            errors.push(`Event score ${index + 1} needs an event ID.`);
          }

          if (!isNonNegativeNumber(item.score)) {
            errors.push(`Event score ${index + 1} has an invalid score.`);
          }

          if (!isNonNegativeNumber(item.points)) {
            errors.push(`Event score ${index + 1} has invalid points.`);
          }
        });
      }

      if (!isNonNegativeNumber(data.totalPoints)) {
        errors.push("Total points must be a valid non-negative number.");
      }

      break;
    }

    default:
      errors.push("Unsupported scoring engine.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}