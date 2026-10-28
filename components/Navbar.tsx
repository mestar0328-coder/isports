"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UserRole = "student" | "admin" | "incharge" | null;

export default function Navbar() {
const [userRole, setUserRole] = useState<UserRole>(null);
const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
const updateUserRole = () => {
try {
const storedUser = localStorage.getItem("isports_user");
const user = storedUser ? JSON.parse(storedUser) : null;

    if (
      user?.role === "student" ||
      user?.role === "admin" ||
      user?.role === "incharge"
    ) {
      setUserRole(user.role);
    } else {
      setUserRole(null);
    }
  } catch {
    setUserRole(null);
  }

  setIsLoaded(true);
};

updateUserRole();

window.addEventListener("storage", updateUserRole);
window.addEventListener("focus", updateUserRole);

return () => {
  window.removeEventListener("storage", updateUserRole);
  window.removeEventListener("focus", updateUserRole);
};

}, []);

return (
<nav className="flex items-center justify-between border-b border-gray-800 px-8 py-5">
<Link href="/" className="text-2xl font-bold text-white">
iSports
</Link>

  <div className="flex flex-wrap items-center gap-6 text-gray-300">
    <Link href="/" className="hover:text-white">
      Home
    </Link>

    <Link href="/events" className="hover:text-white">
      Sports
    </Link>

    {isLoaded && userRole !== null && (
      <Link href="/results" className="hover:text-white">
        Results
      </Link>
    )}

    {isLoaded && userRole === "admin" && (
      <Link href="/registrations" className="hover:text-white">
        Registrations
      </Link>
    )}

    <span className="cursor-not-allowed text-gray-500">
      Players
    </span>

    <span className="cursor-not-allowed text-gray-500">
      Teams
    </span>
  </div>
</nav>

);
}