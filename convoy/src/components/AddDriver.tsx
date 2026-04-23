import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { handleAddDriverAPI } from "@/contexts/PostApi";

export default function AddDriver({ isOpen, onClose, onSuccessAdd }) {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    first_name: "",
    last_name: "",
    license_no: "",
    son_of: "",
    gender: "",
    phone_no: "",
    residence_of: "",
    is_owner: false,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.son_of ||
      !formData.license_no ||
      !formData.gender ||
      !formData.phone_no ||
      !formData.residence_of
    ) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    //console.log("formdatsssa", formData);

    handleAddDriverAPI(formData, accessToken, toast, () => {
      toast({ title: "Driver added successfully" });
      setFormData({
        title: "",
        first_name: "",
        last_name: "",
        license_no: "",
        son_of: "",
        gender: "",
        phone_no: "",
        residence_of: "",
        is_owner: false,
      });
      if (typeof onSuccessAdd === "function") onSuccessAdd();
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto p-2 sm:p-0">
      <div className="bg-white p-3 sm:p-6 rounded-lg w-full max-w-4xl mx-auto my-auto max-h-[90vh] overflow-y-auto">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
          Add Driver
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
        >
          {/* Title */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">
              Title <span className="text-red-600">*</span>
            </Label>
            <select
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <option value="">Select</option>
              <option value="Mr">Mr</option>
              <option value="Ms">Ms</option>
              <option value="Mrs">Mrs</option>
            </select>
          </div>

          {/* First Name */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">
              First Name <span className="text-red-600">*</span>
            </Label>
            <Input
              value={formData.first_name}
              onChange={(e) =>
                /^[A-Za-z\s]*$/.test(e.target.value) &&
                setFormData({ ...formData, first_name: e.target.value })
              }
              placeholder="Enter First Name"
              className="h-9 sm:h-10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">
              Last Name <span className="text-red-600">*</span>
            </Label>
            <Input
              value={formData.last_name}
              onChange={(e) =>
                /^[A-Za-z\s]*$/.test(e.target.value) &&
                setFormData({ ...formData, last_name: e.target.value })
              }
              placeholder="Enter Last Name"
              className="h-9 sm:h-10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            />
          </div>

          {/* S/O Son of */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">
              S/O f <span className="text-red-600">*</span>
            </Label>
            <Input
              value={formData.son_of}
              onChange={(e) =>
                /^[A-Za-z\s]*$/.test(e.target.value) &&
                setFormData({ ...formData, son_of: e.target.value })
              }
              placeholder="Father / Guardian Name"
              className="h-9 sm:h-10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">
              Gender <span className="text-red-600">*</span>
            </Label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* License No */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">
              License No. <span className="text-red-600">*</span>
            </Label>
            <Input
              value={formData.license_no}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                /^[A-Z0-9]{0,12}$/.test(value) &&
                  setFormData({ ...formData, license_no: value });
              }}
              placeholder="Enter License Number"
              className="h-9 sm:h-10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            />
          </div>

          {/* Phone No */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">
              Phone No. <span className="text-red-600">*</span>
            </Label>
            <Input
              value={formData.phone_no}
              onChange={(e) =>
                /^[0-9]{0,10}$/.test(e.target.value) &&
                setFormData({ ...formData, phone_no: e.target.value })
              }
              maxLength={10}
              placeholder="Enter 10-digit Phone Number"
              className="h-9 sm:h-10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            />
          </div>

          {/* Residence */}
          <div className="space-y-1 sm:space-y-2 sm:col-span-2 lg:col-span-4">
            <Label className="text-xs sm:text-sm">
              Residence of Driver <span className="text-red-600">*</span>
            </Label>
            <textarea
              className="w-full border border-gray-300 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
              rows={2}
              value={formData.residence_of}
              onChange={(e) =>
                setFormData({ ...formData, residence_of: e.target.value })
              }
              placeholder="Enter Residence"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs sm:text-sm">
              Add Driver
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
