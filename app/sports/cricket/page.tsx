import { teams } from "../../../data/teams";
import { players } from "../../../data/players";
import TeamCard from "../../../components/teamcard";
import PlayerCard from "../../../components/PlayerCard";

export default function CricketPage() {
  const cricketTeams = teams.filter(
    (team) => team.sportId === "cricket"
  );

  const cricketPlayers = players.filter(
    (player) => player.sportId === "cricket"
  );

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">

      <h1 className="text-4xl font-bold">
        🏏 Cricket
      </h1>

      <p className="mt-4 text-gray-400">
        Explore cricket matches, players, teams and statistics.
      </p>

      <section className="mt-10">
        <h2 className="mb-6 text-2xl font-bold">
          Cricket Teams
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {cricketTeams.map((team) => (
            <TeamCard
              key={team.id}
              name={team.name}
              sport="Cricket"
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold">
          Cricket Players
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {cricketPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              name={player.name}
              sport="Cricket"
            />
          ))}
        </div>
      </section>

    </main>
  );
}