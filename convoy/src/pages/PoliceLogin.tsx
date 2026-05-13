import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Captcha from "@/components/Captcha";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // 👁️ added icons
import HomeHeader from "@/include/HomeHeader";
import HomeFooter from "@/include/HomeFooter";
import CommonInput from "@/components/inputs/CommonInput";
import CommonPasswordInput from "@/components/inputs/CommonPasswordInput";
const PoliceLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [showPassword, setShowPassword] = useState(false); // 👈 added
  const { Policelogin, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !captcha) {
      toast.error("Please fill in all fields including captcha");
      return;
    }

    try {
      await Policelogin(email, password, captcha.trim());
      // success handled in useEffect
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Login failed";

      // if (message == "Invalid credentials") {
      //   console.log("test error");
      // }

      console.error("Login error:", message);
      toast.error(message); // ✅ show backend message
    }
  };

  useEffect(() => {
    if (!user) return;

    if (user.role === "police") {
      navigate("/PoliceDashboard");
    } else if (user.role === "sp") {
      navigate("/SpDashboard");
    } else if (user.role === "admin") {
      navigate("/AdminDashboard");
    } else if (user.role === "scs") {
      navigate("/PoliceDashboard");
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <div>
      <HomeHeader />
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center px-3 py-6 md:p-8 overflow-x-hidden">
        <div className="w-full max-w-md">
          <Card className="shadow-lg rounded-lg border border-gray-100">
            <CardHeader className="text-center p-4 md:p-6">
              <CardTitle className="text-xl md:text-3xl font-semibold">
                Police Login
              </CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Email */}
                <CommonInput
                  label="Email Address"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />

                {/* Password */}
                <CommonPasswordInput
                  label="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />

                {/* Captcha */}
                <Captcha onChange={setCaptcha} />

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </form>

              {/* Links */}
              <div className="flex justify-between items-center mt-4 md:mt-5 text-sm">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-gray-600 hover:text-gray-800 hover:underline"
                >
                  ← Back
                </button>

                {/* <button
                  type="button"
                  onClick={() => navigate("/AdminLogin")}
                  className="text-blue-600 font-medium hover:text-blue-800 hover:underline"
                >
                  Admin Login
                </button> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
};

export default PoliceLogin;
