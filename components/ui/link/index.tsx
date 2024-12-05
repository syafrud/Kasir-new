"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface SidebarLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  isExpanded: boolean;
}

export default function SidebarLink({
  href,
  icon,
  label,
  isExpanded,
}: SidebarLinkProps) {
  return (
    <li className="hover:bg-[#505761] rounded-md transition">
      <Link href={href} className="flex items-center gap-4 px-3 py-2">
        <div className="text-white">{icon}</div>
        <div className={`text-white ${isExpanded ? "block" : "hidden"}`}>
          {label}
        </div>
      </Link>
    </li>
  );
}
