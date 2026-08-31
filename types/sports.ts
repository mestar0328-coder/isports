export type Sport = {
  id: string;
  name: string;
  icon: string;
};

export type Team = {
  id: string;
  name: string;
  sportId: string;
};

export type Player = {
  id: string;
  name: string;
  teamId: string;
  sportId: string;
};

export type Match = {
  id: string;
  sportId: string;
  teamAId: string;
  teamBId: string;
  date: string;
  status: "upcoming" | "live" | "completed";
};

export type PlayerStats = {
  playerId: string;
  matches: number;
  points: number;
  assists: number;
};

export type SportsEvent = {
  id: string;
  name: string;
  sport: string;
  description: string;
  date: string;
  venue: string;

  rules: string[];

  eligibility: string[];

  minAge?: number;
  maxAge?: number;

  registrationDeadline: string;

  registrationType:
    | "individual"
    | "team";

  teamSize?: number;
};

export type Student = {
  id: string;
  name: string;
  age: number;
  course: string;
  year: number;
  college: string;
};

export type Registration = {
  id: string;

  eventId: string;

  eventName: string;

  applicantName: string;

  college: string;

  registrationType:
    | "Individual"
    | "Team";

  teamName?: string;

  teamMembers?: string[];

  status:
    | "Pending"
    | "Approved"
    | "Rejected";

  registeredAt: string;
};