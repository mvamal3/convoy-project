import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, Menu } from "lucide-react";
import { getCheckpostDisplayName } from "@/utils/checkpost";
import emblem from "@/images/ANP-logo_new.png";

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  showMenuButton = false,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-2">
        {/* 🔹 LEFT */}
        <div className="flex items-center gap-2 sm:gap-4">
          {showMenuButton && (
            <Button variant="ghost" size="icon" onClick={onMenuToggle}>
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <img
            src={emblem}
            alt="Police Emblem"
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
          />

          {/* Title (Responsive) */}
          <span className="font-semibold text-sm sm:text-lg md:text-xl text-gray-900 leading-tight">
            Convoy Management
            <span className="hidden sm:inline">, Andaman Nicobar Police</span>
          </span>
        </div>

        {/* 🔹 RIGHT – USER */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hide details on very small screens */}
            <div className="hidden sm:flex items-center gap-2">
              {user.role === "police" && (
                <span className="text-xs sm:text-sm font-bold text-indigo-700">
                  {getCheckpostDisplayName(user)} Checkpost
                </span>
              )}

              <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />

              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {user.usertype === 1
                  ? user.orgName
                  : user.usertype === 2
                    ? `${user.orgName} (Govt)`
                    : user.name}
              </span>
            </div>

            {/* Role Badge */}
            <span className="hidden sm:inline text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
              {user.role}
            </span>

            {/* Logout Icon only on mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="sm:hidden"
            >
              <LogOut className="h-5 w-5" />
            </Button>

            {/* Logout full on desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="hidden sm:flex"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
