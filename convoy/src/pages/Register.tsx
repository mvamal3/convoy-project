import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import HomeFooter from "@/include/HomeFooter";
import HomeHeader from "@/include/HomeHeader";
import { toast } from "sonner";
import Swal from "sweetalert2";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getDistricts, getSubDistricts, getVillages } from "@/contexts/GetApi";
import { PostRegister } from "@/contexts/PostApi"; // ✅ use centralized API

const Register = () => {
  const [formData, setFormData] = useState({
    isorg: "",
    title: "",
    name: "",
    lastName: "",
    orgName: "",
    docIdtype: "",
    docId: "",
    ownContact: "",
    ownAddress: "",
    district: "",
    govtdeptName: "",
    govtsubcat: "",
    subdistrict: "",
    village: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const data = await getDistricts();
        setDistricts(data);
      } catch (err) {
        console.error("Failed to load districts:", err);
      }
    };
    loadDistricts();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDistrictChange = async (value) => {
    handleChange("district", value);
    handleChange("subdistrict", "");
    handleChange("village", "");
    const subs = await getSubDistricts(value);
    setSubdistricts(subs);
    setVillages([]);
  };

  const handleSubdistrictChange = async (value) => {
    handleChange("subdistrict", value);
    handleChange("village", "");
    const vils = await getVillages(value);
    setVillages(vils);
  };
  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = [];

    // Trim values for validation
    const title = formData.title?.trim();
    const firstName = formData.name?.trim();
    const lastName = formData.lastName?.trim();
    const ownContact = formData.ownContact?.trim();
    const ownAddress = formData.ownAddress?.trim();
    const email = formData.email?.trim();
    const password = formData.password?.trim();

    // Required fields check
    if (!title) errors.push("Title is required");
    if (!firstName) errors.push("First name is required");
    if (!lastName) errors.push("Last name is required");
    if (!ownContact) errors.push("Owner contact is required");
    if (!ownAddress) errors.push("Owner address is required");
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");
    if (!formData.district) errors.push("District is required");
    if (!formData.subdistrict) errors.push("Subdistrict is required");
    if (!formData.village) errors.push("Village is required");

    // For organization and government types, check orgName or department presence
    if (
      (formData.isorg === "1" || formData.isorg === "2") &&
      !formData.orgName
    ) {
      errors.push(
        formData.isorg === "1"
          ? "Organization Name is required"
          : "Department is required",
      );
    }

    // Mobile number validation: maximum 10 digits
    if (ownContact && !/^\d{1,10}$/.test(ownContact)) {
      errors.push("Mobile number must be at most 10 digits");
    }

    // Email format validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format");
    }

    // Password length validation
    if (password && password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    // Password confirmation
    if (password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (errors.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Please fix the following errors:",
        html: `
        <ul style="text-align:left; color:#b91c1c; font-size:14px;">
          ${errors.map((err) => `<li>• ${err}</li>`).join("")}
        </ul>
      `,
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
      return;
    }

    // Prepare payload
    const payload = {
      title: formData.title,
      firstName: formData.name,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      ownContact: formData.ownContact,
      ownAddress: formData.ownAddress,
      isOrg: parseInt(formData.isorg, 10),
      orgName: formData.orgName,
      docId: formData.docId,
      docIdtype: formData.docIdtype,
      district_code: parseInt(formData.district),
      subdistrict_code: parseInt(formData.subdistrict),
      village_code: parseInt(formData.village),
      govtdeptName: formData.govtdeptName,
      govtsubcat: formData.govtsubcat,
    };

    try {
      setLoading(true);

      //console.log("payyload",payload);
      await PostRegister(payload, navigate);
    } catch (err) {
      // error toast already handled
    } finally {
      setLoading(false);
    }
  };

  // Conditional rendering sections order
  const OrganizationDetailsSection = (
    <div>
      <h3 className="text-xl font-semibold text-blue-800 mb-2">
        Organization Details
      </h3>
      <div>
        <Label>
          Organization Name <span className="text-red-600">*</span>
        </Label>
        <Input
          value={formData.orgName}
          onChange={(e) => handleChange("orgName", e.target.value)}
          maxLength={30}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label>
            Document ID Type <span className="text-red-600">*</span>
          </Label>
          <Input
            value={formData.docIdtype}
            onChange={(e) => handleChange("docIdtype", e.target.value)}
            maxLength={10}
          />
        </div>
        <div>
          <Label>
            Document ID <span className="text-red-600">*</span>
          </Label>
          <Input
            value={formData.docId}
            onChange={(e) => handleChange("docId", e.target.value)}
            maxLength={10}
          />
        </div>
      </div>
      <div className="border-t border-gray-300 my-6" />
    </div>
  );

  const PersonalInformationSection = (
    <div>
      <h3 className="text-xl font-semibold text-blue-800 mb-2">
        Personal Information
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>
            Title <span className="text-red-600">*</span>
          </Label>
          <Select
            value={formData.title}
            onValueChange={(val) => handleChange("title", val)}
          >
            <SelectTrigger className="h-12">
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
        </div>
        <div>
          <Label>
            First Name <span className="text-red-600">*</span>
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value;
              // Allow only letters and spaces
              if (/^[A-Za-z\s]*$/.test(value)) {
                handleChange("name", value);
              }
            }}
            placeholder="Enter First Name"
            maxLength={50}
          />
        </div>
        <div>
          <Label>
            Last Name <span className="text-red-600">*</span>
          </Label>
          <Input
            value={formData.lastName}
            onChange={(e) => {
              const value = e.target.value;
              // Allow only letters and spaces
              if (/^[A-Za-z\s]*$/.test(value)) {
                handleChange("lastName", value);
              }
            }}
            placeholder="Enter Last Name"
            maxLength={50}
          />
        </div>
      </div>
      <div className="border-t border-gray-300 my-6" />
    </div>
  );

  return (
    <div>
      <HomeHeader />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-xl rounded-xl p-8 space-y-6"
          >
            {/* Heading */}
            <div className="text-center mt-6">
              <h1 className="text-3xl font-bold text-blue-900">
                User Registration
              </h1>
              <p className="text-gray-600 mt-2">
                Fill in the details below to create your account
              </p>
            </div>

            {/* Account Type */}
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">
                Account Type
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label className="font-semibold">
                    Registering as <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.isorg}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        isorg: value,
                        ...(value === "0" && {
                          orgName: "",
                          docIdtype: "",
                          docId: "",
                        }),
                      });
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Registration Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Individual / Citizen</SelectItem>
                      <SelectItem value="1">Commercial / Travels</SelectItem>
                      <SelectItem value="2">Government</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border-t border-gray-300 my-6" />
            </div>

            {/* Conditional Section Order */}
            {formData.isorg === "1" ? (
              <>
                {OrganizationDetailsSection}
                {PersonalInformationSection}
              </>
            ) : (
              PersonalInformationSection
            )}

            {/* Government Department Details */}
            {formData.isorg === "2" && (
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  Department Details
                </h3>

                {/* Central / Andaman Department Fields - 3 Inputs in One Row */}
                {(formData.orgName === "Central" ||
                  formData.orgName === "Andaman Administration" ||
                  formData.orgName === "Defence" ||
                  !formData.orgName) && (
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    {/* Department Selection */}
                    <div>
                      <Label>
                        Select Department{" "}
                        <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={formData.orgName}
                        onValueChange={(val) => handleChange("orgName", val)}
                      >
                        <SelectTrigger className="h-10 w-full text-sm">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Central">Central</SelectItem>
                          <SelectItem value="Defence">Defence</SelectItem>
                          <SelectItem value="Andaman Administration">
                            Andaman Administration
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sub Government Category (Only for Central / Andaman) */}
                    {(formData.orgName === "Central" ||
                      formData.orgName === "Andaman Administration") && (
                      <div>
                        <Label>
                          Government Sub Category{" "}
                          <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={formData.govtsubcat}
                          onValueChange={(val) =>
                            handleChange("govtsubcat", val)
                          }
                        >
                          <SelectTrigger className="h-10 w-full text-sm">
                            <SelectValue placeholder="Select Sub Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ministry">Ministry</SelectItem>
                            <SelectItem value="Department">
                              Department
                            </SelectItem>
                            <SelectItem value="Commission">
                              Commission
                            </SelectItem>
                            <SelectItem value="Autonomous Body">
                              Autonomous Body
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Department Name Field */}
                    <div>
                      <Label>
                        Department Name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter Department Name"
                        value={formData.govtdeptName || ""}
                        onChange={(e) =>
                          handleChange("govtdeptName", e.target.value)
                        }
                        className="h-10 w-full text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-300 my-6" />
              </div>
            )}

            {/* Contact Details */}
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">
                Contact Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Contact Number <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    value={formData.ownContact}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only digits and limit to 10
                      if (/^\d{0,10}$/.test(value)) {
                        handleChange("ownContact", value);
                      }
                    }}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter 10-digit number"
                  />
                </div>
                <div>
                  <Label>
                    Email Address <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
              <div className="border-t border-gray-300 my-6" />
            </div>

            {/* Location Details */}
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">
                Location Details
              </h3>
              <div className="mt-4">
                <Label>
                  Full Address <span className="text-red-600">*</span>
                </Label>
                <textarea
                  className="w-full border rounded-md p-2"
                  value={formData.ownAddress}
                  onChange={(e) => handleChange("ownAddress", e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>
                    District <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.district}
                    onValueChange={handleDistrictChange}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.code} value={d.code.toString()}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    Subdistrict <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.subdistrict}
                    onValueChange={handleSubdistrictChange}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select subdistrict" />
                    </SelectTrigger>
                    <SelectContent>
                      {subdistricts.map((s) => (
                        <SelectItem key={s.code} value={s.code.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    Tehsil <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.village}
                    onValueChange={(val) => handleChange("village", val)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Tehsil" />
                    </SelectTrigger>
                    <SelectContent>
                      {villages.map((v) => (
                        <SelectItem key={v.code} value={v.code.toString()}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border-t border-gray-300 my-6" />
            </div>

            {/* Password Setup */}
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">
                Password
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Label>
                    Password <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                  <div
                    className="absolute top-9 right-3 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
                <div className="relative">
                  <Label>
                    Confirm Password <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                  />
                  <div
                    className="absolute top-9 right-3 cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-700 border border-blue-200 bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold mb-2 text-blue-700">
                  Password must contain:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one digit</li>
                  <li>
                    At least one special character (e.g., @, #, $, !, etc.)
                  </li>
                </ul>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="bg-gray-200 text-gray-700"
              >
                Back
              </Button>

              <Button type="submit" className="bg-primary text-white">
                Register
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </form>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
};

export default Register;
