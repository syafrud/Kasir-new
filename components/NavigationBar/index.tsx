"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ArrowLeft } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const NavigationBar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "ADMIN";

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex w-full h-16">
      {isAdmin && (
        <Link
          href="/dashboard"
          className="flex items-center justify-center text-white transition-colors bg-gray-600 hover:bg-gray-700 px-4"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Dashboard</span>
        </Link>
      )}
      <Link
        href="/pos"
        className={`w-1/3 flex items-center justify-center text-white transition-colors ${
          isActive("/pos") && pathname && !pathname.includes("/pos/")
            ? "bg-orange-600"
            : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        <span>Kasir</span>
      </Link>
      <Link
        href="/pos/invoice"
        className={`w-1/3 flex items-center justify-center text-white transition-colors ${
          isActive("/pos/invoice")
            ? "bg-green-600"
            : "bg-green-500 hover:bg-green-600"
        }`}
      >
        <span>Invoice</span>
      </Link>
      <Link
        href="/pos/produk"
        className={`w-1/3 flex items-center justify-center text-white transition-colors ${
          isActive("/pos/produk")
            ? "bg-blue-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        <span>Stock Produk</span>
      </Link>
      <button
        className="flex justify-center items-center h-full px-5 bg-red-500"
        onClick={() => signOut()}
      >
        <LogOut size={20} />
      </button>
    </div>
  );
};

export default NavigationBar;
