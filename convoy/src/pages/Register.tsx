import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HomeFooter from "@/include/HomeFooter";
import HomeHeader from "@/include/HomeHeader";
import Swal from "sweetalert2";
import CommonInput from "@/components/inputs/CommonInput";
import CommonDropdown from "@/components/inputs/CommonDropdown";
import CommonPasswordInput from "@/components/inputs/CommonPasswordInput";
import CommonTextarea from "@/components/inputs/CommonTextarea";

import { getDistricts } from "@/contexts/GetApi";
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
    // subdistrict: "",
    // village: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [districts, setDistricts] = useState([]);
  // const [subdistricts, setSubdistricts] = useState([]);
  // const [villages, setVillages] = useState([]);
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

  const handleDistrictChange = (value) => {
    handleChange("district", value);
  };

  // const handleSubdistrictChange = async (value) => {
  //   handleChange("subdistrict", value);
  //   handleChange("village", "");
  //   const vils = await getVillages(value);
  //   setVillages(vils);
  // };
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
    // if (!formData.subdistrict) errors.push("Subdistrict is required");
    // if (!formData.village) errors.push("Village is required");

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

    // Password validation
    if (password) {
      if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
      }

      if (!/[A-Z]/.test(password)) {
        errors.push("Password must include at least one uppercase letter");
      }

      if (!/[a-z]/.test(password)) {
        errors.push("Password must include at least one lowercase letter");
      }

      if (!/\d/.test(password)) {
        errors.push("Password must include at least one number");
      }

      if (!/[@$!%*?&]/.test(password)) {
        errors.push(
          "Password must include at least one special character (@, $, !, %, *, ?, &)",
        );
      }
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
      // subdistrict_code: parseInt(formData.subdistrict),
      // village_code: parseInt(formData.village),
      subdistrict_code: 1,
      village_code: 1,
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
      <CommonInput
        label="Organization Name"
        required
        value={formData.orgName}
        onChange={(e) => handleChange("orgName", e.target.value)}
        maxLength={30}
        placeholder="Enter Organization Name"
      />
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <CommonInput
          label="Document ID Type"
          required
          value={formData.docIdtype}
          onChange={(e) => handleChange("docIdtype", e.target.value)}
          maxLength={10}
          placeholder="Enter Document Type"
        />
        <CommonInput
          label="Document ID"
          required
          value={formData.docId}
          onChange={(e) => handleChange("docId", e.target.value)}
          maxLength={10}
          placeholder="Enter Document ID"
        />
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
        <CommonDropdown
          label="Title"
          required
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Select Title"
          options={[
            { value: "Mr", label: "Mr" },
            { value: "Mrs", label: "Mrs" },
            { value: "Miss", label: "Miss" },
          ]}
        />
        <CommonInput
          label="First Name"
          required
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
        <CommonInput
          label="Last Name"
          required
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
      <div className="border-t border-gray-300 my-6" />
    </div>
  );

  return (
    <div>
      <HomeHeader />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 md:p-6 lg:p-8 ">
        <div className="w-full max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-xl rounded-xl p-4 md:p-6 lg:p-8 space-y-6"
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
                  <CommonDropdown
                    label="Registering as"
                    required
                    value={formData.isorg}
                    onChange={(e) => {
                      const value = e.target.value;

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
                    placeholder="Select Registration Type"
                    options={[
                      {
                        value: "0",
                        label: "Individual / Citizen",
                      },
                      {
                        value: "1",
                        label: "Commercial / Travels",
                      },
                      {
                        value: "2",
                        label: "Government",
                      },
                    ]}
                  />
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
                    <CommonDropdown
                      label="Select Department"
                      required
                      value={formData.orgName}
                      onChange={(e) => handleChange("orgName", e.target.value)}
                      placeholder="Select Department"
                      options={[
                        { value: "Central", label: "Central" },
                        { value: "Defence", label: "Defence" },
                        {
                          value: "Andaman Administration",
                          label: "Andaman Administration",
                        },
                      ]}
                    />

                    {/* Sub Government Category (Only for Central / Andaman) */}
                    {(formData.orgName === "Central" ||
                      formData.orgName === "Andaman Administration") && (
                      <CommonDropdown
                        label="Government Sub Category"
                        required
                        value={formData.govtsubcat}
                        onChange={(e) =>
                          handleChange("govtsubcat", e.target.value)
                        }
                        placeholder="Select Sub Category"
                        options={[
                          { value: "Ministry", label: "Ministry" },
                          { value: "Department", label: "Department" },
                          { value: "Commission", label: "Commission" },
                          {
                            value: "Autonomous Body",
                            label: "Autonomous Body",
                          },
                        ]}
                      />
                    )}

                    {/* Department Name Field */}
                    <CommonInput
                      label="Department Name"
                      required
                      type="text"
                      placeholder="Enter Department Name"
                      value={formData.govtdeptName || ""}
                      onChange={(e) =>
                        handleChange("govtdeptName", e.target.value)
                      }
                    />
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
                <CommonInput
                  label="Contact Number"
                  required
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
                <CommonInput
                  label="Email Address"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter Email Address"
                />
              </div>
              <div className="border-t border-gray-300 my-6" />
            </div>

            {/* Location Details */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-blue-800">
                  📍 Location Details
                </h3>
              </div>

              {/* Grid (Address bigger than State) */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Address - 2 columns */}
                <div className="md:col-span-2">
                  <CommonTextarea
                    label="Full Address"
                    required
                    placeholder="Enter your complete address"
                    value={formData.ownAddress}
                    onChange={(e) => handleChange("ownAddress", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* State - 1 column */}
                <CommonDropdown
                  label="State"
                  required
                  value={formData.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  placeholder="Select State"
                  options={districts.map((d) => ({
                    value: d.code.toString(),
                    label: d.name,
                  }))}
                />
              </div>
            </div>

            {/* Password Setup */}
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">
                Password
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <CommonPasswordInput
                  label="Password"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Enter your password"
                />
                <CommonPasswordInput
                  label="Confirm Password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm your password"
                />
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
