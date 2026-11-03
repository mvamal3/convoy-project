import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import CommonPasswordInput from "@/components/inputs/CommonPasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import { changeOwnPasswordAPI } from "@/contexts/PostApi";
import { checkPassword, PASSWORD_RULES } from "@/utils/passwordPolicy";

// Any signed-in account changes its own password. The server signs the
// account out everywhere afterwards, so the user logs in again.
const ChangePassword = () => {
  const { accessToken, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error("Please enter your current password");
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
    if (newPassword === oldPassword) {
      toast.error("New password must be different from the current password");
      return;
    }

    setLoading(true);
    const res = await changeOwnPasswordAPI(accessToken, {
      oldPassword,
      newPassword,
      confirmPassword,
    });
    setLoading(false);

    if (res?.success) {
      await Swal.fire({
        icon: "success",
        title: "Password Changed",
        text: "Your password has been changed. Please login again with your new password.",
        confirmButtonText: "OK",
      });
      await logout();
    } else {
      toast.error(res?.message || "Unable to change password");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-center px-2 sm:px-4 py-6">
        <Card className="w-full max-w-md shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Change Password</CardTitle>
            <CardDescription>
              You will be signed out on all devices after the change.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <CommonPasswordInput
                label="Current Password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
              />
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
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;
