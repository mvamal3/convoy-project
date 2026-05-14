import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import CommonInput from "@/components/inputs/CommonInput";
import CommonDropdown from "@/components/inputs/CommonDropdown";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { handleAddVehicleAPI } from "@/contexts/PostApi";

// ✅ Static arrays - defined outside component to prevent recreation on every render
const CARGO_VEHICLE_TYPES = [
  "LMV Cargo",
  "Van",
  "Pickup Truck",
  "Truck",
  "HMV",
  "Water Tanker",
  "Oil Tanker",
  "LPG Tanker",
  "Tanker",
];

const getVehicleCategoryOptions = (userType) => {
  if (userType === 0) {
    return [
      { value: "Car", label: "Car (Max. 5 passengers)" },
      { value: "SUV", label: "SUV (Max. 7 passengers)" },
      { value: "Bus", label: "Bus" },
    ];
  }

  if ([1, 2, 3].includes(userType)) {
    return [
      { value: "Car", label: "Car (Max. 5 passengers)" },
      { value: "SUV", label: "SUV (Max. 7 passengers)" },
      { value: "LMV Cargo", label: "LMV Cargo" },
      { value: "Van", label: "Van" },
      { value: "Pickup Truck", label: "Pickup Truck" },
      { value: "Truck", label: "Truck (Max. 3 passengers)" },
      { value: "HMV", label: "HMV" },
      { value: "Bus", label: "Bus" },
      { value: "Ambulance", label: "Ambulance" },
      { value: "Mortuary Van", label: "Mortuary Van" },
      { value: "Water Tanker", label: "Water Tanker" },
      { value: "Oil Tanker", label: "Oil Tanker" },
      { value: "LPG Tanker", label: "LPG Tanker" },
      { value: "Tanker", label: "Tanker (General)" },
      { value: "Other", label: "Other" },
    ];
  }

  return [];
};

const getOwnershipOptions = (userType) => {
  if (userType === 0)
    return [
      { label: "Commercial (Yellow Board)", value: "Commercial" },
      { label: "Private (White Board)", value: "Private" },
    ];

  if (userType === 1)
    return [{ label: "Commercial (Yellow Board)", value: "Commercial" }];

  if (userType === 2) return [{ label: "Government", value: "Government" }];

  if (userType === 3)
    return [
      { label: "Government", value: "Government" },
      { label: "Commercial (Yellow Board)", value: "Commercial" },
      { label: "Private (White Board)", value: "Private" },
    ];

  return [];
};

const INITIAL_FORM_STATE = {
  v_owner_name: "",
  v_number: "",
  v_category: "",
  commercial_type: "",
  department_name: "",
  v_type: "",
  v_type_other: "",
  cargo_passenger: "cargo_passenger",
  cargo_passenger_other: "",
  v_capacity: "",
  v_loadCapacity: "",
  registration_date: "",
  status: 1,
};

export default function AddVehicle({ isOpen, onClose, onSuccessAdd }) {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const type = Number(user?.usertype); // ✅ cast to number explicitly
  const ownershipOptions = user ? getOwnershipOptions(type) : [];

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // ✅ Helper to update form fields
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isCargoVehicle = CARGO_VEHICLE_TYPES.includes(formData.v_type);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const vehicleNumber = formData.v_number.trim();
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;

    // New vehicle number validation
    if (
      vehicleNumber.length < 3 ||
      vehicleNumber.length > 10 ||
      !alphanumericRegex.test(vehicleNumber)
    ) {
      toast({
        title: "Invalid Vehicle Number",
        description:
          "Vehicle number must be 3-10 characters long and contain only letters and numbers.",
        variant: "destructive",
      });
      return; // stop submission
    }

    // Existing capacity validation
    if (
      (formData.v_type === "Car" &&
        (formData.v_capacity < 1 || formData.v_capacity > 5)) ||
      (formData.v_type === "SUV" &&
        (formData.v_capacity < 1 || formData.v_capacity > 7))
    ) {
      toast({
        title: "Invalid Capacity",
        description:
          "Car capacity must be between 1-5, SUV capacity between 1-7.",
        variant: "destructive",
      });
      return; // stop submission
    }

    // Proceed with API call if all validations pass
    handleAddVehicleAPI(formData, accessToken, () => {
      setFormData(INITIAL_FORM_STATE);
      if (typeof onSuccessAdd === "function") onSuccessAdd();
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg flex flex-col max-h-[90vh]">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg sm:text-xl font-semibold">Add Vehicle</h2>
          <button onClick={onClose} className="text-lg">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg shadow-sm">
              <h3 className="md:col-span-2 text-lg font-semibold">
                🚗 Basic Information
              </h3>
              <CommonInput
                label="Vehicle Registration Number/Plate Number"
                required
                value={formData.v_number}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();

                  if (/^[A-Z0-9]{0,10}$/.test(value)) {
                    updateField("v_number", value);
                  }
                }}
                maxLength={10}
                placeholder="Enter Vehicle Number"
              />

              <CommonInput
                label="Owner Full Name"
                required
                value={formData.v_owner_name}
                onChange={(e) => {
                  const value = e.target.value;

                  if (/^[A-Za-z\s]*$/.test(value)) {
                    updateField("v_owner_name", value);
                  }
                }}
                placeholder="Enter Owner Full Name"
                maxLength={50}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg shadow-sm">
              <h3 className="md:col-span-2 text-lg font-semibold">
                🚘 Vehicle Classification
              </h3>

              <CommonDropdown
                label="Ownership Type"
                required
                value={formData.commercial_type}
                onChange={(e) => {
                  const selected = e.target.value;
                  updateField("commercial_type", selected);
                  if (selected !== "Government") {
                    updateField("department_name", "");
                  }
                }}
                placeholder="Select Ownership Type"
                options={ownershipOptions}
              />

              {formData.commercial_type === "Government" && (
                <CommonInput
                  label="Department Name"
                  required
                  value={formData.department_name}
                  onChange={(e) =>
                    updateField("department_name", e.target.value)
                  }
                  placeholder="Enter Department Name"
                />
              )}

              <CommonDropdown
                label="Vehicle Category"
                required
                value={formData.v_type}
                onChange={(e) => {
                  updateField("v_type", e.target.value);
                  updateField("v_type_other", "");
                }}
                placeholder="Select Vehicle Category"
                options={getVehicleCategoryOptions(type)}
              />

              {formData.v_type === "Other" && (
                <CommonInput
                  label="Other Vehicle Category"
                  value={formData.v_type_other || ""}
                  onChange={(e) => updateField("v_type_other", e.target.value)}
                  placeholder="Enter Other Vehicle Category"
                />
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="w-full sm:w-1/2">
                  <CommonInput
                    label="Seating"
                    required
                    type="number"
                    value={formData.v_capacity}
                    onChange={(e) => {
                      let value = Number(e.target.value);

                      if (formData.v_type === "Car" && value > 5) value = 5;
                      if (formData.v_type === "SUV" && value > 7) value = 7;
                      if (value < 1) value = 1;

                      updateField("v_capacity", value);
                    }}
                    placeholder="Vehicle Capacity"
                  />
                </div>

                {isCargoVehicle && (
                  <div className="w-full sm:w-1/2">
                    <CommonInput
                      label="Load Capacity (Optional)"
                      value={formData.v_loadCapacity}
                      onChange={(e) =>
                        updateField("v_loadCapacity", e.target.value)
                      }
                      placeholder="e.g., 5 tons, 2000 liters"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Save Vehicle Details
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
