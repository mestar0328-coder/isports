export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
      <h1 className="text-2xl font-bold">iSports</h1>

      <div className="flex gap-6 text-gray-300">
        <a href="#">Home</a>
        <a href="#">Sports</a>
        <a href="#">Players</a>
        <a href="#">Teams</a>
      </div>
    </nav>
  );
}