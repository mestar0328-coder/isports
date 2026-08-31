import SportCard from "@/components/SportCard";
import { sports } from "@/data/sports";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Hero Section */}
      <section className="px-8 py-24 text-center">
        <h1 className="text-5xl font-bold">
          Your World of Sports
        </h1>

        <p className="mt-5 text-lg text-gray-400">
          Follow sports, players, teams and live statistics in one place.
        </p>

        <button className="mt-8 rounded-lg bg-white px-6 py-3 font-semibold text-black">
          Explore Sports
        </button>
      </section>

      {/* Popular Sports */}
      <section className="px-8 pb-20">
        <h2 className="mb-8 text-3xl font-bold">
          Popular Sports
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {sports.map((sport) => (
            <SportCard
              key={sport.id}
              name={sport.name}
              icon={sport.icon}
              description={`${sport.name} matches, players and statistics.`}
              href={`/sports/${sport.id}`}
            />
          ))}
        </div>
      </section>

    </main>
  );
}