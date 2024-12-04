"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface KategoriProdukProps {
  href: string;
  icon: ReactNode;
  label: string;
  isExpanded: boolean;
}

export default function KategoriProduk({
  href,
  icon,
  label,
  isExpanded,
}: KategoriProdukProps) {
  return (
    <li className="flex items-center gap-4 px-3 py-2 hover:bg-[#505761] rounded-md transition">
      <div className="text-white">{icon}</div>
      <Link
        href={href}
        className={`text-white ${isExpanded ? "block" : "hidden"}`}
      >
        {label}
      </Link>
    </li>
  );
}
