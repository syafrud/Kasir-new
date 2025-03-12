// app/(app)/pos/layout.tsx
import NavigationBar from "@/components/NavigationBar";
import React from "react";
import { Toaster } from "react-hot-toast";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#5FBDFF] relative transition-all duration-300">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          removeDelay: 1000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />

      <div className="w-full flex flex-col">
        <div className="flex-1 max-h-[calc(100vh-64px)]">{children}</div>
        <NavigationBar />
      </div>
    </div>
  );
}
