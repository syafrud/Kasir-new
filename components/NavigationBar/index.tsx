"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavigationBar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex w-full h-16">
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
        <span>Barang</span>
      </Link>
    </div>
  );
};

export default NavigationBar;
