import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
      <Link href="/" className="text-2xl font-bold">
        iSports
      </Link>

      <div className="flex gap-6 text-gray-300">
        <Link href="/">Home</Link>
        <Link href="/events">Sports</Link>
        <span className="text-gray-500 cursor-not-allowed">Players</span>
        <span className="text-gray-500 cursor-not-allowed">Teams</span>
      </div>
    </nav>
  );
}