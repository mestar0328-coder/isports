import type { SportsEvent } from "@/types/sports";

export const events: SportsEvent[] = [
  {
    id: "event-1",

    name: "Inter College Volleyball Tournament",

    sport: "Volleyball",

    description:
      "Inter college volleyball competition for eligible students.",

    date: "2026-09-10",

    venue: "College Ground",

    rules: [
      "Players must follow tournament rules.",
      "Each team must have 6 players.",
      "Valid college ID is required.",
    ],

    eligibility: [
      "Diploma students",
      "Valid college ID",
      "Age between 17 and 21",
    ],

    minAge: 17,

    maxAge: 21,

    registrationDeadline: "2026-09-05",

    registrationType: "team",

    teamSize: 6,
  },

  {
    id: "event-2",

    name: "100m Running",

    sport: "Running",

    description:
      "Individual 100 metre running competition.",

    date: "2026-09-12",

    venue: "College Stadium",

    rules: [
      "Participants must report 30 minutes before the event.",
      "Sports rules must be followed.",
    ],

    eligibility: [
      "Diploma students",
      "Valid college ID",
      "Age between 17 and 21",
    ],

    minAge: 17,

    maxAge: 21,

    registrationDeadline: "2026-09-07",

    registrationType: "individual",
  },

  {
    id: "event-3",

    name: "Inter College Badminton",

    sport: "Badminton",

    description:
      "Badminton competition for eligible students.",

    date: "2026-09-15",

    venue: "Indoor Sports Hall",

    rules: [
      "Participants must follow badminton rules.",
      "Valid college ID is required.",
    ],

    eligibility: [
      "Diploma students",
      "Valid college ID",
    ],

    minAge: 17,

    maxAge: 21,

    registrationDeadline: "2026-09-10",

    registrationType: "individual",
  },
];