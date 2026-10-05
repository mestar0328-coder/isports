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

// Starts empty.
// New registrations will be added dynamically.
export const registrations: Registration[] = [];