import React, { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#5FBDFF]">
      <div className="w-full flex flex-col">
        <div className="max-h-[calc(100vh-62px)]">{children}</div>
        <div className="flex w-full h-16">
          <button className="w-1/3 bg-orange-500 text-white">Kasir</button>
          <button className="w-1/3 bg-green-500 text-white">Invoice</button>
          <button className="w-1/3 bg-blue-500 text-white">Barang</button>
        </div>
      </div>
    </div>
  );
};

export default Layout;
