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

registrationType: "team" | "individual";

teamSize?: number;
};

export type Player = {
id: string;
name: string;
teamId: string;
sportId: string;
};

export type Student = {
id: string;
name: string;
age: number;
course: string;
year: number;
college: string;
};

export type Team = {
id: string;
name: string;
sportId: string;
};