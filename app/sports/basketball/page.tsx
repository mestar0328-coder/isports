import { teams } from "../../../data/teams";
import { players } from "../../../data/players";
import TeamCard from "../../../components/teamcard";
import PlayerCard from "../../../components/PlayerCard";

export default function BasketballPage() {
  const basketballTeams = teams.filter(
    (team) => team.sportId === "basketball"
  );

  const basketballPlayers = players.filter(
    (player) => player.sportId === "basketball"
  );

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">

      <h1 className="text-4xl font-bold">
        🏀 Basketball
      </h1>

      <p className="mt-4 text-gray-400">
        Explore basketball matches, players, teams and statistics.
      </p>

      {/* Teams */}
      <section className="mt-10">
        <h2 className="mb-6 text-2xl font-bold">
          Basketball Teams
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {basketballTeams.map((team) => (
            <TeamCard
              key={team.id}
              name={team.name}
              sport="Basketball"
            />
          ))}
        </div>
      </section>

      {/* Players */}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold">
          Basketball Players
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {basketballPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              name={player.name}
              sport="Basketball"
            />
          ))}
        </div>
      </section>

    </main>
  );
}