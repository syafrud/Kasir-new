"use client";
import SidebarLink from "@/components/ui/link";
import "../../globals.css";
import {
  LogOut,
  LayoutDashboard,
  Shield,
  Users,
  Tags,
  Boxes,
  Package,
  ShoppingCart,
  FileText,
  BarChartBig,
  Receipt,
  ClipboardList,
  Store,
  ShoppingBag,
  Menu,
  History,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Providers } from "../../providers";
import { Toaster } from "react-hot-toast";
import { Accordion } from "@/components/ui/accordion";
import SidebarALink from "@/components/ui/link/accordion";
import { signOut } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarExpanded, setSidebarExpanded] = useState(false);
  const [isHovering, setHovering] = useState(false);

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => !prev);
  };

  return (
    <div className="relative z-[1000]">
      <div className="topbar fixed top-0 left-0 w-full h-[62px] flex items-center bg-[#0178bc] z-50 shadow-md">
        <div className="bg-white min-w-[225px] max-w-[225px] h-full flex items-center px-3 gap-3">
          <Image
            src="/logo.png"
            alt="IndoKasir Logo"
            width={500}
            height={300}
            className="w-full"
          />
        </div>

        {/* Sidebar Toggle */}
        <div className="flex items-center w-[70px] justify-center">
          <button
            onClick={toggleSidebar}
            className="text-white p-2 rounded-md transition"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex justify-end items-center w-full px-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => signOut()}
              className="text-white flex items-center gap-2 hover:underline"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`sidebar fixed top-[62px] left-0 h-[calc(100vh-62px)] ${
          isSidebarExpanded || isHovering ? "w-[225px]" : "w-[70px]"
        } bg-[#ffffff] flex flex-col py-5 px-3 overflow-y-auto transition-all duration-300 shadow-xl z-20`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <ul className="flex flex-col gap-2">
          <li className="px-1">
            {isSidebarExpanded || isHovering ? (
              <div className="text-2xl font-bold text-center">
                <span className="text-[#009965]">Kasir</span>
                <span className="text-[#E79B2C]">Pintar</span>
              </div>
            ) : (
              <div className="flex justify-center text-center text-xl font-bold tracking-wide">
                <span className="text-[#009965]">K</span>
                <span className="text-[#E79B2C]">P</span>
              </div>
            )}
            <div className="border-b-2 border-gray-300 mt-1 mb-2"></div>
          </li>
          <SidebarLink
            href="/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isExpanded={isSidebarExpanded || isHovering}
          />
          <SidebarLink
            href="/penjualan"
            icon={<CreditCard size={20} />}
            label="Transaksi"
            isExpanded={isSidebarExpanded || isHovering}
          />
          <Accordion
            title="Produk"
            icon={<ShoppingBag size={20} />}
            isExpanded={isSidebarExpanded || isHovering}
          >
            <SidebarALink
              href="/produk"
              icon={<Package size={20} />}
              label="Produk"
              isExpanded={isSidebarExpanded || isHovering}
            />
            <SidebarALink
              href="/stock-history"
              icon={<History size={20} />}
              label="Stock History"
              isExpanded={isSidebarExpanded || isHovering}
            />
            <SidebarALink
              href="/kategori-produk"
              icon={<Tags size={20} />}
              label="Kategori Produk"
              isExpanded={isSidebarExpanded || isHovering}
            />
            <SidebarALink
              href="/barcode"
              icon={<ClipboardList size={20} />}
              label="Cetak Barcode"
              isExpanded={isSidebarExpanded || isHovering}
            />
          </Accordion>
          <Accordion
            title="Laporan"
            icon={<FileText size={20} />}
            isExpanded={isSidebarExpanded || isHovering}
          >
            <SidebarALink
              href="/laporan"
              icon={<BarChartBig size={20} />}
              label="Laporan Penjualan"
              isExpanded={isSidebarExpanded || isHovering}
            />
            <SidebarALink
              href="/laporan/per-item"
              icon={<Boxes size={20} />}
              label="Laporan Penjualan Per Item"
              isExpanded={isSidebarExpanded || isHovering}
            />
          </Accordion>
          <Accordion
            title="Kasir/Pos"
            icon={<Store size={20} />}
            isExpanded={isSidebarExpanded || isHovering}
          >
            <SidebarALink
              href="/pos"
              icon={<ShoppingCart size={20} />}
              label="Kasir"
              isExpanded={isSidebarExpanded || isHovering}
            />
            <SidebarALink
              href="/pos/invoice"
              icon={<Receipt size={20} />}
              label="Invoice"
              isExpanded={isSidebarExpanded || isHovering}
            />
            <SidebarALink
              href="/pos/produk"
              icon={<Package size={20} />}
              label="Stock Produk"
              isExpanded={isSidebarExpanded || isHovering}
            />
          </Accordion>
          <SidebarLink
            href="/pelanggan"
            icon={<Users size={20} />}
            label="Pelanggan"
            isExpanded={isSidebarExpanded || isHovering}
          />
          <SidebarLink
            href="/users"
            icon={<Shield size={20} />}
            label="Users"
            isExpanded={isSidebarExpanded || isHovering}
          />
        </ul>
      </div>

      {/* Content */}
      <div
        className={`bg-[#ECF3F7] min-h-[calc(100vh-62px)] ${
          isSidebarExpanded ? "ml-[225px]" : "ml-[70px]"
        } mt-[62px] transition-all duration-300 w-[calc(100%-${
          isSidebarExpanded ? "225px" : "70px"
        })]`}
      >
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "",
            duration: 5000,
            removeDelay: 1000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />

        <Providers>
          <div className="p-5 min-h-[calc(100vh-111px)]">
            <div className="p-5 rounded-lg bg-white">{children}</div>
          </div>
          <div
            className={`bottom-0 bg-white py-3 border-t text-center shadow-xl transition-all duration-300 ${
              isSidebarExpanded ? "ml-[0px] w-full" : "ml-[0px] w-full"
            }`}
            style={{ zIndex: 10 }}
          >
            © {new Date().getFullYear()} KasirPintar. All rights reserved.
          </div>
        </Providers>
      </div>
    </div>
  );
}
