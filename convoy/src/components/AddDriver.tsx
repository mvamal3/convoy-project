import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { handleAddDriverAPI } from "@/contexts/PostApi";
import CommonDropdown from "@/components/inputs/CommonDropdown";
import CommonInput from "@/components/inputs/CommonInput";

export default function AddDriver({ isOpen, onClose, onSuccessAdd }) {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  // 4. Added loading state to prevent double submissions
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // 1. Required validation using .trim()
    if (
      !String(formData.title || "").trim() ||
      !String(formData.first_name || "").trim() ||
      !String(formData.last_name || "").trim() ||
      !String(formData.son_of || "").trim() ||
      !String(formData.license_no || "").trim() ||
      !String(formData.gender || "").trim() ||
      !String(formData.phone_no || "").trim() ||
      !String(formData.residence_of || "").trim()
    ) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    // 3. Stronger Indian phone number validation
    if (!/^[0-9]{10}$/.test(formData.phone_no)) {
      toast({
        title: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // 5. Trim string fields before sending data to the API
    const sanitizedData = {
      ...formData,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      son_of: formData.son_of.trim(),
      license_no: formData.license_no.trim(),
      residence_of: formData.residence_of.trim(),
    };

    handleAddDriverAPI(sanitizedData, accessToken, toast, () => {
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
      setIsSubmitting(false);
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
          <CommonDropdown
            label="Title"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({
                ...formData,
                title: e.target.value,
              })
            }
            options={[
              { value: "Mr", label: "Mr" },
              { value: "Ms", label: "Ms" },
              { value: "Mrs", label: "Mrs" },
            ]}
          />

          {/* First Name */}
          <CommonInput
            label="First Name"
            required
            maxLength={20}
            value={formData.first_name}
            onChange={(e) =>
              /^[A-Za-z\s.-]*$/.test(e.target.value) &&
              setFormData({
                ...formData,
                first_name: e.target.value,
              })
            }
            placeholder="Enter First Name"
          />

          {/* Last Name */}
          <CommonInput
            label="Last Name"
            required
            maxLength={20}
            value={formData.last_name}
            onChange={(e) =>
              /^[A-Za-z\s.-]*$/.test(e.target.value) &&
              setFormData({
                ...formData,
                last_name: e.target.value,
              })
            }
            placeholder="Enter Last Name"
          />

          {/* S/O Son of */}
          <CommonInput
            label="S/O Of"
            required
            maxLength={50}
            value={formData.son_of}
            onChange={(e) =>
              /^[A-Za-z\s.-]*$/.test(e.target.value) &&
              setFormData({
                ...formData,
                son_of: e.target.value,
              })
            }
            placeholder="Father / Guardian Name"
          />

          {/* Gender */}
          <CommonDropdown
            label="Gender"
            required
            value={formData.gender}
            onChange={(e) =>
              setFormData({
                ...formData,
                gender: e.target.value,
              })
            }
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ]}
          />

          {/* License No */}
          <CommonInput
            label="License No."
            required
            value={formData.license_no}
            maxLength={20}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              /^[A-Z0-9/-]{0,20}$/.test(value) &&
                setFormData({
                  ...formData,
                  license_no: value,
                });
            }}
            placeholder="Enter License Number"
          />

          {/* Phone No */}
          <CommonInput
            label="Phone No."
            required
            maxLength={10}
            value={formData.phone_no}
            onChange={(e) =>
              /^[0-9]{0,10}$/.test(e.target.value) &&
              setFormData({
                ...formData,
                phone_no: e.target.value,
              })
            }
            placeholder="Enter 10-digit Phone Number"
          />

          {/* Residence */}
          <div className="space-y-1 sm:space-y-2 sm:col-span-2 lg:col-span-4">
            <Label className="text-xs sm:text-sm">
              Residence of Driver <span className="text-red-600">*</span>
            </Label>
            {/* 2. Added basic tag striping to neutralize HTML injections */}
            <textarea
              className="w-full border border-gray-300 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
              maxLength={300}
              rows={2}
              value={formData.residence_of}
              onChange={(e) => {
                const value = e.target.value.replace(/[<>]/g, "");
                setFormData({
                  ...formData,
                  residence_of: value,
                });
              }}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs sm:text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Driver"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
