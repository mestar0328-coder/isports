export type SportEvent = {
  id: string;
  name: string;
  sport: string;
  sportId?: string;

  description: string;
  date: string;
  venue: string;

  rules: string[];
  eligibility: string[];

  minAge?: number;
  maxAge?: number;

  registrationDeadline: string;

  registrationType: "team" | "individual";

  teamSize?: number;
};