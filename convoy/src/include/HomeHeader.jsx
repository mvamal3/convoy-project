import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import emblem from "@/images/ANP-logo_new.png";

export default function HomeHeader() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      {/* 🔹 Top Bar */}
      <div className="bg-gray-100 py-1 px-3 text-xs text-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm font-semibold text-blue-900">
            भारत सरकार | Government of India
          </span>
        </div>
      </div>

      {/* 🔹 Main Header */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 py-3 px-3 text-center">
        {/* Logo */}
        <img
          src={emblem}
          alt="Police Emblem"
          className="w-14 h-16 md:w-[90px] md:h-[120px] object-contain cursor-pointer"
          onClick={() => navigate("/")}
        />

        {/* Title */}
        <div>
          <h1 className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">
            कॉन्वॉय मैनेजमेंट सिस्टम
          </h1>
          <h1 className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">
            Convoy Management System
          </h1>

          <p className="text-xs sm:text-sm md:text-lg font-semibold text-gray-800">
            अंडमान निकोबार पुलिस
          </p>
          <p className="text-xs sm:text-sm md:text-lg font-semibold text-gray-800">
            Andaman and Nicobar Police
          </p>
        </div>
      </div>

      {/* 🔹 Navbar */}
      <nav className="bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Mobile Menu Button */}
          <div className="flex justify-between items-center py-3 md:hidden">
            <span className="font-semibold">Menu</span>
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Menu Items */}
          <ul
            className={`${
              menuOpen ? "block" : "hidden"
            } md:flex md:justify-center md:items-center md:space-x-8 text-sm md:text-base font-semibold pb-4 md:pb-0`}
          >
            {[
              { to: "/", label: "Home" },
              { to: "/login", label: "User Login" },
              { to: "/Register", label: "Register" },
              { to: "/PoliceLogin", label: "Police Login" },
            ].map(({ to, label }) => (
              <li key={label} className="py-2 md:py-4 text-center">
                <Link
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 hover:text-yellow-400 hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
