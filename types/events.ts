export type SportEvent = {
  id: string;
  name: string;
  sportId: string;
  description: string;
  venue: string;
  date: string;
  time: string;
  maxPlayers: number;
  status: "Open" | "Closed";
  createdAt: string;
};