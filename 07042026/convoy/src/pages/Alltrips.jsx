import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getalltrips } from "@/contexts/GetApi";
const AllTrips = () => {
  const { accessToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 10;

  // Filters
  const [carType, setCarType] = useState("");
  const [ownership, setOwnership] = useState("");
  const [purpose, setPurpose] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [fromDate, setFromDate] = useState(""); // ✅ Added
  const [toDate, setToDate] = useState(""); // ✅ Added
  const [convoyTime, setConvoyTime] = useState("");
  const [status, setStatus] = useState("");

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const BASE_URL = `${API_BASE_URL}/api/auth`;
  // console.log("baseurl", BASE_URL);

  const fetchTripList = useCallback(
    async (page = 1, filters = {}) => {
      if (!accessToken) {
        console.warn("Access token is missing.");
        return;
      }
      try {
        const bodyData = {
          ...filters,
          page,
          limit: rowsPerPage,
        };

        const response = await fetch(`${BASE_URL}/get-trips-by-filters`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(bodyData),
        });

        const data = await response.json();
        const tripList = Array.isArray(data?.data?.trips)
          ? data.data.trips.map((trip) => ({
              t_id: trip.tId,
              origin: trip.originLocation.location,
              destination: trip.destinationLocation.location,
              date: trip.date,
              convoyTime: trip.convoyTime,
              driverName: trip.driver
                ? `${trip.driver.dFirstName} ${trip.driver.dLastName}`.trim()
                : "N/A",
              licenseNo: trip.driver?.licenseNo || "N/A",
              vehicleNo: trip.vehicle?.vNum || "N/A",
              passengerCount: trip.passengers?.length || 0,
              status: trip.status,
              carType: trip.vehicle?.vCat || "",
              ownership: trip.vehicle?.ownershipType || "",
              purpose: trip.vehicle?.vPurpose || "",
              otherCat: trip.vehicle?.otherCat || "",
              otherPurpose: trip.vehicle?.otherPurpose || "",
              deptName: trip.vehicle?.deptName || "",
            }))
          : [];

        setTrips(tripList);
        setTotalPages(data?.data?.totalPages || 1);
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    },
    [accessToken],
  );

  const handleSearch = () => {
    const filters = {
      carType,
      ownership,
      purpose,
      status,
      fromLocation,
      toLocation,
      convoyTime,
      fromDate, // ✅ Added
      toDate, // ✅ Added
    };
    setCurrentPage(1);
    fetchTripList(1, filters);
  };

  useEffect(() => {
    fetchTripList(currentPage, {
      carType,
      ownership,
      purpose,
      status,
      fromLocation,
      toLocation,
      convoyTime,
      fromDate, // ✅ Added
      toDate, // ✅ Added
    });
  }, [currentPage, fetchTripList]);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const currentRows = trips;

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        {/* 🔽 Filter Card Section */}
        <Card className="shadow-md border rounded-2xl">
          {/* Header */}
          <CardHeader className="border-b bg-gray-50 px-6 py-3 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Filter Trips
            </h2>
          </CardHeader>

          {/* Content */}
          <CardContent className="p-4 space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Car Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Car Type
                </label>
                <select
                  value={carType}
                  onChange={(e) => setCarType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="Car">Car</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Pickup Truck">Pickup Truck</option>
                  <option value="Van">Van</option>
                  <option value="Tanker">Tanker</option>
                  <option value="Road Roller">Road Roller</option>
                  <option value="Bus">Bus</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Mortuary Van">Mortuary Van</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Ownership */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Ownership
                </label>
                <select
                  value={ownership}
                  onChange={(e) => setOwnership(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Private">Private</option>
                  <option value="Government">Government</option>
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="Passenger">Passenger</option>
                  <option value="Cargo">Cargo</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="1">Pending</option>
                  <option value="2">Approved</option>
                  <option value="0">Rejected</option>
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* From Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  From Location
                </label>
                <select
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="Jirkatang">Jirkatang</option>
                  <option value="Diglipur">Diglipur</option>
                </select>
              </div>
              {/* Destination */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  To Location
                </label>
                <select
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="Jirkatang">Jirkatang</option>
                  <option value="Diglipur">Diglipur</option>
                </select>
              </div>

              {/* Convoy Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Convoy Timing
                </label>
                <select
                  value={convoyTime}
                  onChange={(e) => setConvoyTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="06:00:00">6:00 AM (First Convey)</option>
                  <option value="09:00:00">9:00 AM (Second Convey)</option>
                  <option value="12:00:00">12:00 PM (Third Convey)</option>
                  <option value="14:00:00">2:00 PM (Fourth Convey)</option>
                </select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* From Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500
               [color-scheme:light] disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate || undefined} // Restrict toDate to be >= fromDate
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCarType("");
                  setOwnership("");
                  setPurpose("");
                  setFromLocation("");
                  setToLocation("");
                  setTripDate("");
                  setConvoyTime("");
                  setStatus("");
                }}
                className="text-xs px-3 py-1"
              >
                Reset
              </Button>
              <Button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm rounded-md"
              >
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 🔽 Existing Table Card */}
        <Card className="overflow-x-auto">
          <CardHeader>
            <h1 className="text-2xl font-bold text-gray-900">All Trip List</h1>
          </CardHeader>
          <CardContent>
            <div className="hidden sm:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[800px] w-full text-sm text-left text-gray-700 border">
                  <thead className="bg-gray-100 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Origin → Destination</th>
                      <th className="px-4 py-2 border"> Vehicle Number</th>

                      <th className="px-4 py-2 border">Vehicle Type</th>
                      <th className="px-4 py-2 border">Ownership Type</th>

                      <th className="px-4 py-2 border">Date</th>
                      <th className="px-4 py-2 border">Convoy Time</th>
                      <th className="px-4 py-2 border">Total Passenger</th>
                      <th className="px-4 py-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.length > 0 ? (
                      currentRows.map((row, i) => (
                        <tr
                          key={row.t_id}
                          className="hover:bg-gray-50 border-b"
                        >
                          <td className="px-4 py-2 border">
                            {(currentPage - 1) * rowsPerPage + i + 1}
                          </td>
                          <td className="px-4 py-2 border whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                            {`${row.origin} → ${row.destination}`}
                          </td>
                          <td className="px-4 py-2 border">{row.vehicleNo}</td>

                          <td className="px-4 py-2 border">
                            {row.carType === "Other"
                              ? row.otherCat
                              : row.carType}
                          </td>
                          {/* <td className="px-4 py-2 border whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                            {row.purpose === "Other"
                              ? row.otherPurpose
                              : row.purpose}
                          </td> */}
                          <td className="px-4 py-2 border whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                            {row.ownership}
                            {row.deptName ? ` - ${row.deptName}` : ""}
                          </td>

                          <td className="px-4 py-2 border">{row.date}</td>
                          <td className="px-4 py-2 border">{row.convoyTime}</td>
                          <td className="px-4 py-2 border">
                            <div className="flex items-center gap-3">
                              <span>{row.passengerCount}</span>
                              <Button
                                size="sm"
                                className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                                onClick={() =>
                                  navigate(
                                    `/ManageTrip/PoliceViewTrip/${row.t_id}`,
                                  )
                                }
                              >
                                View Details
                              </Button>
                            </div>
                          </td>

                          <td className="px-4 py-2 border text-center">
                            {row.status === "0" && (
                              <span className="inline-block text-xs font-medium bg-red-100 text-red-700 px-3 py-1 rounded-full">
                                Rejected
                              </span>
                            )}
                            {row.status === "1" && (
                              <span className="inline-block text-xs font-medium bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                                Pending
                              </span>
                            )}
                            {row.status === "2" && (
                              <span className="inline-block text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                Approved
                              </span>
                            )}
                            {!["0", "1", "2"].includes(row.status) && (
                              <span className="inline-block text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                                Undefined
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center text-gray-500 py-4"
                        >
                          {trips.length > 0
                            ? `No data found for "${searchTerm}".`
                            : "No trips found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AllTrips;
