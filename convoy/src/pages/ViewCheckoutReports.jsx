import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getCheckoutReports } from "@/contexts/GetApi";

const AllCheckoutTrips = () => {
  const { user, accessToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDate, setFilteredDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const rowsPerPage = 10;
  const [filteredConvey, setFilteredConvey] = useState("");
  // console.log("user", user.checkpostid);

  // 👇 pick convey list based on checkpost
  const conveyList =
    user?.checkpostid === 1
      ? [
          { id: 5, name: "First Convoy", time: "06:30:00" },
          { id: 6, name: "Second Convoy", time: "09:30:00" },
          { id: 7, name: "Third Convoy", time: "12:30:00" },
          { id: 8, name: "Fourth Convoy", time: "15:00:00" },
        ]
      : [
          { id: 1, name: "First Convoy", time: "06:00:00" },
          { id: 2, name: "Second Convoy", time: "09:00:00" },
          { id: 3, name: "Third Convoy", time: "12:00:00" },
          { id: 4, name: "Fourth Convoy", time: "14:30:00" },
        ];
  //Checkout Trip with Status: Approved (1), (0) and (2)
  const fetchTripList = useCallback(async () => {
    if (accessToken) {
      // Pass filteredConvey (selected convey id) to the API
      const data = await getCheckoutReports(
        accessToken,
        user.checkpostid,
        [0, 1, 2],
        filteredConvey, // <-- Add this argument
      );
      const tripList = Array.isArray(data?.data?.data)
        ? data.data.data.map((trip, index) => {
            const approveConvey = trip.approveDetails?.convey;
            return {
              tId: trip.tId || index,
              approveDate: trip.approveDetails?.arrdate || "N/A",
              approveTime: trip.approveDetails?.arrtime || "",
              approveConvey: approveConvey
                ? `${approveConvey.convey_time} (${approveConvey.convey_name})`
                : "N/A",
              approveCheckpost:
                trip.approveDetails?.checkpostDetails?.location || "",
              checkoutDate: trip.checkoutdate || "N/A",
              checkoutTime: trip.checkouttime || "",
              checkoutCheckpost: trip.checkpostDetails?.location || "N/A",
              checkoutRemarks: trip.remarks || "N/A",
            };
          })
        : [];

      setTrips(tripList);
    }
  }, [accessToken, filteredConvey, user.checkpostid]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  const filteredTrips = trips.filter((t) => {
    const searchMatch = `${t.tId} ${t.checkpostLocation} ${t.convoyInfo}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const dateMatch = filteredDate ? t.checkoutDate === filteredDate : true;
    return searchMatch && dateMatch;
  });

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Arrival Trip Details
          </h1>
        </div>
        <Card className="overflow-x-auto">
          <CardHeader />
          <CardContent>
            {/* Filter Form */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              {/* Filter by Date */}
              <div className="w-full sm:w-1/4">
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

              {/* Filter by Convey */}
              <div className="w-full sm:w-1/4">
                <label className="block text-sm font-medium mb-1">
                  Filter by Convoy
                </label>
                <select
                  value={filteredConvey}
                  onChange={(e) => setFilteredConvey(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                >
                  <option value="">All Convoys</option>
                  {conveyList.map((convey) => (
                    <option key={convey.id} value={convey.id}>
                      {convey.name}-{convey.time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="w-full sm:w-1/4">
                <label className="block text-sm font-medium mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Trip ID, Checkpost, Convoy..."
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                />
              </div>

              {/* ✅ Search Button */}
              <div className="w-full sm:w-auto flex items-end">
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    fetchTripList(); // Call with current filters
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow text-sm"
                >
                  Search
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-lg font-semibold">Trip List</h5>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                Total Trips: {filteredTrips.length}
              </span>
            </div>
            {/* <Button
  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded shadow text-sm"
  onClick={() =>
    navigate("/ManageTrip/CheckoutPrint", {
      state: { filteredDate, filteredConvey },
    })
  }
>
  🖨️ Generate Report
</Button> */}

            {/* Table */}
            <div className="hidden sm:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[900px] w-full text-sm text-left text-gray-700 border">
                  <thead className="bg-gray-100 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 border">S.No</th>
                      <th className="px-4 py-2 border">Trip ID</th>
                      <th className="px-4 py-2 border">Approve Date & Time</th>
                      <th className="px-4 py-2 border">Approve Convoy</th>
                      <th className="px-4 py-2 border">Checkout Date & Time</th>
                      <th className="px-4 py-2 border">Checkout Checkpost</th>
                      <th className="px-4 py-2 border">Checkout Remarks</th>
                      <th className="px-4 py-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, i) => (
                      <tr key={row.tId}>
                        <td className="text-center">
                          {(currentPage - 1) * rowsPerPage + i + 1}
                        </td>{" "}
                        {/* Serial no */}
                        <td className="text-center">{row.tId}</td>
                        <td className="text-center">
                          {row.approveDate
                            ? new Date(row.approveDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}{" "}
                          {row.approveTime || ""}
                        </td>
                        <td className="text-center">
                          {row.approveConvey || "N/A"}{" "}
                          {row.approveCheckpost || ""}
                        </td>
                        <td className="text-center">
                          {row.checkoutDate
                            ? new Date(row.checkoutDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}{" "}
                          {row.checkoutTime || ""}
                        </td>
                        <td className="text-center">
                          {row.checkoutCheckpost || "N/A"}
                        </td>
                        <td className="text-center">
                          {row.checkoutRemarks || "N/A"}
                        </td>
                        <td className="text-center">
                          <Button
                            className="bg-black text-white hover:bg-gray-800"
                            onClick={() =>
                              navigate(`/ManageTrip/PoliceViewTrip/${row.tId}`)
                            }
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
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

export default AllCheckoutTrips;
