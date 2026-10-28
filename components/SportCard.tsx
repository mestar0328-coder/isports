import Link from "next/link";

type SportCardProps = {
name: string;
icon: string;
description: string;
href: string;
};

export default function SportCard({
name,
icon,
description,
href,
}: SportCardProps) {
return (
<Link
href={href}
className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
>
<div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/60">
{/* Sport Icon */}
<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl ring-1 ring-blue-100 transition-colors duration-300 group-hover:bg-blue-100">
<span aria-hidden="true">{icon}</span>
</div>

    {/* Sport Details */}
    <h3 className="mt-5 text-xl font-extrabold text-slate-900 transition-colors group-hover:text-blue-700">
      {name}
    </h3>

    <p className="mt-2 text-sm leading-6 text-slate-600">
      {description}
    </p>

    {/* Explore Link */}
    <div className="mt-5 flex items-center gap-2 text-sm font-bold text-blue-600">
      Explore Sport
      <span
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </div>
  </div>
</Link>

);
}