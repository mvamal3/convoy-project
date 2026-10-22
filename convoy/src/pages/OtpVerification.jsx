// ... your imports
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HomeFooter from "@/include/HomeFooter";
import HomeHeader from "@/include/HomeHeader";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { postCitizenOtpVerify } from "@/contexts/PostApi";

const OtpVerification = () => {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Helper: mask email
  const maskEmail = (email) => {
    if (!email) return "";
    const [name, domain] = email.split("@");
    if (name.length <= 2) return email; // too short to mask
    return `${name[0]}${"*".repeat(name.length - 2)}${name.slice(
      -1
    )}@${domain}`;
  };

  // Helper: mask mobile number
  const maskMobile = (mobile) => {
    if (!mobile) return "";
    return mobile.replace(/\d(?=\d{4})/g, "*");
  };

  // Contact details come from the registration page via router state,
  // never from browser storage. After a reload the user types the email.
  const location = useLocation();
  const askForEmail = !location.state?.email;

  useEffect(() => {
    window.scrollTo(0, 0);

    setEmail(location.state?.email || "");
    setMobile(location.state?.mobile || "");
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email.trim())) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: email.trim(),
        mobile: mobile.trim(),
        otp: otp.trim(),
      };

      const res = await postCitizenOtpVerify(payload);

      if (res?.success) {
        await Swal.fire({
          icon: "success",
          title: "OTP Verified",
          text: "Your account is activated. Now you can sign in using  Email and Password your credentials.",
          confirmButtonText: "OK",
        });

        navigate("/", { replace: true, state: null });
      } else if (res?.success === false) {
        toast.error(res.message || "Incorrect OTP. Please try again.");
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (err) {
      toast.error(err?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    toast.info("Resend OTP clicked. Implement API call here.");
  };

  return (
    <div>
      <HomeHeader />
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl rounded-lg border border-gray-100">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <ShieldCheck className="h-14 w-14 text-blue-700" />
              </div>
              <CardTitle className="text-3xl font-semibold">
                OTP Verification
              </CardTitle>
              <CardDescription>
                {askForEmail
                  ? "Enter your registered email and the 6-digit OTP."
                  : email && mobile
                  ? `Enter the 6-digit OTP sent to ${maskEmail(
                      email
                    )} and ${maskMobile(mobile)}.`
                  : email
                  ? `Enter the 6-digit OTP sent to ${maskEmail(email)}.`
                  : `Enter the 6-digit OTP sent to ${maskMobile(mobile)}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {askForEmail && (
                  <div>
                    <Input
                      type="email"
                      maxLength={100}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Registered email"
                      className="h-12"
                      autoComplete="email"
                      required
                    />
                  </div>
                )}
                <div>
                  <Input
                    type="text"
                    maxLength={6}
                    pattern="\d*"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter OTP"
                    className="h-12 text-center tracking-widest text-xl"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>

                <Button
                  type="button"
                  onClick={handleResend}
                  variant="outline"
                  className="w-full"
                >
                  Resend OTP
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
};

export default OtpVerification;
