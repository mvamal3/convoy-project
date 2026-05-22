import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ Added useLocation
import {
  getApproveRejectedPendingTripdetails,
  getConveyDetails,
} from "@/contexts/GetApi";

const AllApproveTrips = () => {
  const { user, accessToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDate, setFilteredDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [chunkPage, setChunkPage] = useState(1);
  const [totalChunks, setTotalChunks] = useState(1);
  const [filteredConvoyTime, setFilteredConvoyTime] = useState("");
  const [conveyList, setConveyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ capture current URL
  const rowsPerPage = 10;

  // ✅ Check if date is passed via URL (e.g., /ApprovedTrips?date=2025-11-03)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateFromUrl = params.get("date");
    if (dateFromUrl) {
      console.log("📅 Filter date from URL:", dateFromUrl);
      setFilteredDate(dateFromUrl);
    }
  }, [location.search]);

  const fetchTripList = useCallback(async () => {
    if (accessToken) {
      console.log("tetstss", user.checkpostid);
      setLoading(true);
      try {
        const data = await getApproveRejectedPendingTripdetails(
          accessToken,

          2,

          user.checkpostid,

          filteredConvoyTime,

          filteredDate,

          chunkPage,

          searchTerm,
        );

        console.log("Approve Fetched Trip List:", data);
        setTotalChunks(data?.data?.totalChunks || 1);
        setTotalRecords(data?.data?.totalRecords || 0);
        //console.log("Approvedetails", data?.data?.trips);

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
                vehicleNo: trip.vehicle
                  ? `${trip.vehicle.vNum || "N/A"} (${trip.vehicle.vCat || "N/A"})`
                  : "N/A",
                passengerCount: trip.passengerCount || "0",
                status: trip.status || "N/A",
                approveConveyTime:
                  trip.approveDetails?.convey?.convey_time || "N/A",
                approveconveyname:
                  trip.approveDetails?.convey?.convey_name || "N/A",
              };
            })
          : [];

        tripList.sort((a, b) => Number(b.t_id) - Number(a.t_id));

        setTrips(tripList);
      } catch (err) {
        console.error("Error fetching approved trips:", err);
      } finally {
        setLoading(false);
      }
    }
  }, [
    accessToken,

    user.checkpostid,

    filteredConvoyTime,

    filteredDate,

    chunkPage,

    searchTerm,
  ]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  useEffect(() => {
    setCurrentPage(1);

    setChunkPage(1);
  }, [filteredDate, filteredConvoyTime, searchTerm]);

  // ✅ Global pagination
  const globalTotalPages = Math.ceil(totalRecords / rowsPerPage);

  // ✅ Index-based slicing (pure math)
  const rowsPerChunk = 100;

  const chunkStartIndex = (chunkPage - 1) * rowsPerChunk;

  const globalStartIndex = (currentPage - 1) * rowsPerPage;

  const localStartIndex = globalStartIndex - chunkStartIndex;

  const localEndIndex = localStartIndex + rowsPerPage;

  const currentRows = trips.slice(localStartIndex, localEndIndex);

  // ✅ Auto-calculate chunk based on global page
  const pagesPerChunk = 10;

  useEffect(() => {
    const requiredChunk = Math.ceil(currentPage / pagesPerChunk);

    if (requiredChunk !== chunkPage) {
      setLoading(true);
      setChunkPage(requiredChunk);
    }
  }, [currentPage, pagesPerChunk, chunkPage]);

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    const maxGlobalPages = Math.ceil(totalRecords / rowsPerPage);

    if (currentPage < maxGlobalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const fetchConveys = async () => {
      if (!accessToken) return;
      try {
        const res = await getConveyDetails(accessToken, user.checkpostid);
        console.log("Fetched convey list:", res);
        setConveyList(res?.data?.data || []);
      } catch {
        setConveyList([]);
      }
    };
    fetchConveys();
  }, [accessToken, user.checkpostid]);

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              All Approved Trip List
            </h1>

            <Button size="sm" variant="outline" onClick={fetchTripList}>
              Refresh
            </Button>
          </div>
        </div>

        <Card className="overflow-x-auto">
          <CardHeader />
          <CardContent>
            {/* Filter Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Date Filter */}
              <div className="w-full">
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
              <div className="w-full">
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
                    <option disabled>No conveys available</option>
                  )}
                </select>
              </div>

              {/* ✅ Search by Trip ID Only */}
              <div className="w-full">
                <label className="block text-sm font-medium mb-1">
                  Search by Trip IDcheckpostid
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter Trip ID..."
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                  />
                  <Button
                    onClick={fetchTripList}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md hidden sm:flex"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-sm text-gray-500">
                  Loading approved trips...
                </div>
              </div>
            ) : (
              <>
                {/* Search + Table */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {trips.length} trip(s)
                  </p>
                </div>

                {/* Table */}
                <div className="hidden lg:block">
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-[800px] w-full text-sm text-left text-gray-700 border">
                      <thead className="bg-gray-100 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-2 border">#</th>
                          <th className="px-4 py-2 border">Trip ID</th>
                          <th className="px-4 py-2 border text-center">
                            Route
                          </th>
                          <th className="px-4 py-2 border">Vehicle</th>
                          <th className="px-4 py-2 border">Driver</th>
                          <th className="px-4 py-2 border">Date</th>
                          <th className="px-4 py-2 border">
                            Approve Convoy Details
                          </th>
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
                              <td className="px-4 py-2 border text-center">
                                {row.origin} → {row.destination}
                              </td>
                              <td className="px-4 py-2 border">
                                {row.vehicleNo}
                              </td>
                              <td className="px-4 py-2 border">
                                {row.driverName}
                              </td>

                              <td className="px-4 py-2 border">
                                {row.date
                                  ? new Date(row.date).toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      },
                                    )
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 border">
                                {row.approveconveyname
                                  ? `${row.approveconveyname} (${
                                      row.approveConveyTime || "N/A"
                                    })`
                                  : "N/A"}
                              </td>

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
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={9}
                              className="text-center text-gray-500 py-4"
                            >
                              {trips.length > 0
                                ? `No data found for Trip ID "${searchTerm}".`
                                : "No trips found."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination controls */}
                  {globalTotalPages > 1 && (
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
                        Page {currentPage} of {globalTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage >= globalTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {currentRows.length > 0 ? (
                    currentRows.map((row, i) => (
                      <div
                        key={row.t_id}
                        className="border rounded-xl p-3 shadow-sm bg-white space-y-2"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500">
                            #{(currentPage - 1) * rowsPerPage + i + 1}
                          </span>

                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Approved
                          </span>
                        </div>

                        {/* Trip ID */}
                        <div>
                          <p className="text-xs text-gray-500">Trip ID</p>
                          <p className="font-semibold text-sm break-all">
                            {row.t_id}
                          </p>
                        </div>

                        {/* Route */}
                        <div>
                          <p className="text-xs text-gray-500">Route</p>
                          <p className="text-sm font-medium">
                            {row.origin} → {row.destination}
                          </p>
                        </div>

                        {/* Date */}
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="text-sm">
                            {row.date
                              ? new Date(row.date).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              : "-"}
                          </p>
                        </div>

                        {/* Convoy */}
                        <div>
                          <p className="text-xs text-gray-500">Convoy</p>
                          <p className="text-sm">
                            {row.approveconveyname
                              ? `${row.approveconveyname} (${
                                  row.approveConveyTime || "N/A"
                                })`
                              : "N/A"}
                          </p>
                        </div>

                        {/* Passenger */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Passengers</p>
                            <p className="font-semibold">
                              {row.passengerCount}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() =>
                              navigate(`/ManageTrip/PoliceViewTrip/${row.t_id}`)
                            }
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-10 border rounded-lg bg-white">
                      {trips.length > 0
                        ? `No data found for Trip ID "${searchTerm}".`
                        : "No trips found."}
                    </div>
                  )}
                </div>

                {/* Mobile Pagination */}
                {globalTotalPages > 1 && (
                  <div className="lg:hidden flex items-center justify-between mt-6 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      disabled={currentPage === 1}
                      className="flex-1"
                    >
                      Previous
                    </Button>

                    <div className="text-xs text-gray-600 whitespace-nowrap">
                      Page {currentPage} of {globalTotalPages}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={currentPage >= globalTotalPages}
                      className="flex-1"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AllApproveTrips;
