import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Car,
  Users,
  Route,
  CheckSquare,
  Home,
  Plus,
  User,
  BarChart2,
  Verified,
  LogOut,
  Search,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
  onClick?: () => void; // ✅ Added to support logout
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuth(); // ✅ use logout from context
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  // Citizen Menu
  const citizenMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Car, label: "My Vehicles", path: "/Managevehicle" },
    { icon: Users, label: "My Drivers", path: "/ManageDriver" },
    { icon: Plus, label: "Add Trip", path: "/AddTrip" },
    { icon: Route, label: "My Trips", path: "/MyTrips" },
    {
      icon: BarChart2,
      label: "Reports",
      path: "#",
      children: [
        { label: "Today's Trips", path: "/ManageTrip?tab=todays" },
        { label: "Upcoming", path: "/ManageTrip?tab=upcoming" },
        { label: "Approved", path: "/ManageTrip?tab=completed" },
        { label: "Rejected", path: "/ManageTrip?tab=rejected" },
      ],
    },

    { icon: User, label: "Profile", path: "/profile" },
    { icon: LogOut, label: "Logout", onClick: logout }, // ✅ works perfectly now
  ];

  // Police Menu
  const policeMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/PoliceDashboard" },
    // { icon: Verified, label: "Verify Trips", path: "/VerifiedTrips" },
    { icon: CheckSquare, label: "Departure", path: "/approvals" },
    { icon: CheckSquare, label: "Arrival", path: "/checkout" },
    { icon: Search, label: "View Trip", path: "/SearchTrip" },

    {
      icon: Route,
      label: "Reports",
      path: "#",
      children: [
        { label: "Approved", path: "/ApprovedTrips" },
        { label: "Rejected", path: "/RejectedTrips" },
        { label: "Pending", path: "/PendingTrips" },
        { label: "Verified Trips", path: "/ViewAllVerifiedTrips" },
        { label: "Generate Report", path: "/generate-report" },
        { label: "Convey Wise Report", path: "/ConveyWiseReport" },
        { label: "Arrival List", path: "/ArrivalList" },
        { label: "Arrival Reports", path: "/ViewCheckoutReport" },
        { label: "Today Vehicle Reports", path: "/TodayVehicleReport" },
      ],
    },
    // Today's Trip Details
    { icon: Route, label: "Today's Trip Details", path: "/TodaysTripDetails" },

    { icon: User, label: "Profile", path: "/PoliceProfile" },
    { icon: LogOut, label: "Logout", onClick: logout }, // works perfectly now
  ];

  // Admin Menu
  // Admin Menu (Only Dashboard + Reports + Logout)
  const adminMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/AdminDashboard" },
    { icon: Users, label: "Register User", path: "/PoliceRegister" },
    { icon: Users, label: "Show Registered User", path: "/RegisteredPolice" },
    // { icon: Users, label: "Convoy Wise Report", path: "/ConveyWiseReport" },
    { icon: Search, label: "View Trip", path: "/SearchTrip" },

    { icon: Route, label: "Today's Trip Details", path: "/TodaysTripDetails" },
    {
      icon: Route,
      label: "Reports",
      path: "#",
      children: [
        { label: "Approved", path: "/ApprovedTrips" },
        { label: "Rejected", path: "/RejectedTrips" },
        { label: "Pending", path: "/PendingTrips" },
      ],
    },

    { icon: LogOut, label: "Logout", onClick: logout }, // works perfectly now
  ];

  // SP Menu
  const spMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/SPDashboard" },
    { icon: Route, label: "Today's Trip Details", path: "/TodaysTripDetails" },

    {
      icon: Route,
      label: "Reports",
      path: "#",
      children: [
        { label: "Approved", path: "/ApprovedTrips" },
        { label: "Rejected", path: "/RejectedTrips" },
        { label: "Pending", path: "/PendingTrips" },
        { label: "Today Vehicle Reports", path: "/TodayVehicleReport" },
      ],
    },

    // { icon: User, label: "Profile", path: "/PoliceProfile" },
    { icon: LogOut, label: "Logout", onClick: logout },
  ];

  // Determine active menu
  const menuItems =
    user?.role === "admin"
      ? adminMenuItems
      : user?.role === "sp"
        ? spMenuItems
        : user?.role === "police" || user?.role === "dsp"
          ? policeMenuItems
          : citizenMenuItems;

  // Auto-open submenu if a child is active
  useEffect(() => {
    menuItems.forEach((item) => {
      if (
        item.children &&
        item.children.some((child) => location.pathname === child.path)
      ) {
        setOpenSubmenus((prev) =>
          prev.includes(item.label) ? prev : [...prev, item.label],
        );
      }
    });
  }, [location.pathname]);

  return (
    <aside
      className={cn(
        "bg-gray-900 text-white min-h-screen transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const isSubmenuOpen = openSubmenus.includes(item.label);

          const isActive =
            location.pathname === item.path ||
            (item.children &&
              item.children.some((child) => location.pathname === child.path));

          return (
            <div key={item.label} className="space-y-1">
              {hasChildren ? (
                // 📂 Menu with children
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-700 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    collapsed ? "justify-center" : "justify-between",
                  )}
                >
                  <div className="flex items-center">
                    <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && <span>{isSubmenuOpen ? "▾" : "▸"}</span>}
                </button>
              ) : item.onClick ? (
                // 🚪 Logout / Custom actions
                <>
                  <button
                    onClick={item.onClick}
                    className={cn(
                      "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors  hover:text-red-300 hover:bg-gray-800",
                      collapsed ? "justify-center" : "",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                  {/* End marker */}
                  {!collapsed && <hr className="my-2 border-gray-300" />}
                </>
              ) : (
                // 🔗 Regular navigation links
                <Link
                  to={item.path!}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-700 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    collapsed ? "justify-center" : "",
                  )}
                >
                  <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}

              {/* 🔽 Submenu rendering */}
              {!collapsed &&
                hasChildren &&
                isSubmenuOpen &&
                item.children?.map((child) => {
                  const isChildActive = location.pathname === child.path;
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={cn(
                        "ml-8 flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                        isChildActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:bg-gray-700 hover:text-white",
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
