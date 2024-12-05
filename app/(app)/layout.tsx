"use client";
import SidebarLink from "@/components/ui/link";
import "../globals.css";
import { BarChart, LogOut, User, Menu } from "lucide-react";
import { useState } from "react";
import { LogoutButton } from "../auth";
import { Providers } from "../providers";

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
          {/* Navbar */}
          <div className="topbar fixed top-0 left-0 w-full h-[70px] flex items-center bg-gradient-to-r from-[#0178bc] to-[#00bdda] shadow-md">
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
            className={`sidebar fixed top-[70px] left-0 h-screen ${
              isSidebarExpanded || isHovering ? "w-[225px]" : "w-[70px]"
            } bg-[#363D4A] flex flex-col gap-6 py-5 px-3 overflow-y-auto no-scrollbar transition-all duration-300 shadow-xl`}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            <ul className="flex flex-col gap-6">
              <li className="px-3">
                <div
                  className={`text-white font-bold text-center uppercase ${
                    isSidebarExpanded || isHovering ? "hidden" : "block"
                  }`}
                >
                  ...
                </div>
                <div
                  className={`text-white font-bold ${
                    isSidebarExpanded || isHovering ? "block" : "hidden"
                  }`}
                >
                  Dashboard
                </div>
              </li>

              <SidebarLink
                href="/kategori-produk"
                icon={<BarChart size={20} />}
                label="Kategori Produk"
                isExpanded={isSidebarExpanded || isHovering}
              />
            </ul>
          </div>

          {/* Content */}
          <div
            className={`${
              isSidebarExpanded ? "pl-[225px]" : "pl-[70px]"
            } pt-[70px] transition-all duration-300 max-w-max w-screen`}
          >
            <div className="p-10">
              <Providers>{children}</Providers>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
