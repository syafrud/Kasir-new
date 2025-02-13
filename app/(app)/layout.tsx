"use client";
import SidebarLink from "@/components/ui/link";
import "../globals.css";
import {
  LogOut,
  User,
  Menu,
  LayoutDashboard,
  Shield,
  Users,
  Tags,
  Boxes,
  Package,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { LogoutButton } from "../auth";
import { Providers } from "../providers";
import { Toaster } from "react-hot-toast";
import { Accordion } from "@/components/ui/accordion";
import SidebarALink from "@/components/ui/link/accordion";

export default function RootLayout({
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
    <html lang="en">
      <body>
        <div className="relative z-[1000]">
          <div className="topbar fixed top-0 left-0 w-full h-[62px] flex items-center bg-[#0178bc] z-50 shadow-lg">
            <div className="bg-white w-[276px] h-full flex items-center px-3 gap-3">
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
                className="text-white p-2 rounded-md hover:bg-[#01669e] transition"
              >
                <Menu size={24} />
              </button>
            </div>

            <div className="flex justify-between items-center w-full px-5">
              <a href="/ " className="text-white font-bold">
                Kasir
              </a>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-white flex items-center gap-2 hover:underline"
                >
                  <User size={20} />
                  Profile
                </a>
                <a
                  href="#"
                  className="text-white flex items-center gap-2 hover:underline"
                >
                  <LogOut size={20} />
                  <LogoutButton />
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div
            className={`sidebar fixed top-[62px] left-0 h-screen ${
              isSidebarExpanded || isHovering ? "w-[225px]" : "w-[70px]"
            } bg-[#ffffff] flex flex-col gap-6 py-5 px-3 overflow-y-auto no-scrollbar transition-all duration-300 shadow-xl z-20`}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            <ul className="flex flex-col gap-3">
              <li className="px-3">
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

                <div
                  className={`text-[#485371] font-bold text-center uppercase ${
                    isSidebarExpanded || isHovering ? "hidden" : "block"
                  }`}
                >
                  <LayoutDashboard size={20} />
                </div>
                <div
                  className={`text-[#485371] font-bold ${
                    isSidebarExpanded || isHovering ? "block" : "hidden"
                  }`}
                >
                  Dashboard
                </div>
              </li>
              <SidebarLink
                href="/penjualan"
                icon={<ShoppingCart size={20} />}
                label="Transaksi"
                isExpanded={isSidebarExpanded || isHovering}
              />
              <Accordion
                title="Produk"
                icon={<Package size={20} />}
                isExpanded={isSidebarExpanded || isHovering}
              >
                <SidebarALink
                  href="/produk"
                  icon={<Boxes size={20} />}
                  label="Produk"
                  isExpanded={isSidebarExpanded || isHovering}
                />
                <SidebarALink
                  href="/kategori-produk"
                  icon={<Tags size={20} />}
                  label="Kategori Produk"
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
            className={` bg-[#ECF3F7]  h-[calc(100vh-62px)] ${
              isSidebarExpanded ? "ml-[225px]" : "ml-[70px]"
            }  mt-[62px] transition-all duration-300 w-[calc(100vw-${
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
              <div className="p-5 ">
                <div className="p-5 rounded-lg bg-white">{children}</div>
              </div>
              <div
                className={`fixed bottom-0 bg-white py-3 border-t text-center shadow-xl transition-all duration-300 ${
                  isSidebarExpanded
                    ? "ml-[0px] w-[calc(100vw-225px)]"
                    : "ml-[0px] w-[calc(100vw-70px)]"
                }`}
                style={{ zIndex: 10 }}
              >
                © {new Date().getFullYear()} IndoKasir. All rights reserved.
              </div>
            </Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
