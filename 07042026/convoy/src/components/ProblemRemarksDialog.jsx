import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ProblemRemarksDialog({ open, onClose, onSubmit }) {
  const [remarks, setRemarks] = useState("");

  const handleSubmit = () => {
    if (!remarks.trim()) {
      alert("Remarks are required!");
      return;
    }
    onSubmit(remarks);
    setRemarks("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-red-600">
            🚨 Report a Problem
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Please describe the problem with this trip.
          </p>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Enter your remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProblemRemarksDialog;
