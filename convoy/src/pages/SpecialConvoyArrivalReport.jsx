import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getSpecialCheckoutReports } from "@/contexts/GetApi";

const SpecialConvoyArrivalReport = () => {
  const { user, accessToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTripId, setSearchTripId] = useState("");
  const [searchVehicleNo, setSearchVehicleNo] = useState("");
  const [filteredDate, setFilteredDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const rowsPerPage = 10;
  //Checkout Trip with Status: Approved (1), (0) and (2)
  const fetchTripList = useCallback(async () => {
    // ✅ STOP if user not ready
    if (!accessToken || !user?.checkpostid) return;

    const data = await getSpecialCheckoutReports(
      accessToken,
      user.checkpostid,
      [0, 1, 2],
    );

    const tripList = Array.isArray(data?.data?.data)
      ? data.data.data.map((trip, index) => {
          const approveConvey = trip.approveDetails?.convey;

          return {
            tId: trip.tId || index,
            tripdate: trip.tripdate || "N/A",
            vehicle: trip.vehicle || "N/A",
            convoyName: trip.tripid || "N/A",
            checkpostLocation: trip.checkpostDetails?.location || "N/A",
            approveDate: trip.approveDetails?.arrdate || "N/A",
            approveTime: trip.approveDetails?.arrtime || "",
            approveConvey: approveConvey
              ? `${approveConvey.convey_time} (${approveConvey.convey_name})`
              : "N/A",
            approveCheckpost:
              trip.approveDetails?.checkpostDetails?.location || "",
            checkoutDate: trip.checkpostDetails?.checkoutdate || "N/A",
            checkoutTime: trip.checkpostDetails?.checkouttime || "",
            checkoutCheckpost: trip.checkpostDetails?.location || "N/A",
            checkoutRemarks: trip.remarks || "N/A",
          };
        })
      : [];

    setTrips(tripList);
  }, [accessToken, user]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  const filteredTrips = trips.filter((t) => {
    const searchMatch = `${t.tId} ${t.checkpostLocation} ${t.convoyInfo}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const dateMatch = filteredDate ? t.checkoutDate === filteredDate : true;
    const tripIdMatch =
      !searchTripId || t.tId?.toString().includes(searchTripId);
    const vehicleMatch =
      !searchVehicleNo ||
      t.vehicle?.toLowerCase().includes(searchVehicleNo.toLowerCase());
    return searchMatch && dateMatch && tripIdMatch && vehicleMatch;
  });

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredTrips.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleSearchReset = () => {
    setSearchTerm("");
    setSearchTripId("");
    setSearchVehicleNo("");
    setFilteredDate("");
    setCurrentPage(1);
  };

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
            <div className="mb-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Filter by Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={filteredDate}
                    onChange={(e) => {
                      setFilteredDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                  />
                </div>

                {/* Trip ID Search */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Trip ID
                  </label>
                  <input
                    type="text"
                    value={searchTripId}
                    onChange={(e) => {
                      setSearchTripId(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Enter trip ID"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                  />
                </div>

                {/* Vehicle No Search */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vehicle No
                  </label>
                  <input
                    type="text"
                    value={searchVehicleNo}
                    onChange={(e) => {
                      setSearchVehicleNo(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Enter vehicle no"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
                  />
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSearchReset}
                  >
                    Clear Filters
                  </Button>
                </div>
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
                      <th className="border px-3 py-2">SN</th>
                      <th className="border px-3 py-2">Trip ID</th>
                      <th className="border px-3 py-2">Date & Time</th>
                      <th className="border px-3 py-2">Vehicle </th>
                      <th className="border px-3 py-2">Convoy</th>

                      <th className="border px-3 py-2">Checkout Details</th>
                      <th className="border px-3 py-2 text-center">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.length > 0 ? (
                      currentRows.map((row, i) => {
                        const approve = row.approveDetails;
                        const convey = approve?.convey;

                        return (
                          <tr key={row.tId} className="hover:bg-gray-50">
                            {/* SN */}
                            <td className="border px-3 py-2">
                              {(currentPage - 1) * rowsPerPage + i + 1}
                            </td>

                            {/* Trip ID */}
                            <td className="border px-3 py-2">{row.tId}</td>

                            {/* DATE + TIME (APPROVE) */}
                            <td className="border px-3 py-2">
                              {row.approveDate !== "N/A"
                                ? `${row.approveDate.split("-").reverse().join("-")}${
                                    row.approveTime ? ` ${row.approveTime}` : ""
                                  }`
                                : "N/A"}
                            </td>
                            <td className="border px-3 py-2">{row.vehicle}</td>

                            {/* VEHICLE (FROM CONVEY NAME) */}
                            <td className="border px-3 py-2">
                              {(() => {
                                const val = Number(row.convoyName);

                                if (val >= 100 && val < 200)
                                  return "Emergency Convoy";
                                if (val >= 200) return "VIP Special Convoy";

                                return row.convoyName || "-";
                              })()}
                            </td>

                            {/* CHECKOUT DATE + TIME */}

                            <td className="border px-3 py-2">
                              {row.checkoutDate !== "N/A"
                                ? `${row.checkoutDate.split("-").reverse().join("-")}${
                                    row.checkoutTime
                                      ? ` ${row.checkoutTime}`
                                      : ""
                                  }`
                                : "N/A"}
                            </td>

                            {/* VIEW */}
                            <td className="border px-3 py-2 text-center">
                              <Button
                                size="sm"
                                className="bg-blue-500 text-white"
                                onClick={() =>
                                  navigate(
                                    `/ManageTrip/PoliceViewTrip/${row.tId}?convoy=${approve?.convey?.id || ""}`,
                                  )
                                }
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          No data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 text-sm gap-4">
                  <span className="text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SpecialConvoyArrivalReport;
