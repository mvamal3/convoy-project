import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { getAllAproveTrips, getConveyDetails } from "@/contexts/GetApi";
import { formatDateDDMMYY, formatTimeHHMM } from "@/utils/dateUtils";

const AllRejectedTrips = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDate, setFilteredDate] = useState("");
  const [filteredConvoyTime, setFilteredConvoyTime] = useState("");
  const [conveyList, setConveyList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // ✅ Extract date from URL (e.g. /AllRejectedTrips?date=2025-11-03)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlDate = params.get("date");
    if (urlDate) {
      setFilteredDate(urlDate);
    }
  }, [location.search]);

  // ✅ Fetch Rejected Trip List
  const fetchTripList = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getAllAproveTrips(
        accessToken,
        3, // 0 = rejected
        user.checkpostid,
        filteredConvoyTime, // ✅ include convoy filter
      );

      console.log("Rejected Fetched Trip List:", data);

      const tripList = Array.isArray(data?.data?.trips)
        ? data.data.trips.map((trip) => {
            const conveyTime = trip.convey?.convey_time || "N/A";
            const conveyName = trip.convey?.convey_name || "";
            return {
              t_id: trip.tId,
              origin: trip.originLocation?.location || "N/A",
              destination: trip.destinationLocation?.location || "N/A",
              date: trip.date || "N/A",
              convoyTime: conveyName
                ? `${conveyTime} (${conveyName})`
                : conveyTime,
              driverName: trip.driver
                ? `${trip.driver.dFirstName || ""} ${
                    trip.driver.dLastName || ""
                  }`.trim()
                : "N/A",
              licenseNo: trip.driver?.licenseNo || "N/A",
              vehicleNo: trip.vehicle?.vNum || "N/A",
              vehicletype: trip.vehicle?.vCat || "N/A",

              passengerCount: trip.passengers?.length || 0,
              status: trip.status || "N/A",
              rejectedStage: trip.rejectedStage || "N/A", //For All Rejected Trip
            };
          })
        : [];

      tripList.sort((a, b) => Number(b.t_id) - Number(a.t_id));
      setTrips(tripList);
    } catch (err) {
      console.error("Error fetching rejected trips:", err);
      setTrips([]);
    }
  }, [accessToken, user.checkpostid, filteredConvoyTime]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  // ✅ Fetch Convoy List for Dropdown
  useEffect(() => {
    const fetchConveys = async () => {
      if (!accessToken) return;
      try {
        const res = await getConveyDetails(accessToken, user.checkpostid);
        console.log("Fetched convey list:", res);
        setConveyList(res?.data?.data || []);
      } catch (err) {
        console.error("Error fetching conveys:", err);
        setConveyList([]);
      }
    };
    fetchConveys();
  }, [accessToken, user.checkpostid]);

  // ✅ Handle Search Button
  const handleSearch = () => {
    setCurrentPage(1);
    fetchTripList();
  };

  // ✅ Filter Trips (by date + search term)
  const filteredTrips = trips.filter((t) => {
    const searchMatch =
      `${t.t_id} ${t.origin} ${t.destination} ${t.driverName} ${t.vehicleNo}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Apply date from filter OR URL (already in filteredDate)
    const dateMatch = filteredDate ? t.date === filteredDate : true;

    return searchMatch && dateMatch;
  });

  // Pagination
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredTrips.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);
  const handleBack = () => {
    navigate(-1); // go to previous page
  };

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <Card className="overflow-x-auto">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                All Rejected Trip List
              </h1>

              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                ← Back
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* ✅ Filters */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium mb-1 sm:mb-2">
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={filteredDate}
                    onChange={(e) => setFilteredDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                  />
                </div>

                {/* Convoy Time Filter */}
                <div>
                  <label className="block text-sm font-medium mb-1 sm:mb-2">
                    Filter by Convoy Time
                  </label>
                  <select
                    value={filteredConvoyTime}
                    onChange={(e) => setFilteredConvoyTime(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                  >
                    <option value="">All Convoy Times</option>
                    {conveyList.length > 0 ? (
                      conveyList.map((convey) => (
                        <option key={convey.id} value={convey.id}>
                          {convey.convey_name} ({convey.convey_time})
                        </option>
                      ))
                    ) : (
                      <option disabled>No conveys available</option>
                    )}
                  </select>
                </div>

                {/* Search Field */}
                <div>
                  <label className="block text-sm font-medium mb-1 sm:mb-2">
                    Search
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by origin, destination, driver, or vehicle..."
                      className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                    />
                    <Button
                      onClick={handleSearch}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap"
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Mobile Card View */}
            <div className="sm:hidden space-y-2">
              {currentRows.length > 0 ? (
                currentRows.map((row, i) => (
                  <div
                    key={row.t_id}
                    className="border rounded-md p-2 bg-white shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <p className="text-[10px] text-gray-500">
                          #{(currentPage - 1) * rowsPerPage + i + 1}
                        </p>
                        <p className="text-sm font-semibold">
                          Trip ID: {row.t_id}
                        </p>
                      </div>

                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        {row.rejectedStage}
                      </span>
                    </div>

                    {/* Route */}
                    <p className="text-xs text-gray-700 mb-1 truncate">
                      {row.origin} → {row.destination}
                    </p>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-600">
                      <p>
                        <span className="font-medium">Veh:</span>{" "}
                        {row.vehicleNo}
                      </p>
                      <p>
                        <span className="font-medium">Type:</span>{" "}
                        {row.vehicletype}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {formatDateDDMMYY(row.date)}
                      </p>
                      <p>
                        <span className="font-medium">Pax:</span>{" "}
                        {row.passengerCount}
                      </p>
                    </div>

                    {/* Convoy */}
                    <p className="text-[10px] text-gray-500 mt-1 truncate">
                      {row.convoyTime}
                    </p>

                    {/* Button */}
                    <Button
                      size="sm"
                      className="w-full mt-2 text-xs py-1 bg-blue-600"
                      onClick={() =>
                        navigate(`/ManageTrip/PoliceViewTrip/${row.t_id}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-6 text-sm">
                  No trips found
                </div>
              )}
            </div>

            {/* ✅ Desktop Table View */}
            <div className="hidden sm:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[800px] w-full text-sm text-left text-gray-700 border">
                  <thead className="bg-gray-100 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Trip ID</th>
                      <th className="px-4 py-2 border">Origin</th>
                      <th className="px-4 py-2 border">Destination</th>
                      <th className="px-4 py-2 border">Vehicle</th>
                      <th className="px-4 py-2 border">Date</th>
                      <th className="px-4 py-2 border">Convoy Time</th>
                      <th className="px-4 py-2 border">Total Passenger</th>
                      <th className="px-4 py-2 border">Rejected At</th>
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
                          <td className="px-4 py-2 border">{row.t_id}</td>
                          <td className="px-4 py-2 border">{row.origin}</td>
                          <td className="px-4 py-2 border">
                            {row.destination}
                          </td>
                          <td className="px-4 py-2 border">
                            {row.vehicleNo} ({row.vehicletype})
                          </td>
                          <td className="px-4 py-2 border">
                            {formatDateDDMMYY(row.date)}
                          </td>
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
                          <td className="px-4 py-2 border">
                            {row.rejectedStage}
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
                            ? `No data found for "${searchTerm}" on selected filters.`
                            : "No trips found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Desktop Pagination */}
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

export default AllRejectedTrips;
