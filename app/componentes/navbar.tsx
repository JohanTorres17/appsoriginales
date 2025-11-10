"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type LinkItem = {
  href: string;
  label: string;
};

export default function NavBar() {
  const path = usePathname();

  const links: LinkItem[] = [
    { href: "/primeraoriginal", label: "Sudoku" },
    { href: "/segundaoriginal", label: "Sokoban" },
    { href: "/terceraoriginal", label: "2048" },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white p-4 flex flex-wrap justify-center items-center gap-6 shadow-lg sticky top-0 z-50 transition-all duration-300">
      {links.map((link) => {
        const active = path === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`font-semibold tracking-wide text-lg transition-transform duration-200 hover:scale-110 hover:text-yellow-300 ${
              active ? "underline decoration-yellow-400 underline-offset-4" : ""
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}