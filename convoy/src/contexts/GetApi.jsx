import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ======================= LOCATION =======================
export const getDistricts = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/auth/getDistrict`);
  return res.data?.data?.districts || [];
};

export const getSubDistricts = async (district_code) => {
  const res = await axios.post(`${API_BASE_URL}/api/auth/getSubDistrict`, {
    district_code,
  });
  return res.data?.data?.subdistricts || [];
};

export const getVillages = async (subdistrict_code) => {
  const res = await axios.post(`${API_BASE_URL}/api/auth/getVillage`, {
    subdistrict_code,
  });
  return res.data?.data?.villages || [];
};

// ======================= VEHICLE / DRIVER =======================
export const getVehicleList = async (accessToken) => {
  const res = await axios.get(`${API_BASE_URL}/api/auth/get-vehicle-list`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
};

export const getDriverList = async (accessToken) => {
  const res = await axios.get(`${API_BASE_URL}/api/auth/get-driver-list`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
};

// ======================= TRIPS =======================
export const getTripList = async (accessToken) => {
  const res = await axios.get(`${API_BASE_URL}/api/auth/get-trip-details`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
};

export const getTripDetails = async (tripId, accessToken) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/auth/get-trip-details-by-tId`,
    { tId: Number(tripId) },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data?.data?.trips || null;
};

export const getTripListByPoliceId = async (accessToken, locationid) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/auth/get-trip-details-by-dt`,
    { locationid },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data;
};

export const getalltrips = async (accessToken, checkpostid) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/auth/get-all-trip-details`,
    { checkpostid },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data;
};

export const getEditTripDetails = async (accessToken, tripId) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/edittripdetails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ tripId }),
  });
  return res.json();
};

// ======================= APPROVAL / VERIFICATION =======================
export const getAllAproveTrips = async (
  accessToken,
  statuscode,
  checkpostid,
  conveyid,
) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/auth/get-all-Approve-pending-rejected-trip-details`,
    { statuscode, checkpostid, conveyid },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data;
};

// export const getapproveTripdetails = async (
//   accessToken,
//   statuscode,
//   checkpostid,
//   conveyid,
//   filteredDate,
//   page = 1,
//   limit = 100,
//   searchTerm = "",
// ) => {
//   const res = await axios.post(
//     `${API_BASE_URL}/api/auth/get-all-Approve-trip-details`,
//     {
//       statuscode,
//       checkpostid,
//       conveyid,
//       filteredDate: filteredDate || "",
//       page,
//       limit,
//       searchTerm, // ✅ add this
//     },
//     {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     },
//   );

//   return res.data;
// };
export const getapproveTripdetails = async (
  accessToken,
  statuscode,
  checkpostid,
  conveyid,
  filteredDate,
) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/auth/get-all-Approve-trip-details`,
      {
        statuscode: statuscode,
        checkpostid: checkpostid, // ✅ sending status code in body
        conveyid: conveyid,
        filteredDate: filteredDate || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    //console.log("Fetched Trip List:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching trip list:", error);
    return [];
  }
};

export const getPendingVerifiedTripList = async (accessToken, locationid) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/auth/get-Pending-trip-details-by-dt`,
    { locationid },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data;
};

export const getVerifiedTripDetails = async (
  accessToken,
  locationid,
  selectedconvoy,
) => {
  //console.log("API CALL: getVerifiedTripDetails with locationid:", locationid);
  const res = await axios.post(
    `${API_BASE_URL}/api/auth/get-Verified-trip-details`,
    { locationid, selectedconvoy },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data;
};

export const getApproveTripCount = async (accessToken, checkpostid) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/getapprovecount`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ checkpostid }),
  });
  return res.json();
};

// ======================= ORIGIN / DESTINATION / CONVEY =======================
export const getOriginDestinations = async (accessToken) => {
  const res = await axios.get(
    `${API_BASE_URL}/api/auth/get-all_origin_destination`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data?.data?.data || [];
};

export const getOriginDestinationsPolice = async () => {
  const res = await axios.get(
    `${API_BASE_URL}/api/auth/get-all_origin_destination_Police`,
  );
  return res.data?.data?.data || [];
};

export const getConveyTimeByLocId = async (loc_id, accessToken) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/auth/get-convey-time`,
    { loc_id },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data?.data?.data || [];
};

export const getConveyDetails = async (accessToken, checkpostid) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/get-convey-details`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ checkpostid }),
  });
  return res.json();
};

// ======================= REPORTS =======================
export const getConveyWiseReport = async (accessToken, filteredDate) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/convey-wise-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ date: filteredDate }),
  });
  return res.json();
};

export const gettodayconveydetails = async (accessToken, locationid, today) => {
  const res = await fetch(
    `${API_BASE_URL}/api/auth/get-all-today-convey-reports`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ Date: today, locationid }),
    },
  );
  return res.json();
};

export const getArrivaldetails = async (accessToken, checkpostid) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/getarrivallist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ checkpostid }),
  });
  return res.json();
};

// conveyApi.js
export const getRunningConveyDetails = async (accessToken, checkpost_id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/getrunningconvey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ checkpost_id }),
    });

    if (!res.ok) {
      throw new Error(`Error fetching convey details: ${res.statusText}`);
    }

    const data = await res.json();

    if (data.success && data.data) {
      return data.data; // ✅ has running convey
    }

    // ✅ no running convey → return null instead of error
    return null;
  } catch (error) {
    console.error("Error fetching running convey:", error);
    throw error; // keep actual network/other errors
  }
};

export const getStopConveyDetails = async (accessToken, checkpost_id, date) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/getstopconvey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ checkpost_id, date }),
    });

    if (!res.ok) {
      throw new Error(`Error fetching convey details: ${res.statusText}`);
    }

    const data = await res.json();
    // console.log("runnn", data);
    if (data.success && data.data) {
      // return full convey details object
      return data.data;
    }
    throw new Error("No Stop convey found");
  } catch (error) {
    console.error("Error fetching Stop convey:", error);
    throw error;
  }
};

export const getCheckOutTrip = async (accessToken, checkpost_id) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/getcheckouttrip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ checkpostid: checkpost_id }),
  });
  return res.json();
};

export const getSpecialConvoyCheckOutTrip = async (
  accessToken,
  checkpost_id,
) => {
  const res = await fetch(
    `${API_BASE_URL}/api/auth/getSpecialConvoycheckouttrip`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ checkpostid: checkpost_id }),
    },
  );
  return res.json();
};

export const getCheckoutReports = async (
  accessToken,
  checkpostid,
  status,
  filteredConvey,
) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/getcheckoutreport`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ checkpostid, status, conveyId: filteredConvey }),
  });
  return res.json();
};

// ======================= USER / PROFILE =======================
export const getUserProfile = async (accessToken) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/get-user-profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
};

export const getUserDetails = async (accessToken, userId) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/getuserprofile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId }),
  });
  return res.json();
};

export const getPoliceProfile = async (accessToken, userId) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/getppoliceprofile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId }),
  });
  return res.json();
};

// ======================= SYSTEM =======================
export const getCurrentDateTime = async (accessToken) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/getcurrentdateandtime`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.timestamp || null;
};

export const getCurrentDateTime1 = async (accessToken) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/getcurrentdateandtime`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.data || null;
};

//////////////get currnet running convey for checkout
// contexts/GetApi.js
export const getRunningCheckoutAPI = async (accessToken, checkpostid) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/get-running-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ checkpostid }),
  });

  return res.json();
};

// ================================
// Generate Checkout Report (GET-style service, POST method)
// ================================
export const getCheckoutReportAPI = async (accessToken, payload) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/auth/generate-checkout-report`,
      {
        method: "POST", // backend expects POST
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      },
    );

    return await res.json();
  } catch (error) {
    console.error("❌ getCheckoutReportAPI error:", error);
    throw error;
  }
};
// Generate Checkout Report

export const getCheckoutReport = async (accessToken, conveyid, checkpostid) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/generate-checkout-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      conveyid,
      checkpostid,
    }),
  });

  return res.json();
};
export const getTodaysReport = async (accessToken, payload) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/todays-trip-details`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      payload,
    }),
  });

  return res.json();
};

export const getTodayConvoyTrips = async (token) => {
  return axios.get(`${API_BASE_URL}/api/auth/today-convoy-trips`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export async function getRegisteredPolice(accessToken, payload = {}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/get-registered-police`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}

///get freezed police list
export async function getFreezpolice(accessToken, payload = {}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/get-frozen-police-users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function getPolicedesignation(accessToken, payload = {}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/get-police-designation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}

// contexts/GetApi.js
export async function getSpReport(accessToken, payload = {}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/get-sp-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload), // { date: "YYYY-MM-DD" }
  });

  return res.json();
}

export const getSpTripDetails = async (accessToken, payload) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/sp/trip-details`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  console.log("getSpTripDetails response:", res);
  return await res.json();
};

export const getNationalityList = async (accessToken) => {
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/get-nationality`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}), // explicit empty body (optional but clean)
  });

  return await res.json();
};

export const getsplconvoyTripList = async (accessToken) => {
  const res = await axios.get(
    `${API_BASE_URL}/api/auth/get-trip-details-Spl-convoy`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return res.data;
};
