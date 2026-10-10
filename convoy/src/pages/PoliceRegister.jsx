import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import HomeFooter from "@/include/HomeFooter";
import HomeHeader from "@/include/HomeHeader";
import DashboardLayout from "@/components/layout/DashboardLayout";

import { toast } from "sonner";
import { PostPoliceRegister } from "@/contexts/PostApi";
import { useAuth } from "@/contexts/AuthContext";

import {
  getOriginDestinationsPolice,
  getPolicedesignation,
} from "@/contexts/GetApi"; // ✅ centralized API

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { validatePoliceForm, MAX } from "@/utils/policeRegisterValidation";

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-600 mt-1">{message}</p> : null;

const PoliceRegister = () => {
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    designation: "",
    emp_id: "",
    checkpost: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [checkposts, setCheckposts] = useState([]); // ✅ store API values
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [designations, setDesignations] = useState([]);
  const { accessToken, user } = useAuth();

  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // clear the error of the field being edited
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  // ✅ Fetch checkpost list from API
  useEffect(() => {
    const fetchCheckposts = async () => {
      try {
        const data = await getOriginDestinationsPolice();
        setCheckposts(data);
      } catch (err) {
        toast.error("Failed to load checkposts");
      }
    };
    fetchCheckposts();
  }, []);

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await getPolicedesignation(); // no payload needed

        if (res?.success) {
          setDesignations(res.data);
        } else {
          toast.error("Failed to load designations");
        }
      } catch (err) {
        console.error("Designation fetch error:", err);
        toast.error("Failed to load designations");
      }
    };

    fetchDesignations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Same rules as the backend DTO; returns cleaned values
    const { errors: validationErrors, values } = validatePoliceForm(formData);
    setErrors(validationErrors);

    const firstError = Object.values(validationErrors)[0];
    if (firstError) {
      toast.error(firstError);
      return;
    }

    // Only the cleaned, whitelisted fields are sent
    // (no confirmPassword; server sets status / isActive / role itself)
    try {
      setLoading(true);
      const res = await PostPoliceRegister(values, accessToken);

      if (res?.success) {
        toast.success(res.message || "Registered successfully!");
        navigate("/RegisteredPolice");
      } else {
        toast.error(res?.message || "Registration failed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">
              Police Officer Registration
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Create and manage police officer accounts
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="p-8 space-y-8">
            {/* Personal Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                Personal Details
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Title</Label>
                  <Select
                    value={formData.title}
                    onValueChange={(val) => handleChange("title", val)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select Title" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Mr", "Mrs", "Miss"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.title} />
                </div>

                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.firstName}
                    maxLength={MAX.name}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                  <FieldError message={errors.firstName} />
                </div>

                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    maxLength={MAX.name}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                  <FieldError message={errors.lastName} />
                </div>
              </div>
            </div>

            {/* Official Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                Official Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Designation *</Label>
                  <Select
                    value={formData.designation}
                    onValueChange={(val) => handleChange("designation", val)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select Designation" />
                    </SelectTrigger>

                    <SelectContent>
                      {designations.map((d) => (
                        <SelectItem key={d.id} value={d.value.toString()}>
                          {d.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.designation} />
                </div>

                <div>
                  <Label>Employee ID *</Label>
                  <Input
                    value={formData.emp_id}
                    maxLength={MAX.emp_id}
                    onChange={(e) => handleChange("emp_id", e.target.value)}
                  />
                  <FieldError message={errors.emp_id} />
                </div>
              </div>
            </div>

            {/* Location & Contact */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                Posting & Contact
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Checkpost</Label>
                  <Select
                    value={formData.checkpost}
                    onValueChange={(val) => handleChange("checkpost", val)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select Checkpost" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="1">Jirkatang</SelectItem>
                      <SelectItem value="2">Middle Strait</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.checkpost} />
                </div>

                <div>
                  <Label>Contact Number *</Label>
                  <Input
                    value={formData.contact}
                    inputMode="numeric"
                    maxLength={MAX.contact}
                    placeholder="10 digit mobile number"
                    onChange={(e) =>
                      handleChange("contact", e.target.value.replace(/\D/g, ""))
                    }
                  />
                  <FieldError message={errors.contact} />
                </div>
              </div>
            </div>

            {/* Login Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                Login Credentials
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Email */}
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    maxLength={MAX.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                  <FieldError message={errors.email} />
                </div>

                {/* Password */}
                <div className="relative">
                  <Label>Password *</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    maxLength={MAX.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Enter password"
                  />
                  <span
                    className="absolute right-3 top-9 cursor-pointer text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                  <FieldError message={errors.password} />
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Label>Confirm Password *</Label>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    maxLength={MAX.password}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    placeholder="Re-enter password"
                  />
                  <span
                    className="absolute right-3 top-9 cursor-pointer text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </span>
                  <FieldError message={errors.confirmPassword} />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-700 hover:bg-blue-800 px-10 py-2 text-white"
              >
                {loading ? "Registering..." : "Register Officer"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PoliceRegister;
