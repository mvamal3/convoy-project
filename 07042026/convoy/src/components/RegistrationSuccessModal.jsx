// RegistrationSuccessModal.jsx
import { CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RegistrationSuccessModal({
  isOpen,
  onClose,
  userName,
  onLogin,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-green-600">
            Registration Successful!
          </DialogTitle>
          <DialogDescription className="text-gray-700 mt-2">
            {userName
              ? `${userName}, your registration is successful!`
              : "Your registration is successful!"}{" "}
            You can now log in to your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex justify-center">
          <Button onClick={onLogin} className="bg-green-600 hover:bg-green-700">
            Go to Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
