export interface InChargeAccount {
  id: string;
  name: string;
  username: string;
  password: string;
  assignedSport: string;
  assignedEventIds: string[];
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export const inchargeAccounts: InChargeAccount[] = [
  {
    id: "incharge-1",
    name: "Test Incharge",
    username: "incharge1",
    password: "password123",
    assignedSport: "Football",
    assignedEventIds: ["event-1"], // put your real event ID from events.ts
    expiresAt: "2026-12-31T23:59:59.000Z",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];