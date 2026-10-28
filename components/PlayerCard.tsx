type PlayerCardProps = {
name: string;
sport: string;
};

export default function PlayerCard({
name,
sport,
}: PlayerCardProps) {
return (
<div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60">
<div className="flex items-center gap-4">
{/* Player Avatar */}
<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl font-extrabold text-blue-600 ring-1 ring-blue-100 transition-colors group-hover:bg-blue-100">
{name.trim().charAt(0).toUpperCase() || "P"}
</div>

    {/* Player Details */}
    <div className="min-w-0">
      <h3 className="truncate text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-700">
        {name}
      </h3>

      <p className="mt-2 text-sm font-medium text-slate-500">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" />
        {sport} Player
      </p>
    </div>
  </div>

  <div className="mt-5 border-t border-slate-100 pt-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
      iSports Athlete
    </p>
  </div>
</div>

);
}