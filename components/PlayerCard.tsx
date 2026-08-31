type PlayerCardProps = {
  name: string;
  sport: string;
};

export default function PlayerCard({
  name,
  sport,
}: PlayerCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 p-6 transition hover:bg-gray-900">
      <h3 className="text-xl font-bold">
        {name}
      </h3>

      <p className="mt-2 text-gray-400">
        {sport} Player
      </p>
    </div>
  );
}