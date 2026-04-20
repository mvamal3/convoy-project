import { useNavigate, Link } from "react-router-dom";
import { Search, SkipForward, Accessibility, Globe } from "lucide-react";
import emblem from "@/images/ANP-logo_new.png"; // Police Logo Right
import emblem1 from "@/images/emblem.png"; // Emblem Left

export default function HomeHeader() {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm relative">
      {/* 🔹 Top Utility Bar */}
      <div className="bg-gray-100 py-1 px-4">
        <div className="flex justify-between items-center text-xs text-gray-700 pr-4 pt-2">
          <div className="text-sm font-semibold text-blue-900">
            भारत सरकार | Government of India
          </div>
          <div className="flex items-center gap-4 text-xs">
            {/* {[
              ["Site", Search],
              ["Skip", SkipForward],
              ["Accessibility", Accessibility],
              ["Social", Globe],
            ].map(([label, Icon]) => (
              <div
                key={label}
                className="flex items-center hover:text-blue-700 cursor-pointer"
              >
                <span>{label}</span>
                <Icon className="w-4 h-4 ml-1" />
              </div>
            ))} */}
          </div>
        </div>
      </div>

      {/* 🔹 Header Content */}
      <div className="flex items-center justify-center gap-6 py-2">
        {/* Left Emblem */}
        <img
          src={emblem}
          alt="Police Emblem Left"
          style={{ width: "90px", height: "120px", cursor: "pointer" }}
          className="object-contain"
          onClick={() => navigate("/")} // 🔁 change route as needed
        />

        {/* Center Text */}
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-side text-gray-900">
            कॉन्वॉय मैनेजमेंट सिस्टम
          </h1>
          <h1 className="text-2xl font-bold uppercase tracking-side text-gray-900">
            Convoy Management System
          </h1>
          <p className="uppercaser text-lg text-gray-900 font-serif font bold">
            अंडमान निकोबार पुलिस
          </p>
          <p className="uppercaser text-lg text-gray-900 font-serif font bold">
            Andaman and Nicobar Police
          </p>
          {/* <p className="uppercase text-sm text-gray-700 mt-1 font-serif font-bold">
            अंडमान निकोबार पुलिस
          </p> */}
        </div>

        {/* Right Emblem */}
        {/* <img
          src={emblem1}
          alt="Police Emblem Right"
          style={{ width: "70px", height: "85px" }}
          className="object-contain"
        /> */}
      </div>

      <nav className="bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900 text-[#f8f9fa] shadow-xl border-b border-blue-700  relative z-50">
        {" "}
        <div className="max-w-7xl mx-auto px-6">
          {" "}
          <ul className="flex flex-wrap justify-center items-center space-x-10 text-[16px] font-semibold py-4 tracking-wide">
            {" "}
            {[
              { to: "/", label: "Home" },
              { to: "/login", label: "User Login" },
              { to: "/Register", label: "Register" },
              // { to: "/login", label: "Department Login" },
              { to: "/PoliceLogin", label: "Police Login" },
            ].map(({ to, label }) => (
              <li key={label}>
                {" "}
                {to.startsWith("#") ? (
                  <a
                    href={to}
                    className="px-4 py-2 rounded cursor-pointer transition-colors duration-300 hover:text-yellow-400 hover:underline underline-offset-4"
                  >
                    {" "}
                    {label}{" "}
                  </a>
                ) : (
                  <Link
                    to={to}
                    className="px-4 py-2 rounded cursor-pointer transition-colors duration-300 hover:text-yellow-400 hover:underline underline-offset-4"
                  >
                    {" "}
                    {label}{" "}
                  </Link>
                )}{" "}
              </li>
            ))}{" "}
          </ul>{" "}
        </div>{" "}
      </nav>
    </header>
  );
}
