"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  isExpanded: boolean;
}

export default function SidebarALink({
  href,
  icon,
  label,
  isExpanded,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li
      className={`rounded-md transition ${
        isActive ? "bg-gray-300 text-black" : "hover:bg-gray-200"
      }`}
    >
      <Link href={href} className="flex items-center gap-4 px-3 py-2">
        <div className={`${isActive ? "text-black" : "text-gray-600"}`}>
          {icon}
        </div>
        <div
          className={`${isExpanded ? "block" : "hidden"} ${
            isActive ? "text-black" : "text-gray-600"
          }`}
        >
          {label}
        </div>
      </Link>
    </li>
  );
}
