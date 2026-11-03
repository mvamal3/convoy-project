import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import HomeHeader from "@/include/HomeHeader";
import HomeFooter from "@/include/HomeFooter";
import Captcha from "@/components/Captcha";
import CommonInput from "@/components/inputs/CommonInput";
import CommonPasswordInput from "@/components/inputs/CommonPasswordInput";
import { forgotPasswordAPI, resetPasswordAPI } from "@/contexts/PostApi";
import { checkPassword, PASSWORD_RULES } from "@/utils/passwordPolicy";

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const RESEND_SECONDS = 60;

// Forgot password for citizens (/ForgotPassword) and police
// (/ForgotPassword?type=police). Step 1 sends an OTP to the registered
// mobile/email; step 2 sets a new password with that OTP.
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const accountType = params.get("type") === "police" ? "police" : "user";
  const loginPath = accountType === "police" ? "/PoliceLogin" : "/login";

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [refreshCaptcha, setRefreshCaptcha] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const newCaptcha = () => {
    setCaptcha("");
    setRefreshCaptcha((prev) => !prev);
  };

  const requestOtp = async (e) => {
    e.preventDefault();

    if (!EMAIL.test(email.trim())) {
      toast.error("Please enter your registered email address.");
      return;
    }
    if (!/^\d{6}$/.test(captcha)) {
      toast.error("Please enter the 6-digit numeric CAPTCHA");
      return;
    }

    setLoading(true);
    const res = await forgotPasswordAPI({
      accountType,
      email: email.trim(),
      captcha,
    });
    setLoading(false);
    newCaptcha();

    if (res?.success) {
      toast.success(res.message);
      setStep(2);
      setResendIn(RESEND_SECONDS);
    } else {
      toast.error(res?.message || "Unable to send OTP. Please try again.");
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }
    const passwordError = checkPassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await resetPasswordAPI({
      accountType,
      email: email.trim(),
      otp,
      newPassword,
      confirmPassword,
    });
    setLoading(false);

    if (res?.success) {
      toast.success(res.message || "Password reset successfully.");
      navigate(loginPath, { replace: true });
    } else {
      toast.error(res?.message || "Unable to reset password.");
    }
  };

  // Resending needs a fresh CAPTCHA, so go back to step 1
  const resend = () => {
    setOtp("");
    setStep(1);
  };

  return (
    <div>
      <HomeHeader />
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center px-3 py-6 md:p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl rounded-lg border border-gray-100">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <KeyRound className="h-12 w-12 text-blue-700" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-semibold">
                Forgot Password
              </CardTitle>
              <CardDescription>
                {step === 1
                  ? `Enter the email of your ${accountType === "police" ? "police" : "citizen"} account. An OTP will be sent to your registered mobile number and email.`
                  : "Enter the OTP you received and choose a new password."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {step === 1 ? (
                <form onSubmit={requestOtp} className="space-y-5">
                  <CommonInput
                    label="Email Address"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                  />
                  <Captcha
                    onChange={setCaptcha}
                    value={captcha}
                    refreshTrigger={refreshCaptcha}
                  />
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={loading || resendIn > 0}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {resendIn > 0 ? `Send OTP again in ${resendIn}s` : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={resetPassword} className="space-y-5">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      OTP <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter 6-digit OTP"
                      className="h-11 text-center tracking-widest text-lg"
                      autoComplete="one-time-code"
                    />
                  </div>
                  <CommonPasswordInput
                    label="New Password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <CommonPasswordInput
                    label="Confirm New Password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                  <p className="text-xs text-gray-500">{PASSWORD_RULES}.</p>
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset Password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={resend}
                    disabled={resendIn > 0}
                  >
                    {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                  </Button>
                </form>
              )}

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate(loginPath)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
};

export default ForgotPassword;
