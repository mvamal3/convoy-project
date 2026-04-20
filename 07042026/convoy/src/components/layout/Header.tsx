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
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button variant="ghost" size="icon" onClick={onMenuToggle}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center space-x-2">
            {/* <div className="text-3xl">🚗</div> */}
            <img
              src={emblem}
              alt="Police Emblem"
              className="h-10 w-10 object-contain"
            />

            <span className="font-semibold text-xl text-gray-900">
              Convoy Management, Andaman Nicobar Police
            </span>
          </div>
        </div>

        {/* Right – User Info */}
        {user && (
          <div className="flex items-center space-x-4">
            {/* <User className="h-5 w-5 text-gray-600" /> */}

            {/* Username + Checkpost inline */}
            <div className="flex items-center space-x-2">
              {user.role === "police" && (
                <span className="text-sm font-bold text-indigo-700">
                  {getCheckpostDisplayName(user)} Checkpost
                </span>
              )}
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user.usertype === 1
                  ? user.orgName
                  : user.usertype === 2
                  ? `${user.orgName} (Govt)`
                  : user.name}
              </span>

              {/* {user.role === "police" && (
                <span className="text-sm font-semibold text-indigo-700">
                  | {getCheckpostDisplayName(user)} Checkpost
                </span>
              )} */}
            </div>

            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
              {user.role}
            </span>

            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
