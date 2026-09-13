export type InchargeAccess = {
  userName: string;
  role: "Scoring Incharge";
  eventId: string;
  accessType: "Temporary";
  active: boolean;
};

export const inchargeAccess: InchargeAccess = {
  userName: "Sports Incharge",
  role: "Scoring Incharge",
  eventId: "event-1",
  accessType: "Temporary",
  active: true,
};

export function isInchargeAuthorized(): boolean {
  return (
    inchargeAccess.role === "Scoring Incharge" &&
    inchargeAccess.accessType === "Temporary" &&
    inchargeAccess.active
  );
}

export function canAccessEvent(
  eventId: string
): boolean {
  return (
    isInchargeAuthorized() &&
    inchargeAccess.eventId === eventId
  );
}