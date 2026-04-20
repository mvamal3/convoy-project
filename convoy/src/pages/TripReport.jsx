import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getapproveTripdetails } from "@/contexts/GetApi";
import { useReactToPrint } from "react-to-print";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { set } from "date-fns";
import { sha256 } from "js-sha256";
// --- Deterministic stringify to ensure same hash for same data
function stableStringify(value) {
  const seen = new WeakSet();

  function replacer(v) {
    if (v === null) return null;
    if (typeof v === "number") {
      if (Number.isNaN(v)) return "NaN";
      if (Object.is(v, -0)) return "-0";
      return v;
    }
    if (typeof v === "string" || typeof v === "boolean") return v;
    if (v instanceof Date) return { __date: v.toISOString() };
    if (Array.isArray(v)) return v.map(replacer);
    if (typeof v === "object") {
      if (seen.has(v))
        throw new TypeError("Cannot stringify cyclic structures");
      seen.add(v);
      const keys = Object.keys(v)
        .filter((k) => typeof v[k] !== "undefined")
        .sort();
      const sortedObj = {};
      for (const k of keys) sortedObj[k] = replacer(v[k]);
      return sortedObj;
    }
    return undefined;
  }

  return JSON.stringify(replacer(value));
}

const TripReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const contentRef = useRef();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // const [totalPassengers, setTotalPassengers] = useState(0);
  // const [totalVehicles, setTotalVehicles] = useState(0);
  // const [totalTrips, setTotalTrips] = useState(0);
  const [convoyInfo, setConvoyInfo] = useState(null);
  const [convoystartTime, setConvoyStartTime] = useState("");
  const [convoyendTime, setConvoyEndTime] = useState("");
  const [totalMale, setTotalMale] = useState(0);
  const [totalFemale, setTotalFemale] = useState(0);
  const [totalChild, setTotalChild] = useState(0);
  const [totalpax, setTotalpax] = useState(0);
  const [currentdateandtime, setcurrentdatetime] = useState("");
  const [hashValue, setHashValue] = useState("");

  // Extract filters
  const params = new URLSearchParams(location.search);
  const filteredDate = params.get("date");
  const filteredConvoyTime = params.get("convey");
  const tripIdFilter = params.get("tripId");

  // Updated on 31st December 2025
  // Vehicle category counts
  const [govtVehicles, setGovtVehicles] = useState(0);
  const [commercialVehicles, setCommercialVehicles] = useState(0);
  const [individualVehicles, setIndividualVehicles] = useState(0);
  const [ambulanceVehicles, setAmbulanceVehicles] = useState(0);

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      if (!accessToken) return;
      try {
        const res = await getapproveTripdetails(
          accessToken,
          2,
          user.checkpostid,
          filteredConvoyTime || "",
          filteredDate || ""
        );

        // ================================
        // VEHICLE COUNT LOGIC
        // ================================
        const tripsData = Array.isArray(res?.data?.trips) ? res.data.trips : [];
        console.log("Trips Data for Counting:", tripsData);

        // ---- VEHICLE CATEGORY COUNT ----
        let govt = 0;
        let commercial = 0;
        let individual = 0;
        let ambulance = 0;

        tripsData.forEach((trip) => {
          // Vehicle category
          const ownershipType = trip.vehicle?.ownershipType || "";

          // // Normalize once (for safety)
          const type = ownershipType.toLowerCase().trim();

          if (type === "government") {
            govt++;
          } else if (type === "commercial") {
            commercial++;
          } else if (type === "private") {
            individual++;
          } else if (type === "ambulance") {
            ambulance++;
          }
        });

        // SAFE normalization
          // const ownershipType = trip.vehicle?.ownershipType;

          // Force string + normalize
          // const type = String(ownershipType || "")
          //   .toLowerCase()
          //   .trim();

        // Instead of strict equality, using .includes() matching.
        //   if (type.includes("government")) {
        //     govt++;
        //   } 
        //   else if (type.includes("commercial")) {
        //     commercial++;
        //   } 
        //   else if (type.includes("private")) {
        //     individual++;
        //   } 
        //   else if (type.includes("ambulance")) {
        //     ambulance++;
        //   }
        // });

        // console.log(
        //   "Vehicle ownershipType:",
        //   trip.vehicle?.ownershipType
        // );

        // Simple and Safe report logic 
        // let govt = 0;
        // let commercial = 0;
        // let individual = 0;
        // let ambulance = 0;

        // tripsData.forEach((trip) => {
        //   const ownershipType = trip.vehicle?.ownershipType;

        //   const type = String(ownershipType || "")
        //     .toLowerCase()
        //     .trim();

        //   if (type.includes("government") || type.includes("govt")) {
        //     govt++;
        //   } else if (type.includes("commercial")) {
        //     commercial++;
        //   } else if (type.includes("private") || type.includes("individual")) {
        //     individual++;
        //   } else if (type.includes("ambulance")) {
        //     ambulance++;
        //   }
        // });

        // console.log("Vehicle ownershipType raw:", ownershipType, "→ normalized:", type);


        // Set vehicle counts
        setGovtVehicles(govt);
        setCommercialVehicles(commercial);
        setIndividualVehicles(individual);
        setAmbulanceVehicles(ambulance);

        const canonical = stableStringify(res?.data?.trips);
        const hex = sha256(canonical); // synchronous
        console.log("Canonical:", canonical);
        console.log("SHA-256 Hash:", hex);
        setHashValue(hex);

        //console.log("Report data response:", res?.data?.reportGeneratedAt);
        setcurrentdatetime(res?.data?.reportGeneratedAt || "");
        setTotalMale(res?.data?.totalMale || 0);
        setTotalFemale(res?.data?.totalFemale || 0);
        setTotalChild(res?.data?.totalChild || 0);
        setTotalpax(res?.data?.totalPassengers || 0);
        setConvoyStartTime(res?.data?.convoyTiming?.starttime || "");
        setConvoyEndTime(res?.data?.convoyTiming?.closetime || "");

        let tripList = Array.isArray(res?.data?.trips)
          ? res.data.trips.map((trip) => ({
              t_id: trip.tId,
              origin: trip.originLocation?.location || "N/A",
              destination: trip.destinationLocation?.location || "N/A",
              date: trip.date || "N/A",
              passengerCount: trip.passengers?.length || 0,

              approveConveyTime:
                trip.approveDetails?.convey?.convey_time || "N/A",
              approveConveyName:
                trip.approveDetails?.convey?.convey_name || "N/A",

              vehicle: trip.vehicle?.vNum || "N/A",
              vehiclecat: trip.vehicle?.vCat || "N/A",
              driverFName: trip.driver?.dFirstName || "N/A",
              driverLName: trip.driver?.dLastName || "N/A",

              // Approved By (INLINE)
              approvedBy: trip.approveDetails?.approverOfficer
                ? `${trip.approveDetails.approverOfficer.title || ""} ${
                    trip.approveDetails.approverOfficer.firstName || ""
                  } ${
                    trip.approveDetails.approverOfficer.lastName || ""
                  }`.trim()
                : "N/A",

              // Verified By (INLINE)
              verifiedBy: trip.verifiedDetails?.verifiedOfficer
                ? `${trip.verifiedDetails.verifiedOfficer.title || ""} ${
                    trip.verifiedDetails.verifiedOfficer.firstName || ""
                  } ${
                    trip.verifiedDetails.verifiedOfficer.lastName || ""
                  }`.trim()
                : "N/A",
            }))
          : [];

        // Apply frontend filters
        if (filteredDate) {
          tripList = tripList.filter((t) => t.date === filteredDate);
        }
        if (tripIdFilter) {
          tripList = tripList.filter((t) =>
            t.t_id.toString().includes(tripIdFilter)
          );
        }

        setTrips(tripList);

        // Extract convoy info (fix moved inside try)
        if (res?.data?.trips?.length > 0) {
          const firstTrip = res.data.trips[0];
          if (firstTrip?.approveDetails?.convey) {
            setConvoyInfo({
              name: firstTrip.approveDetails.convey.convey_name,
              time: firstTrip.approveDetails.convey.convey_time,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [
    accessToken,
    user.checkpostid,
    filteredConvoyTime,
    filteredDate,
    tripIdFilter,
  ]);

  // ================================
  // VEHICLE COUNT VALIDATION RULE
  // ================================
  const totalCategorizedVehicles =
    govtVehicles + commercialVehicles + individualVehicles + ambulanceVehicles;

  const isVehicleCountValid = totalCategorizedVehicles === trips.length;

  {
    !isVehicleCountValid && (
      <div className="mt-1 text-xs text-red-700 font-semibold">
        ⚠ Vehicle count mismatch detected
        <br />
        Categorized: {totalCategorizedVehicles} | Total Trips: {trips.length}
      </div>
    );
  }

  if (!isVehicleCountValid && trips.length > 0) {
    console.warn("🚨 Vehicle count mismatch", {
      govtVehicles,
      commercialVehicles,
      individualVehicles,
      ambulanceVehicles,
      totalTrips: trips.length,
    });
  }

  // Print setup
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Trip Report",
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-family: Arial, sans-serif;
        background: white;
      }
      table, th, td {
        border: 1px solid #000 !important;
        border-collapse: collapse !important;
      }
      th {
        background-color: #007bff !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
      }
      tr:nth-child(even) td {
        background-color: #f2f2f2 !important;
      }
      .no-print { display: none !important; }
    `,
  });

  return (
    <DashboardLayout>
      <div className="p-4">
        {/* Header with Back & Print */}
        <div className="no-print flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800"></h1>
          <div className="flex gap-3">
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🖨️ Print Report
            </Button>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-4 py-2 rounded-md"
            >
              ⬅ Back
            </Button>
          </div>
        </div>

        {/* Printable Section */}
        <div
          ref={contentRef}
          className="bg-white shadow-md rounded-lg p-6 border border-gray-300"
        >
          {/* Header Info */}
          {/* Print Header */}
          <div className="text-center mb-8 border-b pb-4">
            {/* System / Department Name */}
            <h1 className="text-2xl font-extrabold text-blue-800 uppercase tracking-wide">
              Convoy Management System
            </h1>

            {/* Report Title */}
            <h2 className="text-lg font-semibold text-gray-800 mt-1">
              Trip Report Summary
            </h2>

            {/* Checkpost Name */}
            {user?.checkpost && (
              <p className="mt-1 text-gray-700 text-sm italic">
                <span className="font-semibold text-gray-900">Checkpost:</span>{" "}
                {user.checkpost}
              </p>
            )}

            {/* Date & Convoy Info (Same Line) */}
            <div className="mt-3 flex justify-center items-center gap-6 text-sm text-gray-700 flex-wrap">
              {filteredDate && (
                <p className="text-center">
                  <span className="font-semibold text-gray-900">Date:</span>{" "}
                  {new Date(filteredDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              )}
              {filteredConvoyTime && (
                <p className="text-center">
                  <span className="font-semibold text-gray-900">Convoy:</span>{" "}
                  {convoyInfo ? (
                    <>
                      {convoyInfo.name}{" "}
                      <span className="text-gray-600">({convoyInfo.time})</span>
                    </>
                  ) : (
                    `ID: ${filteredConvoyTime}`
                  )}
                </p>
              )}
            </div>

            {/* Start & End Time on next line */}
            {convoystartTime && convoyendTime && (
              <div className="mt-1 flex justify-center">
                <p className="text-gray-700 text-sm text-center">
                  <span className="font-semibold text-gray-900">
                    Convoy Start Time:
                  </span>{" "}
                  <span className="text-blue-700 font-semibold">
                    {convoystartTime}
                  </span>
                  &nbsp; | &nbsp;
                  <span className="font-semibold text-gray-900">
                    Convoy End Time:
                  </span>{" "}
                  <span className="text-blue-700 font-semibold">
                    {convoyendTime}
                  </span>
                </p>
              </div>
            )}

            {/* Decorative Line */}
            {/* Report Generated Timestamp */}
            <p className="font-semibold text-gray-900">
              Report Generated On:{" "}
              <span className="text-gray-800">{currentdateandtime}</span>
            </p>
            {/* <p className="ont-semibold text-gray-900">
              Hash Value:{" "}
              <span className="font-semibold text-gray-800">{hashValue}</span>
            </p> */}
            {/* <p className = "font-semibold text-gray-900">
            Man: | Women: | Child (0 to 12 Years): | Govt Commercial Individual:
            </p> */}
          </div>
          {/* Total Counts (static dummy data for now) */}
          {!loading && trips.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-4 text-gray-800 font-medium text-sm">
              {/* Total Vehicles */}
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 text-center shadow-sm">
                <div className="flex justify-center items-center gap-2 mb-1">
                  <span className="text-lg">🚗</span>
                  <strong className="text-blue-900">Total Vehicles</strong>
                </div>
                <span className="text-blue-700 font-bold text-base">
                  {trips.length}
                </span>
                <div className="flex justify-center gap-4 mt-1 text-xs text-gray-700 flex-wrap">
                  <span>
                    🚓 <strong className="text-purple-700">GOVT:</strong>{" "}
                    {govtVehicles}
                  </span>
                  <span>
                    🚚 <strong className="text-orange-700">COMMERCIAL:</strong>{" "}
                    {commercialVehicles}
                  </span>
                  <span>
                    🚗 <strong className="text-blue-700">INDIVIDUAL:</strong>{" "}
                    {individualVehicles}
                  </span>
                  <span>
                    🚑 <strong className="text-red-700">AMBULANCE:</strong>{" "}
                    {ambulanceVehicles}
                  </span>
                </div>
              </div>

              {/* 🧍‍♂️ Total Passengers + Gender Split */}
              <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 text-center shadow-sm">
                <div className="flex justify-center items-center gap-2 mb-1">
                  <span className="text-lg">🧍‍♂️</span>
                  <strong className="text-yellow-900">Total Passengers</strong>
                </div>
                <span className="text-yellow-700 font-bold text-base">
                  {totalpax}
                </span>
                <div className="flex justify-center gap-4 mt-1 text-xs text-gray-700">
                  <span>
                    👨 <strong className="text-green-700">MAN:</strong>{" "}
                    {totalMale}
                  </span>
                  <span>
                    👩 <strong className="text-pink-700">WOMEN:</strong>{" "}
                    {totalFemale}
                  </span>
                  <span>
                    🧒 <strong className="text-blue-700">CHILD (0–12):</strong>{" "}
                    {totalChild}
                  </span>
                </div>
              </div>

              {/* Total Trips */}
              <div className="bg-purple-50 p-2 rounded-lg border border-purple-200 text-center shadow-sm">
                <div className="flex justify-center items-center gap-2 mb-1">
                  <span className="text-lg">📦</span>
                  <strong className="text-purple-900">Total Trips</strong>
                </div>
                <span className="text-purple-700 font-bold text-base">
                  {trips.length}
                </span>
              </div>
            </div>
          )}
          {/* Table */}
          {loading ? (
            <p className="text-center text-gray-500">Loading data...</p>
          ) : trips.length === 0 ? (
            <p className="text-center text-gray-500">No trips found.</p>
          ) : (
            <table className="w-full border border-black border-collapse text-sm whitespace-nowrap">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="border border-black px-3 py-2 text-center font-semibold">
                    #
                  </th>
                  <th className="border border-black px-3 py-2 text-center font-semibold">
                    Trip ID
                  </th>
                  <th className="border border-black px-3 py-2 text-center font-semibold">
                    Route
                  </th>

                  <th className="border border-black px-3 py-2 text-center font-semibold">
                    Vehicle
                  </th>
                  <th className="border border-black px-3 py-2 text-center font-semibold">
                    Driver
                  </th>
                  <th className="border border-black px-3 py-2 text-center font-semibold">
                    Approved By
                  </th>
                  <th className="border border-black px-3 py-2 text-center font-semibold">
                    Verified By
                  </th>

                  <th className="border border-black px-3 py-2 text-center font-semibold">
                    Passengers
                  </th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, i) => (
                  <tr
                    key={trip.t_id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-100"}
                  >
                    <td className="border border-black px-3 py-2 text-center">
                      {i + 1}
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      {trip.t_id}
                    </td>
                    <td className="border border-black px-3 py-2 text-center font-medium">
                      <span className="text-gray-800">{trip.origin}</span>{" "}
                      <span className="text-blue-600 font-bold">→</span>{" "}
                      <span className="text-gray-800">{trip.destination}</span>
                    </td>

                    <td className="border border-black px-3 py-2 text-center">
                      {trip.vehicle} {`(${trip.vehiclecat})`}
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      {trip.driverFName} {trip.driverLName}
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      {trip.approvedBy}
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      {trip.verifiedBy}
                    </td>

                    <td className="border border-black px-3 py-2 text-center">
                      {trip.passengerCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Signature Section */}
          <div className="flex justify-between mt-20 px-12 text-center">
            <div className="flex-1">
              <p>_________________________</p>
              <strong>Prepared By</strong>
            </div>
            <div className="flex-1">
              <p>_________________________</p>
              <strong>Verified By</strong>
            </div>
            <div className="flex-1">
              <p>_________________________</p>
              <strong>Authorized Signatory</strong>
            </div>
          </div>
          <div className="text-xs">Hash Value: {hashValue}</div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TripReport;
