import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { landingText } from "@/utils/landingText";

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
  Languages,
  CameraOff,
  Ban,
  UserX,
  CarFront,
} from "lucide-react";

const backgroundImages = [bg1, bg2, bg3, bg5, bg6];
const LANGUAGE_KEY = "landingLanguage";
const convoyTimes = {
  jirkatang: ["06:00", "09:00", "12:00", "14:30"],
  middleStrait: ["06:30", "09:30", "12:30", "15:00"],
};

const Landing = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANGUAGE_KEY) === "hi" ? "hi" : "en";
    } catch {
      return "en";
    }
  });
  const t = landingText[lang];

  // Screen readers need the page language; every other page is English.
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = "en";
    };
  }, [lang]);

  const changeLanguage = (next) => {
    setLang(next);
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still applies until the page is left.
    }
  };

  useEffect(() => {
    // ✅ Clear any leftover session storage on landing
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

  // The UX4G panel sits outside React; a portal keeps its file unchanged and
  // removes this tile on pages that are not translated.
  const accessibilityPanel = document.querySelector("#uw-main .uwaw-features");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {accessibilityPanel &&
        createPortal(
          <div className="uwaw-features__item">
            <button
              type="button"
              className="uwaw-features__item__i"
              lang={lang === "en" ? "hi" : "en"}
              aria-label={
                lang === "en" ? "हिंदी में बदलें (Change to Hindi)" : "Change to English"
              }
              onClick={() => changeLanguage(lang === "en" ? "hi" : "en")}
            >
              <span className="uwaw-features__item__icon">
                <Languages aria-hidden="true" />
              </span>
              <span className="uwaw-features__item__name">
                {lang === "en" ? "हिंदी" : "English"}
              </span>
            </button>
          </div>,
          accessibilityPanel,
        )}

      {/* Header */}
      <HomeHeader lang={lang} onLangChange={changeLanguage} />

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
              {t.rulesTitle}
            </h2>
            <p className="text-lg text-gray-600">{t.rulesIntro}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* ✅ DO's */}
            <Card className="p-6 bg-green-50 border border-green-200">
              <div className="text-green-700 text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle /> {t.dosTitle}
              </div>

              <CardContent className="space-y-3 text-gray-700">
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <CarFront className="text-green-600" />
                    {t.dos[0]}
                  </li>

                  <li className="flex gap-2">
                    <Shield className="text-green-600" />
                    {t.dos[1]}
                  </li>

                  <li className="flex gap-2">
                    <CameraOff className="text-green-600" />
                    {t.dos[2]}
                  </li>

                  <li className="flex gap-2">
                    <Users className="text-green-600" />
                    {t.dos[3]}
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* ❌ DON'Ts */}
            <Card className="p-6 bg-red-50 border border-red-200">
              <div className="text-red-700 text-xl font-semibold mb-4 flex items-center gap-2">
                <Ban /> {t.dontsTitle}
              </div>

              <CardContent className="space-y-3 text-gray-700">
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <UserX className="text-red-600" />
                    {t.donts[0]}
                  </li>

                  <li className="flex gap-2">
                    <Ban className="text-red-600" />
                    {t.donts[1]}
                  </li>

                  <li className="flex gap-2">
                    <CameraOff className="text-red-600" />
                    {t.donts[2]}
                  </li>

                  <li className="flex gap-2">
                    <CarFront className="text-red-600" />
                    {t.donts[3]}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Convoy Time Heading */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-800">
              {t.convoyTitle}
            </h3>
            <p className="text-sm text-gray-600">{t.convoyIntro}</p>
          </div>

          {/* Convoy Time Section */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Jirkatang Convoy Times */}
            <Card className="p-6 bg-blue-50 border border-blue-200">
              <div className="text-blue-700 text-xl font-semibold mb-4">
                🚍 {t.fromJirkatang}
              </div>

              <CardContent className="text-gray-700 text-base">
                <ul className="space-y-2">
                  {convoyTimes.jirkatang.map((time, i) => (
                    <li key={time}>
                      {t.convoyNames[i]} –{" "}
                      <span className="font-semibold">{time}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Middle Strait Convoy Times */}
            <Card className="p-6 bg-purple-50 border border-purple-200">
              <div className="text-purple-700 text-xl font-semibold mb-4">
                🚍 {t.fromMiddleStrait}
              </div>

              <CardContent className="text-gray-700 text-base">
                <ul className="space-y-2">
                  {convoyTimes.middleStrait.map((time, i) => (
                    <li key={time}>
                      {t.convoyNames[i]} –{" "}
                      <span className="font-semibold">{time}</span>
                    </li>
                  ))}
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
              {t.featuresTitle}
            </h2>
            <p className="text-lg text-gray-600">{t.featuresIntro}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t.features[0][0]}
                </h3>
                <p className="text-gray-600">{t.features[0][1]}</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t.features[1][0]}
                </h3>
                <p className="text-gray-600">{t.features[1][1]}</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t.features[2][0]}
                </h3>
                <p className="text-gray-600">{t.features[2][1]}</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t.features[3][0]}
                </h3>
                <p className="text-gray-600">{t.features[3][1]}</p>
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
              {t.howTitle}
            </h2>
            <p className="text-lg text-gray-600">{t.howIntro}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.steps.map(([title, desc], idx) => (
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
      <HomeFooter lang={lang} />
    </div>
  );
};

export default Landing;
