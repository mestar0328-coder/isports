import { teams } from "../../../data/teams";
import { players } from "../../../data/players";
import TeamCard from "../../../components/teamcard";
import PlayerCard from "../../../components/PlayerCard";

export default function FootballPage() {
  const footballTeams = teams.filter(
    (team) => team.sportId === "football"
  );

  const footballPlayers = players.filter(
    (player) => player.sportId === "football"
  );

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">

      <h1 className="text-4xl font-bold">
        ⚽ Football
      </h1>

      <p className="mt-4 text-gray-400">
        Explore football matches, players, teams and statistics.
      </p>

      {/* Teams */}
      <section className="mt-10">
        <h2 className="mb-6 text-2xl font-bold">
          Football Teams
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {footballTeams.map((team) => (
            <TeamCard
              key={team.id}
              name={team.name}
              sport="Football"
            />
          ))}
        </div>
      </section>

      {/* Players */}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold">
          Football Players
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {footballPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              name={player.name}
              sport="Football"
            />
          ))}
        </div>
      </section>

    </main>
  );
}