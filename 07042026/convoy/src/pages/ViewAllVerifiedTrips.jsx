import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { getVerifiedTripDetails, getConveyDetails } from "@/contexts/GetApi";
import { formatDateDDMMYY } from "@/utils/dateUtils";

const AllVerifiedTrips = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDate, setFilteredDate] = useState("");
  const [selectedconvoy, setselectedconvoy] = useState("");
  const [conveyList, setConveyList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ SORT STATE
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc",
  });

  const rowsPerPage = 10;

  // ✅ Read date from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateFromUrl = params.get("date");
    if (dateFromUrl) setFilteredDate(dateFromUrl);
  }, [location.search]);

  // ✅ Fetch Convey List
  useEffect(() => {
    const fetchConveys = async () => {
      if (!accessToken) return;
      try {
        const res = await getConveyDetails(accessToken, user.checkpostid);
        setConveyList(res?.data?.data || []);
      } catch {
        setConveyList([]);
      }
    };
    fetchConveys();
  }, [accessToken, user.checkpostid]);

  // ✅ Fetch Verified Trips
  const fetchTripList = useCallback(async () => {
    if (!accessToken) return;

    try {
      const data = await getVerifiedTripDetails(
        accessToken,
        user.checkpostid,
        selectedconvoy || null
      );

      const tripList = Array.isArray(data?.data?.trips)
        ? data.data.trips.map((trip) => {
            const officer = trip.verifiedDetails?.verifiedOfficer;

            return {
              t_id: trip.tId,
              origin: trip.originLocation?.location || "N/A",
              destination: trip.destinationLocation?.location || "N/A",
              conveyName: trip.convey?.convey_name || "N/A",
              conveyTime: trip.convey?.convey_time || "N/A",
              tripDate: trip.date || "",
              verifiedDate: trip.verifiedDetails?.vdate || "",
              verifiedTime: trip.verifiedDetails?.vtime || "",
              verifiedBy: officer
                ? `${officer.title || ""} ${officer.firstName || ""} ${
                    officer.lastName || ""
                  }`.trim()
                : "N/A",
              remarks: trip.verifiedDetails?.remarks || "-",
            };
          })
        : [];

      setTrips(tripList);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching verified trips:", err);
    }
  }, [accessToken, user.checkpostid, selectedconvoy]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  // ✅ SORT HANDLER
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // ✅ Triangle sort icons (always visible)
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "▲▼"; // default (unsorted)
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  // ✅ FILTER + SORT
  const filteredTrips = [...trips]
    .filter((t) => {
      const search = searchTerm.trim().toLowerCase();
      const tripIdMatch = t.t_id?.toLowerCase().includes(search);
      const dateMatch = filteredDate ? t.tripDate === filteredDate : true;
      return tripIdMatch && dateMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (!aVal || !bVal) return 0;

      if (sortConfig.direction === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

  // ✅ PAGINATION
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredTrips.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);
  const handleBack = () => {
    navigate(-1); // 🔙 Go to previous page
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            All Approved Trip List
          </h1>

          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            ← Back
          </Button>
        </div>

        <Card>
          <CardHeader />
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium mb-1">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={filteredDate}
                  onChange={(e) => setFilteredDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium mb-1">
                  Search by Trip ID
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter Trip ID..."
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium mb-1">
                  Filter by Convey
                </label>
                <select
                  value={selectedconvoy}
                  onChange={(e) => setselectedconvoy(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">All Convey</option>
                  {conveyList.map((convey) => (
                    <option key={convey.id} value={convey.id}>
                      {convey.convey_name} ({convey.convey_time})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredTrips.length} trip(s)
            </p>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm border">
                <thead className="bg-gray-100 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 border">#</th>

                    <th
                      className="px-4 py-2 border cursor-pointer select-none"
                      onClick={() => handleSort("t_id")}
                    >
                      <span className="flex items-center gap-1">
                        Trip ID
                        <span className="text-xs">{getSortIcon("t_id")}</span>
                      </span>
                    </th>

                    <th className="px-4 py-2 border text-center">Route</th>

                    <th
                      className="px-4 py-2 border cursor-pointer select-none"
                      onClick={() => handleSort("tripDate")}
                    >
                      <span className="flex items-center gap-1">
                        Trip Date
                        <span className="text-xs">
                          {getSortIcon("tripDate")}
                        </span>
                      </span>
                    </th>

                    <th
                      className="px-4 py-2 border cursor-pointer select-none"
                      onClick={() => handleSort("verifiedDate")}
                    >
                      <span className="flex items-center gap-1">
                        Verified On
                        <span className="text-xs">
                          {getSortIcon("verifiedDate")}
                        </span>
                      </span>
                    </th>

                    <th className="px-4 py-2 border">Verified By</th>
                    <th className="px-4 py-2 border">Convoy Details</th>
                    <th className="px-4 py-2 border">Remarks</th>
                    <th className="px-4 py-2 border">Passengers</th>
                  </tr>
                </thead>

                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((row, i) => (
                      <tr key={row.t_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border">
                          {(currentPage - 1) * rowsPerPage + i + 1}
                        </td>
                        <td className="px-4 py-2 border">{row.t_id}</td>
                        <td className="px-4 py-2 border">
                          {row.origin} → {row.destination}
                        </td>
                        <td className="px-4 py-2 border">
                          {formatDateDDMMYY(row.tripDate)}
                        </td>
                        <td className="px-4 py-2 border">
                          {formatDateDDMMYY(row.verifiedDate)}{" "}
                          {row.verifiedTime}
                        </td>
                        <td className="px-4 py-2 border">{row.verifiedBy}</td>
                        <td className="px-4 py-2 border">
                          {row.conveyName} {row.conveyTime}
                        </td>
                        <td className="px-4 py-2 border">{row.remarks}</td>
                        <td className="px-4 py-2 border">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/ManageTrip/PoliceViewTrip/${row.t_id}`)
                            }
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-4 text-gray-500"
                      >
                        No verified trips found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AllVerifiedTrips;
