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
    <Link href={href} className="block">
      <div className="rounded-xl border border-gray-800 p-6 hover:border-gray-500 hover:bg-gray-900 transition cursor-pointer">
        <h3 className="text-xl font-bold">
          {icon} {name}
        </h3>

        <p className="mt-2 text-gray-400">
          {description}
        </p>
      </div>
    </Link>
  );
}