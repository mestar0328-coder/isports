type SportPageProps = {
  params: Promise<{
    sport: string;
  }>;
};

export default async function SportPage({
  params,
}: SportPageProps) {
  const { sport } = await params;

  const sportName =
    sport.charAt(0).toUpperCase() + sport.slice(1);

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">
          iSPORTS
        </p>

        <h1 className="mb-4 text-4xl font-bold">
          {sportName} Events
        </h1>

        <p className="mb-8 text-gray-300">
          Explore {sportName.toLowerCase()} events and connect
          with other players.
        </p>

        <a
          href="/events"
          className="inline-block rounded-lg bg-white px-5 py-3 font-semibold text-black hover:bg-gray-200"
        >
          Back to Events
        </a>
      </div>
    </main>
  );
}