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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import HomeHeader from "@/include/HomeHeader";
import HomeFooter from "@/include/HomeFooter";

const AdminLogin = () => {
  const [userid, setUserid] = useState(""); // 👈 changed
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { AdminLogin, user, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.clear();
    window.history.replaceState(null, "", window.location.href);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userid || !password || !captcha) {
      toast.error("Please fill in all fields including captcha");
      return;
    }

    try {
      await AdminLogin(userid, password, captcha.trim()); // 👈 userid sent
    } catch (err) {
      toast.error("Login failed. Please try again.");
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      toast.success("Admin login successful!");
      navigate("/AdminDashboard");
    }
  }, [user, navigate]);

  return (
    <div>
      <HomeHeader />

      <div className="bg-gradient-to-br from-indigo-50 to-purple-100 flex justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl rounded-lg border border-gray-100">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-semibold">
                Admin Login
              </CardTitle>
              <CardDescription>Sign in to Admin Dashboard</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User ID */}
                <div>
                  <Label htmlFor="userid">
                    User ID <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="userid"
                    type="text"
                    value={userid}
                    onChange={(e) => setUserid(e.target.value)}
                    placeholder="Enter Admin User ID"
                    className="mt-1"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">
                    Password <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Captcha */}
                <Captcha onChange={setCaptcha} />

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </form>

              {/* Back */}
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <HomeFooter />
    </div>
  );
};

export default AdminLogin;
