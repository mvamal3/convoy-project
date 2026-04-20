import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ add this
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import HomeHeader from "@/include/HomeHeader";
import bg1 from "@/images/bg1.jpg";
import bg2 from "@/images/bg2.jpeg";
import bg3 from "@/images/bg3.jpeg";
//import bg4 from "@/images/bg4.jpeg";
import bg5 from "@/images/bg5.jpg";
import bg6 from "@/images/bg6.jpeg";

import HomeFooter from "@/include/HomeFooter";

import {
  Shield,
  Users,
  Car,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  CameraOff,
  Ban,
  UserX,
  CarFront,
} from "lucide-react";

const backgroundImages = [bg1, bg2, bg3, bg5, bg6];

const Landing = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Clear any user-related storage on landing
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.clear();

    // ✅ Optional: clear cookies (if needed)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
    });

    // ✅ Optional: Reset any context states if using useAuth()

    // ✅ Start background image slider
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length,
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    setCurrentImageIndex(
      currentImageIndex === 0
        ? backgroundImages.length - 1
        : currentImageIndex - 1,
    );
  };

  const handleNext = () => {
    setCurrentImageIndex(
      currentImageIndex === backgroundImages.length - 1
        ? 0
        : currentImageIndex + 1,
    );
  };

  // ...keep your existing return JSX unchanged

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <HomeHeader />

      {/* Hero Section with Sliding Background */}
      <section
        className="relative py-25 min-h-[500px] bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Section Content */}
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-80 text-black rounded-full p-3 shadow-md transition"
        >
          ‹
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-80 text-black rounded-full p-3 shadow-md transition"
        >
          ›
        </button>

        {/* Content */}
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              {/* Streamline your convoy operations with our comprehensive digital
              platform. Register vehicles, manage drivers, plan trips, and get */}
              {/* official approvals all in one place. */}
            </p>
            {/* <div className="flex justify-center space-x-4">
              <Link to="/register">
                <Button size="lg" className="px-8 py-3">
                  Register <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="px-8 py-3">
                  Sign In
                </Button>
              </Link>
            </div> */}
          </div>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Rules and Regulations
            </h2>
            <p className="text-lg text-gray-600">
              Ensure respectful and lawful conduct while passing through the
              Jarawa Tribal Reserve.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* ✅ DO's */}
            <Card className="p-6 bg-green-50 border border-green-200">
              <div className="text-green-700 text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle /> Do’s
              </div>

              <CardContent className="space-y-3 text-gray-700">
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <CarFront className="text-green-600" />
                    Travel only in convoy & drive carefully.
                  </li>

                  <li className="flex gap-2">
                    <Shield className="text-green-600" />
                    Enter reserve only via police check posts.
                  </li>

                  <li className="flex gap-2">
                    <CameraOff className="text-green-600" />
                    Switch off cameras while passing through reserve.
                  </li>

                  <li className="flex gap-2">
                    <Users className="text-green-600" />
                    Respect tribal community and follow authorities.
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* ❌ DON'Ts */}
            <Card className="p-6 bg-red-50 border border-red-200">
              <div className="text-red-700 text-xl font-semibold mb-4 flex items-center gap-2">
                <Ban /> Don’ts
              </div>

              <CardContent className="space-y-3 text-gray-700">
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <UserX className="text-red-600" />
                    Do not interact with or allow Jarawas into vehicles.
                  </li>

                  <li className="flex gap-2">
                    <Ban className="text-red-600" />
                    Do not offer food, clothes, or any items.
                  </li>

                  <li className="flex gap-2">
                    <CameraOff className="text-red-600" />
                    No photography or videography.
                  </li>

                  <li className="flex gap-2">
                    <CarFront className="text-red-600" />
                    Do not stop inside the reserve area.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Convoy Time Heading */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-800">
              Convoy Time Details
            </h3>
            <p className="text-sm text-gray-600">
              Official convoy timings from Jirkatang and Middle Strait
            </p>
          </div>

          {/* Convoy Time Section */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Jirkatang Convoy Times */}
            <Card className="p-6 bg-blue-50 border border-blue-200">
              <div className="text-blue-700 text-xl font-semibold mb-4">
                🚍 From Jirkatang
              </div>

              <CardContent className="text-gray-700 text-base">
                <ul className="space-y-2">
                  <li>
                    First Convoy – <span className="font-semibold">06:00</span>
                  </li>
                  <li>
                    Second Convoy – <span className="font-semibold">09:00</span>
                  </li>
                  <li>
                    Third Convoy – <span className="font-semibold">12:00</span>
                  </li>
                  <li>
                    Fourth Convoy – <span className="font-semibold">14:30</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Middle Strait Convoy Times */}
            <Card className="p-6 bg-purple-50 border border-purple-200">
              <div className="text-purple-700 text-xl font-semibold mb-4">
                🚍 From Middle Strait
              </div>

              <CardContent className="text-gray-700 text-base">
                <ul className="space-y-2">
                  <li>
                    First Convoy – <span className="font-semibold">06:30</span>
                  </li>
                  <li>
                    Second Convoy – <span className="font-semibold">09:30</span>
                  </li>
                  <li>
                    Third Convoy – <span className="font-semibold">12:30</span>
                  </li>
                  <li>
                    Fourth Convoy – <span className="font-semibold">15:00</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Key Features
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to manage your convoy operations efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Vehicle Management
                </h3>
                <p className="text-gray-600">
                  Register and manage your fleet of vehicles with detailed
                  documentation
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Driver Registry</h3>
                <p className="text-gray-600">
                  Maintain a comprehensive database of qualified drivers
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Trip Approval</h3>
                <p className="text-gray-600">
                  Streamlined approval process with police verification
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Secure & Compliant
                </h3>
                <p className="text-gray-600">
                  Government-grade security with full regulatory compliance
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Simple steps to get your convoy approved
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              [
                "Register & Setup",
                "Create your account and add your vehicles and drivers to the system",
              ],
              [
                "Plan Your Trip",
                "Submit trip details including route, and timeline",
              ],
              [
                "Get Approval",
                "Police authorities review and approve your convoy request",
              ],
            ].map(([title, desc], idx) => (
              <div key={idx} className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {idx + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="font-semibold">Convoy Management</span>
              </div>
              <p className="text-gray-400">
                Official Government Platform for Convoy Management and Approval
                System.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/register" className="hover:text-white">
                    Register
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white">
                    Login
                  </Link>
                </li>
                {/* <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li> */}
                <li>
                  <Link to="/PoliceLogin" className="hover:text-white">
                    Police Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@convoyms.gov</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Jirkatang Check Post, NH-4 (Andaman Trunk Road), Jirkatang,
                    Ferrargunj, South Andaman District, Andaman & Nicobar
                    Islands 744206, India
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>
              Copyright &copy; 2025 A & N Police. All Right Reserved. <br></br>
              Designed, Developed, Hosted and Maintained by NIC, Andaman State
              Unit.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
