import React, { useState, useEffect, useRef } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import useAutoLogout from "@/hooks/useAutoLogout"; // 👈 import the auto logout hook

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 768,
  );
  const lastWidth = useRef(window.innerWidth);
  useEffect(() => {
    const handleResize = () => {
      // Phones fire resize when the address bar hides; only a width change counts
      if (window.innerWidth === lastWidth.current) return;
      lastWidth.current = window.innerWidth;
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useAutoLogout(30 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        showMenuButton
      />

      <div className="flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarCollapsed(true)}
        />

        <main className="flex-1 min-w-0 p-3 sm:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
