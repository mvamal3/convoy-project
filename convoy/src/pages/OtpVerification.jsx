// ... your imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    window.scrollTo(0, 0);

    const savedEmail = sessionStorage.getItem("otp_email");
    const savedMobile = sessionStorage.getItem("otp_mobile");

    if (!savedEmail && !savedMobile) {
      toast.error("OTP session expired. Please register again.");
      navigate("/register");
      return;
    }

    setEmail(savedEmail);
    setMobile(savedMobile);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: email.trim(),
        mobile: mobile.trim(),
        otp: otp.trim(),
      };
      console.log("🔍 OTP Payload:", payload);

      const res = await postCitizenOtpVerify(payload);

      if (res?.success) {
        await Swal.fire({
          icon: "success",
          title: "OTP Verified",
          text: "Your account is activated. Now you can sign in using  Email and Password your credentials.",
          confirmButtonText: "OK",
        });

        sessionStorage.removeItem("otp_email");
        sessionStorage.removeItem("otp_mobile");

        navigate("/");
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
                {email && mobile
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
                <div>
                  <Input
                    type="text"
                    maxLength={6}
                    pattern="\d*"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
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
