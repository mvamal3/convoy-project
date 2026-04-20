import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { getAllAproveTrips, getConveyDetails } from "@/contexts/GetApi";
import { formatDateDDMMYY } from "@/utils/dateUtils";

const AllPendingTrips = () => {
  const { user, accessToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDate, setFilteredDate] = useState("");
  const [filteredConvoyTime, setFilteredConvoyTime] = useState("");
  const [conveyList, setConveyList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const rowsPerPage = 10;

  // ✅ Extract date from URL query (e.g., ?date=2025-11-03)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const dateFromQuery = queryParams.get("date");
    if (dateFromQuery) {
      setFilteredDate(dateFromQuery);
    }
  }, [location.search]);

  // ✅ Fetch Pending Trip List
  const fetchTripList = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getAllAproveTrips(
        accessToken,
        1, // 1 = pending
        user.checkpostid,
        filteredConvoyTime // ✅ include convoy filter
      );

      console.log("Pending Fetched Trip List:", data);

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
              passengerCount: trip.passengers?.length || 0,
              status: trip.status || "N/A",
            };
          })
        : [];

      // Sort descending by trip ID
      tripList.sort((a, b) => Number(b.t_id) - Number(a.t_id));
      setTrips(tripList);
    } catch (err) {
      console.error("Error fetching pending trips:", err);
      setTrips([]);
    }
  }, [accessToken, user.checkpostid, filteredConvoyTime]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  // ✅ Fetch Convoy List
  useEffect(() => {
    const fetchConveys = async () => {
      if (!accessToken) return;
      try {
        const res = await getConveyDetails(accessToken, user.checkpostid);
        console.log("Fetched convoy list:", res);
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
  const handleBack = () => {
    navigate(-1); // go to previous page
  };

  // ✅ Apply frontend filters (date, search, convoy)
  const filteredTrips = trips.filter((t) => {
    const searchMatch =
      `${t.t_id} ${t.origin} ${t.destination} ${t.driverName} ${t.vehicleNo}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const dateMatch = filteredDate ? t.date === filteredDate : true;
    return searchMatch && dateMatch;
  });

  // ✅ Pagination
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredTrips.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);

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
                All Pending Trip List
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
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              {/* Date Filter */}
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium mb-1">
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
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium mb-1">
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
                    <option disabled>No convoy available</option>
                  )}
                </select>
              </div>

              {/* Search Input + Button */}
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium mb-1">Search</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by origin, destination, driver, or vehicle..."
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                  />
                  <Button
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* ✅ Table */}
            <div className="hidden sm:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[800px] w-full text-sm text-left text-gray-700 border">
                  <thead className="bg-gray-100 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Trip ID</th>
                      <th className="px-4 py-2 border">Origin</th>
                      <th className="px-4 py-2 border">Destination</th>
                      <th className="px-4 py-2 border">Date</th>
                      <th className="px-4 py-2 border">Convoy Time</th>
                      <th className="px-4 py-2 border">Total Passenger</th>
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
                                    `/ManageTrip/PoliceViewTrip/${row.t_id}`
                                  )
                                }
                              >
                                View Details
                              </Button>
                            </div>
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

              {/* Pagination */}
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

export default AllPendingTrips;
