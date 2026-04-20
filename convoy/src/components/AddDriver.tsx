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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl">
        <h2 className="text-lg font-semibold mb-4">Add Driver</h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {/* Title */}
          <div className="space-y-2">
            <Label>
              Title <span className="text-red-600">*</span>
            </Label>
            <select
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full h-10 rounded-md border border-input bg-background px-2 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="Mr">Mr</option>
              <option value="Ms">Ms</option>
              <option value="Mrs">Mrs</option>
            </select>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label>
              First Name <span className="text-red-600">*</span>
            </Label>
            <Input
              value={formData.first_name}
              onChange={(e) =>
                /^[A-Za-z\s]*$/.test(e.target.value) &&
                setFormData({ ...formData, first_name: e.target.value })
              }
              placeholder="Enter First Name"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label>
              Last Name <span className="text-red-600">*</span>
            </Label>
            <Input
              value={formData.last_name}
              onChange={(e) =>
                /^[A-Za-z\s]*$/.test(e.target.value) &&
                setFormData({ ...formData, last_name: e.target.value })
              }
              placeholder="Enter Last Name"
            />
          </div>

          {/* S/O Son of */}
          <div className="space-y-2">
            <Label>
              S/O f <span className="text-red-600">*</span>
            </Label>
            <Input
              value={formData.son_of}
              onChange={(e) =>
                /^[A-Za-z\s]*$/.test(e.target.value) &&
                setFormData({ ...formData, son_of: e.target.value })
              }
              placeholder="Father / Guardian Name"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>
              Gender <span className="text-red-600">*</span>
            </Label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* License No */}
          <div className="space-y-2">
            <Label>
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
            />
          </div>

          {/* Phone No */}
          <div className="space-y-2">
            <Label>
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
            />
          </div>

          {/* Residence */}
          <div className="space-y-2">
            <Label>
              Residence of Driver <span className="text-red-600">*</span>
            </Label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={2}
              value={formData.residence_of}
              onChange={(e) =>
                setFormData({ ...formData, residence_of: e.target.value })
              }
              placeholder="Enter Residence"
            />
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Driver</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
