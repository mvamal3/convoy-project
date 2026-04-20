import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { handleAddVehicleAPI } from "@/contexts/PostApi";

export default function AddVehicle({ isOpen, onClose, onSuccessAdd }) {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const type = Number(user?.usertype); // ✅ cast to number explicitly
  const getOwnershipOptions = () => {
    const type = Number(user?.usertype);

    if (type === 0)
      return [
        { label: "Commercial (Yellow Board)", value: "Commercial" },
        { label: "Private (White Board)", value: "Private" },
      ];

    if (type === 1)
      return [{ label: "Commercial (Yellow Board)", value: "Commercial" }];

    if (type === 2) return [{ label: "Government", value: "Government" }];

    return [];
  };

  const ownershipOptions = user ? getOwnershipOptions() : [];

  const [formData, setFormData] = useState({
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
  });

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
      setFormData({
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
      });

      if (typeof onSuccessAdd === "function") onSuccessAdd();
    });
  };

  {
    (formData.v_type === "Car" || formData.v_type === "SUV") &&
      formData.v_capacity && (
        <p className="text-xs text-red-500">
          {formData.v_type === "Car" &&
            formData.v_capacity > 5 &&
            "Max capacity for Car is 5"}
          {formData.v_type === "SUV" &&
            formData.v_capacity > 7 &&
            "Max capacity for SUV is 7"}
        </p>
      );
  }
  // Inside your handleInputChange function or directly in JSX:
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "vSeating") {
      const numValue = parseInt(value) || 0;

      // Get current vehicle category (Car, SUV, etc.)
      const vCat = formData.vCat;

      // Apply auto-limit rules
      if (vCat === "Car" && numValue > 5) {
        newValue = 5;
      } else if (vCat === "SUV" && numValue > 7) {
        newValue = 7;
      } else if (numValue < 1) {
        newValue = 1;
      } else {
        newValue = numValue;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
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
              <div className="space-y-2">
                <Label htmlFor="v_number">
                  Vehicle Registration Number/Plate Number{" "}
                  <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="v_number"
                  value={formData.v_number}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase(); // ✅ convert to uppercase
                    // Allow only alphabets and numbers (max 10 characters)
                    if (/^[A-Z0-9]{0,10}$/.test(value)) {
                      setFormData({ ...formData, v_number: value });
                    }
                  }}
                  maxLength={10}
                  placeholder="Enter Vehicle Number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_full_name">
                  Owner Full Name<span className="text-red-600">*</span>
                </Label>
                <Input
                  id="owner_full_name"
                  value={formData.v_owner_name}
                  onChange={(e) => {
                    const value = e.target.value;
                    // ✅ Allow only alphabets and spaces (no numbers or special characters)
                    if (/^[A-Za-z\s]*$/.test(value)) {
                      setFormData({ ...formData, v_owner_name: value });
                    }
                  }}
                  placeholder="Enter Owner Full Name"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg shadow-sm">
              <h3 className="md:col-span-2 text-lg font-semibold">
                🚘 Vehicle Classification
              </h3>

              <div className="space-y-2">
                <Label htmlFor="commercial_type">
                  Ownership Type<span className="text-red-600">*</span>
                </Label>
                <select
                  id="commercial_type"
                  value={formData.commercial_type}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setFormData({
                      ...formData,
                      commercial_type: selected,
                      department_name:
                        selected === "Government"
                          ? formData.department_name
                          : "",
                    });
                  }}
                  className="w-full border rounded p-2"
                  disabled={ownershipOptions.length === 0}
                >
                  <option value="">-- Select --</option>
                  {ownershipOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {formData.commercial_type === "Government" && (
                  <div className="w-full">
                    <Label htmlFor="department_name">
                      Department Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="department_name"
                      className="mt-2"
                      placeholder="Enter Department Name"
                      value={formData.department_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department_name: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="v_type">
                  Vehicle Category <span className="text-red-600">*</span>
                </Label>
                <select
                  id="v_type"
                  value={formData.v_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      v_type: e.target.value,
                      v_type_other: "",
                    })
                  }
                  className="w-full border rounded p-2"
                >
                  <option value="">-- Select --</option>

                  {type === 0 && (
                    <>
                      <option value="Car">Car (Max. 5 passengers)</option>
                      <option value="SUV">SUV (Max. 7 passengers)</option>
                      <option value="Bus">Bus</option>
                    </>
                  )}

                  {type === 1 && (
                    <>
                      <option value="Car">Car (Max. 5 passengers)</option>
                      <option value="SUV">SUV (Max. 7 passengers)</option>

                      <option value="LMV Cargo">LMV Cargo</option>

                      <option value="Van">Van</option>
                      <option value="Pickup Truck">Pickup Truck</option>

                      <option value="Truck">Truck (Max. 3 passengers)</option>
                      <option value="HMV">HMV</option>

                      <option value="Bus">Bus</option>
                      <option value="Ambulance">Ambulance</option>
                      <option value="Mortuary Van">Mortuary Van</option>

                      <option value="Water Tanker">Water Tanker</option>
                      <option value="Oil Tanker">Oil Tanker</option>
                      <option value="LPG Tanker">LPG Tanker</option>

                      <option value="Other">Other</option>
                    </>
                  )}

                  {type === 2 && (
                    <>
                      <option value="Car">Car (Max. 5 passengers)</option>
                      <option value="SUV">SUV (Max. 7 passengers)</option>

                      <option value="LMV Cargo">LMV Cargo</option>

                      <option value="Van">Van</option>
                      <option value="Pickup Truck">Pickup Truck</option>

                      <option value="Truck">Truck (Max. 3 passengers)</option>
                      <option value="HMV">HMV</option>

                      <option value="Bus">Bus</option>
                      <option value="Ambulance">Ambulance</option>
                      <option value="Mortuary Van">Mortuary Van</option>

                      <option value="Water Tanker">Water Tanker</option>
                      <option value="Oil Tanker">Oil Tanker</option>
                      <option value="LPG Tanker">LPG Tanker</option>

                      <option value="Tanker">Tanker (General)</option>

                      <option value="Other">Other</option>
                    </>
                  )}
                </select>

                {formData.v_type === "Other" && (
                  <Input
                    placeholder="Enter Other Vehicle Category"
                    value={formData.v_type_other || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, v_type_other: e.target.value })
                    }
                  />
                )}
              </div>

              {/* <div className="space-y-2">
              <Label htmlFor="cargo_passenger">Vehicle Purpose</Label>
              <select
                id="cargo_passenger"
                value={formData.cargo_passenger}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cargo_passenger: e.target.value,
                    cargo_passenger_other: "",
                  })
                }
                className="w-full border rounded p-2"
              >
                <option value="">-- Select --</option>
                <option value="Passenger">Passenger</option>
                <option value="Cargo">Cargo</option>
                <option value="Other">Other</option>
              </select>
              {formData.cargo_passenger === "Other" && (
                <Input
                  placeholder="Enter Other Purpose"
                  value={formData.cargo_passenger_other || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cargo_passenger_other: e.target.value,
                    })
                  }
                />
              )}
            </div> */}

              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
                <div className="flex flex-col space-y-1 w-full sm:w-1/2">
                  <Label htmlFor="v_capacity" className="text-xs">
                    Seating <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="number"
                    id="v_capacity"
                    value={formData.v_capacity}
                    onChange={(e) => {
                      let value = Number(e.target.value);

                      // ✅ Auto-limit based on type
                      if (formData.v_type === "Car" && value > 5) value = 5;
                      if (formData.v_type === "SUV" && value > 7) value = 7;

                      // ✅ Prevent negative or zero
                      if (value < 1) value = 1;

                      setFormData({ ...formData, v_capacity: value });
                    }}
                    placeholder="Vehicle Capacity"
                    className="h-8 text-sm"
                  />
                </div>
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
