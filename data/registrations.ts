export type RegistrationStatus =
  | "Pending"
  | "Approved"
  | "Rejected";

export type RegistrationType =
  | "Individual"
  | "Team";

export type Registration = {
  id: string;

  applicantName: string;

  eventId: string;
  eventName: string;

  registrationType: RegistrationType;

  college: string;

  status: RegistrationStatus;

  teamName?: string;

  teamMembers?: string[];

  registeredAt: string;
};

export const registrations: Registration[] = [
  {
    id: "REG001",

    applicantName: "Student One",

    eventId: "event-2",
    eventName: "100m Running",

    registrationType: "Individual",

    college: "ABC Polytechnic College",

    status: "Pending",

    registeredAt: "2026-08-18",
  },

  {
    id: "REG002",

    applicantName: "Student Two",

    eventId: "event-1",
    eventName: "Inter College Volleyball Tournament",

    registrationType: "Team",

    college: "ABC Polytechnic College",

    status: "Pending",

    teamName: "Thunder",

    teamMembers: [
      "Student Two",
      "Student Three",
      "Student Four",
      "Student Five",
      "Student Six",
      "Student Seven",
    ],

    registeredAt: "2026-08-18",
  },

  {
    id: "REG003",

    applicantName: "Student Eight",

    eventId: "event-3",
    eventName: "Inter College Badminton",

    registrationType: "Individual",

    college: "XYZ Polytechnic College",

    status: "Pending",

    registeredAt: "2026-08-18",
  },
];
