import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuth } from "@/contexts/AuthContext";

import { Link, useNavigate } from "react-router-dom";

import { toast } from "sonner";

import { Loader2 } from "lucide-react";

import HomeHeader from "@/include/HomeHeader";
import HomeFooter from "@/include/HomeFooter";

import Captcha from "@/components/Captcha";

import CommonInput from "@/components/inputs/CommonInput";
import CommonPasswordInput from "@/components/inputs/CommonPasswordInput";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  //const [showPassword, setShowPassword] = useState(false); // 👈 new state
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !captcha) {
      toast.error("Please fill in all fields including captcha");
      return;
    }

    try {
      const response = await login(email, password, captcha.trim());
      console.log("Login response:", response);
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Login failed";

      console.error("Login error:", message);
      toast.error(message); // ✅ show backend message
    }
  };

  useEffect(() => {
    if (user) {
      console.log("User state changed:", user);
      toast.success("Login successful!", { duration: 3000 });
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div>
      <HomeHeader />
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center px-3 py-6 md:p-8 overflow-x-hidden">
        <div className="w-full max-w-md">
          <Card className="shadow-xl rounded-lg border border-gray-100">
            <CardHeader className="text-center p-4 md:p-6">
              <CardTitle className="text-xl md:text-3xl font-semibold">
                Welcome! Login Your Account
              </CardTitle>
              <CardDescription className="text-xs md:text-sm leading-relaxed text-gray-700">
                Available for all registered Citizens, Government Agencies, and
                Private Organizations.
              </CardDescription>
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

                {/* Password with eye icon */}
                <CommonPasswordInput
                  label="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                {/* CAPTCHA */}
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

              {/* Back Button */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleBack}
                >
                  Back
                </Button>
              </div>

              {/* Register link */}
              <div className="mt-4 md:mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don’t have an account?{" "}
                  <Link
                    to="/register"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
};

export default Login;
