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
  onClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  // ✅ MOBILE DETECTION
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ AUTO COLLAPSE ON MOBILE
  const finalCollapsed = isMobile ? collapsed : collapsed;

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };
  useEffect(() => {
    if (isMobile) {
      setOpenSubmenus([]); // optional cleanup
    }
  }, [isMobile]);

  // ✅ MENUS
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
    { icon: LogOut, label: "Logout", onClick: logout },
  ];

  const policeMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/PoliceDashboard" },
    { icon: CheckSquare, label: "Departure", path: "/approvals" },
    { icon: CheckSquare, label: "Arrival", path: "/checkout" },

    {
      icon: Route,
      label: "Special Convoy Service",
      path: "#",
      children: [
        //{ label: "Departure", path: "/specialConvoydeparture" },
        { label: "Arrival", path: "/specialConvoyarrival" },
        { label: "Reports", path: "/ApprovedTrips" }, // or create dedicated page
      ],
    },
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
        { label: "Convoy Wise Report", path: "/ConveyWiseReport" },
        { label: "Arrival List", path: "/ArrivalList" },
        { label: "Arrival Reports", path: "/ViewCheckoutReport" },
        { label: "Today Vehicle Reports", path: "/TodayVehicleReport" },
      ],
    },
    { icon: Route, label: "Today's Trip Details", path: "/TodaysTripDetails" },
    { icon: User, label: "Profile", path: "/PoliceProfile" },
    { icon: LogOut, label: "Logout", onClick: logout },
  ];

  const adminMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/AdminDashboard" },
    { icon: Users, label: "Register User", path: "/PoliceRegister" },
    { icon: Users, label: "Show Registered User", path: "/RegisteredPolice" },
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
    { icon: LogOut, label: "Logout", onClick: logout },
  ];

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
      ],
    },
    { icon: LogOut, label: "Logout", onClick: logout },
  ];

  const scsMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Car, label: "Vehicles", path: "/Managevehicle" },
    { icon: Users, label: "Drivers", path: "/ManageDriver" },

    {
      icon: Route,
      label: "Special Convoy Service",
      path: "#",
      children: [
        { label: "Departure", path: "/specialConvoydeparture" },
        // { label: "Arrival", path: "/specialConvoyarrival" },
        { label: "Reports", path: "/SpecialconvoyApprovedTrips" },
      ],
    },

    { icon: Search, label: "View Trip", path: "/SearchTrip" },

    // { icon: Route, label: "Today's Trip Details", path: "/TodaysTripDetails" },

    { icon: User, label: "Profile", path: "/PoliceProfile" },

    { icon: LogOut, label: "Logout", onClick: logout },
  ];

  const menuItems =
    user?.role === "admin"
      ? adminMenuItems
      : user?.role === "sp"
        ? spMenuItems
        : user?.role === "scs"
          ? scsMenuItems
          : user?.role === "police" || user?.role === "dsp"
            ? policeMenuItems
            : citizenMenuItems;

  // ✅ AUTO OPEN SUBMENU
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
        finalCollapsed ? "w-16" : "w-64",
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
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 rounded-md text-sm font-medium",
                    isActive
                      ? "bg-blue-700 text-white"
                      : "text-gray-300 hover:bg-gray-700",
                    finalCollapsed ? "justify-center" : "justify-between",
                  )}
                >
                  <div className="flex items-center">
                    <Icon
                      className={cn("h-5 w-5", !finalCollapsed && "mr-3")}
                    />
                    {!finalCollapsed && <span>{item.label}</span>}
                  </div>
                  {!finalCollapsed && <span>{isSubmenuOpen ? "▾" : "▸"}</span>}
                </button>
              ) : item.onClick ? (
                <button
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium hover:text-red-300 hover:bg-gray-800",
                    finalCollapsed ? "justify-center" : "",
                  )}
                >
                  <Icon className={cn("h-5 w-5", !finalCollapsed && "mr-3")} />
                  {!finalCollapsed && <span>{item.label}</span>}
                </button>
              ) : (
                <Link
                  to={item.path!}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                    isActive
                      ? "bg-blue-700 text-white"
                      : "text-gray-300 hover:bg-gray-700",
                    finalCollapsed ? "justify-center" : "",
                  )}
                >
                  <Icon className={cn("h-5 w-5", !finalCollapsed && "mr-3")} />
                  {!finalCollapsed && <span>{item.label}</span>}
                </Link>
              )}

              {/* SUBMENU */}
              {/* SUBMENU */}
              {hasChildren && isSubmenuOpen && (
                <div
                  className={cn(
                    "bg-gray-800 rounded-md mt-1",
                    finalCollapsed
                      ? "absolute left-16 top-auto z-50 w-40 shadow-lg"
                      : "ml-8",
                  )}
                >
                  {item.children?.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
