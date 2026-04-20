import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import useAutoLogout from "@/hooks/useAutoLogout"; // 👈 import the auto logout hook

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useAutoLogout(30 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        showMenuButton
      />

      <div className="flex">
        <Sidebar collapsed={sidebarCollapsed} />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
