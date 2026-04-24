// src/api/PostApi.jsx
import { toast } from "@/hooks/use-toast";
import Swal from "sweetalert2";
//import { useNavigate } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = `${API_BASE_URL}/api/auth`;

// Centralized registration function

export async function PostRegister(data, navigate) {
  console.log("Registering with data000:", data);

  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));
    // console.log("Registration response:", result);

    if (!response.ok) {
      throw new Error(result?.message || "Request failed");
    }

    // Format date & time
    sessionStorage.setItem("otp_email", data.email);
    sessionStorage.setItem("otp_mobile", data.ownContact);
    // SweetAlert success popup
    Swal.fire({
      icon: "success",
      title: "Registration Successful",
      html: `
  ${data.title || ""} ${data.firstName} ${
    data.lastName
  }, your registration details have been submitted successfully.<br>
  Please verify the OTP sent to your registered email/phone to complete your registration.<br><br>
`,
      confirmButtonText: "OK",
    }).then(() => {
      if (navigate) navigate("/OtpVerification");
    });

    return { success: true, result };
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Registration Failed",
      text: error.message || "Something went wrong.",
      confirmButtonText: "OK",
    });
    throw error;
  }
}

// ✅ Vehicle creation API
export async function handleAddVehicleAPI(formData, accessToken, onSuccess) {
  const requiredFields = [
    "v_owner_name",
    "v_number",
    "v_type",
    "commercial_type",
    "cargo_passenger",
    "v_capacity",
  ];

  if (formData.v_type === "Other" && !formData.v_type_other) {
    toast({
      title: "Please enter Other Vehicle Category",
      variant: "destructive",
    });
    return;
  }

  if (formData.cargo_passenger === "Other" && !formData.cargo_passenger_other) {
    toast({ title: "Please enter Other Purpose", variant: "destructive" });
    return;
  }

  if (formData.commercial_type === "Government" && !formData.department_name) {
    toast({ title: "Please enter Department Name", variant: "destructive" });
    return;
  }

  const missing = requiredFields.filter((key) => !formData[key]);

  if (missing.length > 0) {
    toast({
      title: "Please fill all required fields",
      variant: "destructive",
    });
    return;
  }

  try {
    const payload = {
      vOwnName: formData.v_owner_name,
      vNum: formData.v_number,
      ownershipType: formData.commercial_type,
      deptName:
        formData.commercial_type === "Government"
          ? formData.department_name
          : undefined,
      vCat: formData.v_type,
      otherCat: formData.v_type_other || null,
      vPurpose: formData.cargo_passenger,
      otherPurpose: formData.cargo_passenger_other || null,
      vSeating: formData.v_capacity,
      loadCapacity: formData.v_loadCapacity,
      status: "Active",
    };

    const response = await fetch(`${BASE_URL}/vehicle-new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to register vehicle");

    toast({ title: "Vehicle added successfully" });

    if (typeof onSuccess === "function") {
      onSuccess(); // e.g., reset form + close modal
    }
  } catch (error) {
    toast({
      title: "Failed to add vehicle",
      description: error.message,
      variant: "destructive",
    });
  }
}

// contexts/PostApi.js

// src/api/PostApi.jsx

export async function handleAddDriverAPI(
  formData,
  accessToken,
  toast,
  onSuccess,
) {
  const requiredFields = [
    "title",
    "first_name",
    "last_name",
    "license_no",
    "gender",
    "phone_no",
    "son_of",
    "residence_of",
  ];
  console.log("formdata post api", formData);

  const missing = requiredFields.filter((key) => !formData[key]);
  if (missing.length > 0) {
    toast({
      title: "Please fill all required fields",
      variant: "destructive",
    });
    return;
  }

  if (typeof formData.is_owner !== "boolean") {
    toast({
      title: "Please specify if the driver is also the vehicle owner",
      variant: "destructive",
    });
    return;
  }

  try {
    const payload = {
      title: formData.title,
      dFirstName: formData.first_name,
      dLastName: formData.last_name,
      licenseNo: formData.license_no,
      gender: formData.gender,
      phNo: formData.phone_no,
      son_of: formData.son_of,
      residence_of: formData.residence_of,

      dStatus: "active",
      status: "active",
      isOwner: formData.is_owner,
    };
    console.log("payload", payload);
    const response = await fetch(`${BASE_URL}/driver-registration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Driver registration failed");

    toast({ title: "Driver added successfully" });

    if (typeof onSuccess === "function") {
      onSuccess(); // reset form, close modal, etc.
    }
  } catch (error) {
    toast({
      title: "Failed to add driver",
      description: error.message,
      variant: "destructive",
    });
  }
}

export async function handleAddTripAPI(payload, accessToken, onSuccess) {
  try {
    const response = await fetch(`${BASE_URL}/trip-new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json(); // <-- get JSON body

    if (!response.ok) {
      throw new Error(data.message || "Failed to add trip");
    }

    toast({ title: "Trip added successfully" });

    // ✅ Pass data back to callback
    if (typeof onSuccess === "function") {
      onSuccess(data);
    }
  } catch (error) {
    toast({
      title: "Failed to add trip",
      description: error.message,
      variant: "destructive",
    });
  }
}

//////////////////add spl trp api
export async function handleAddSplTripAPI(payload, accessToken, onSuccess) {
  try {
    const response = await fetch(`${BASE_URL}/spl-trip-new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json(); // <-- get JSON body

    if (!response.ok) {
      throw new Error(data.message || "Failed to add trip");
    }

    toast({ title: "Trip added successfully" });

    // ✅ Pass data back to callback
    if (typeof onSuccess === "function") {
      onSuccess(data);
    }
  } catch (error) {
    toast({
      title: "Failed to add trip",
      description: error.message,
      variant: "destructive",
    });
  }
}

export async function approveTripAPI(payload, accessToken, onSuccess) {
  if (!payload?.tId) {
    toast({
      title: "Trip ID is missing",
      variant: "destructive",
    });
    return;
  }

  console.log("Approving and Cancelling trip with payload:", payload);

  try {
    const response = await fetch(`${BASE_URL}/trip-approval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload), // send full payload
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to approve trip");
    }

    toast({ title: "Trip approved successfully" });

    if (typeof onSuccess === "function") {
      onSuccess(data);
    }

    return data;
  } catch (error) {
    toast({
      title: "Trip approval failed",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }
}

export const PostPoliceRegister = async (payload) => {
  try {
    const res = await fetch(`${BASE_URL}/policeregister`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // return both status and message
    return { success: res.ok, ...data };
  } catch (error) {
    console.error("Police register error:", error);
    return { success: false, message: "Network error during registration" };
  }
};

export const postCitizenOtpVerify = async (payload) => {
  try {
    const res = await fetch(`${BASE_URL}/verify-citizen-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization header removed as requested
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Server error: ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error in postCitizenOtpVerify:", error);
    return {
      success: false,
      message: error.message || "Something went wrong while verifying OTP.",
    };
  }
};

export const handleStartConvoyAPI = async (accessToken, payload) => {
  try {
    const res = await fetch(`${BASE_URL}/start-convoy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error) {
    console.error("Error starting convoy:", error);
    throw error;
  }
};
export const stopConveyAPI = async (accessToken, payload) => {
  try {
    const res = await fetch(`${BASE_URL}/stop-convoy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error) {
    console.error("Error Stop convoy:", error);
    throw error;
  }
};
// PostApi.jsx
export const updateCheckoutTripAPI = async (
  accessToken,
  { tId, status, checkpostId, remarks, runningConveyId },
) => {
  try {
    console.log("Updating checkout trip with:", {
      tId,
      status,
      checkpostId,
      remarks,
      runningConveyId,
    });
    const res = await fetch(`${BASE_URL}/update-checkout-trip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tId,
        status,
        checkpostId,
        remarks,
        runningConveyId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update checkout trip");
    }

    return data;
  } catch (error) {
    console.error("API Error (updateCheckoutTripAPI):", error);
    throw error;
  }
};
export const updateTripAPI = async (accessToken, payload) => {
  try {
    console.log("Updating trip with payloadaaa:", payload);

    const res = await fetch(`${BASE_URL}/update-trip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update trip");
    }

    return data;
  } catch (error) {
    console.error("API Error (updateTripAPI):", error);
    throw error;
  }
};

export const updateProfileAPI = async (accessToken, payload) => {
  try {
    console.log("Updating profile with payload:", payload);

    const res = await fetch(`${BASE_URL}/update-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // ✅ Return both status and data for frontend handling
    return {
      status: res.status,
      data,
    };
  } catch (error) {
    console.error("API Error (updateProfileAPI):", error);
    throw error;
  }
};

export const updatePoliceProfileAPI = async (accessToken, payload) => {
  try {
    console.log("Updating police profile with payload:", payload);

    const res = await fetch(`${BASE_URL}/update-police-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // ✅ Return both status and data for frontend handling
    return {
      status: res.status,
      data,
    };
  } catch (error) {
    console.error("API Error (updateProfileAPI):", error);
    throw error;
  }
};

////start checkout
// ✅ Start Checkout (same backend as start convoy)
export const handleStartCheckoutAPI = async (accessToken, payload) => {
  const res = await fetch(`${BASE_URL}/start-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  return await res.json();
};
///////////stop checkout
// ✅ Stop Checkout (different backend endpoint)
export const stopCheckoutConveyAPI = async (accessToken, payload) => {
  const res = await fetch(`${BASE_URL}/stop-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  return await res.json();
};

// DeleteApi.js
// PostApi.js
export const deleteVehicle = async (accessToken, vehicleId) => {
  try {
    console.log("Deleting vehicle with ID:", vehicleId);
    const res = await fetch(`${BASE_URL}/delete-vehicle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ vId: Number(vehicleId) }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return { success: false, message: "Network error" };
  }
};
// DeleteApi.js
export const deleteDriver = async (accessToken, driverId) => {
  try {
    //console.log("Deleting driver with ID inpost:", driverId);
    const res = await fetch(`${BASE_URL}/delete-driver`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ dId: Number(driverId) }),
    });

    const data = await res.json();
    console.log("Delete driver response:", data);
    return data;
  } catch (error) {
    console.error("Error deleting driver:", error);
    return { success: false, message: "Error deleting driver" };
  }
};

export const deleteTrip = async (accessToken, tripId) => {
  try {
    //console.log("tripid", tripId);
    const res = await fetch(`${BASE_URL}/delete-trip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ tId: tripId }),
    });

    return await res.json();
  } catch (error) {
    console.error("Delete Trip API error:", error);
    return { success: false, message: "Network error" };
  }
};

export async function verfiedTrip(payload, accessToken, onSuccess) {
  if (!payload?.tId) {
    toast({
      title: "Trip ID is missing",
      variant: "destructive",
    });
    return;
  }

  console.log("Verified and Cancel Verified:", payload);

  try {
    const response = await fetch(`${BASE_URL}/trip-verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload), // send full payload
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to approve trip");
    }

    toast({ title: "Trip approved successfully" });

    if (typeof onSuccess === "function") {
      onSuccess(data);
    }

    return data;
  } catch (error) {
    toast({
      title: "Trip approval failed",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }
}

export const freezePoliceUser = async (accessToken, policeId) => {
  try {
    const res = await fetch(`${BASE_URL}/freeze-police-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ policeId }),
    });

    return await res.json();
  } catch (error) {
    console.error("Freeze Police User API error:", error);
    return { success: false, message: "Network error" };
  }
};

export const UnfreezePoliceUser = async (accessToken, policeId) => {
  try {
    //console.log("Unfreezing police user with ID:", policeId);
    const res = await fetch(`${BASE_URL}/Unfreeze-police-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ policeId }),
    });

    return await res.json();
  } catch (error) {
    console.error("Freeze Police User API error:", error);
    return { success: false, message: "Network error" };
  }
};

export const deletePoliceUser = async (accessToken, policeId) => {
  try {
    const res = await fetch(`${BASE_URL}/delete-police-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ policeId }),
    });

    return await res.json();
  } catch (error) {
    console.error("Delete Police User API error:", error);
    return { success: false, message: "Network error" };
  }
};

export const changePolicePasswordAPI = async (accessToken, payload) => {
  try {
    const res = await fetch(`${BASE_URL}/change-police-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error) {
    console.error("Change Police Password API error:", error);
    return { success: false, message: "Network error" };
  }
};
