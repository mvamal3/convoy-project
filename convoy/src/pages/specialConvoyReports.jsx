import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getSpecialConvoyReport } from "@/contexts/GetApi";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SpecialConvoyReport = () => {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVehicleNo, setSearchVehicleNo] = useState("");
  const [searchTripId, setSearchTripId] = useState("");
  const rowsPerPage = 10;

  /* ================= FETCH DATA ================= */
  const fetchReport = useCallback(async () => {
    if (!accessToken) return;

    try {
      const payload = {
        checkpostid: user?.checkpostid,
      };

      if (selectedDate) payload.date = selectedDate;

      const res = await getSpecialConvoyReport(accessToken, payload);

      console.log("🚀 Special Convoy Data:", res);

      setTrips(res?.data || []);
    } catch (err) {
      console.error("❌ Error fetching convoy report", err);
      setTrips([]);
    }
  }, [accessToken, user?.checkpostid, selectedDate]);

  /* ================= PAGINATION ================= */
  const filteredTrips = trips.filter((trip) => {
    const vehicleMatch =
      !searchVehicleNo ||
      trip.vehicle?.toLowerCase().includes(searchVehicleNo.toLowerCase());
    const tripIdMatch =
      !searchTripId || trip.tId?.toString().includes(searchTripId);
    return vehicleMatch && tripIdMatch;
  });

  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);

  const currentRows = filteredTrips.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

  const handleSearchReset = () => {
    setSearchVehicleNo("");
    setSearchTripId("");
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <DashboardLayout>
      <div className="p-2 sm:p-4">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Special Convoy Report</h2>

              <Button variant="outline" onClick={() => navigate(-1)}>
                ← Back
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* 🔍 FILTER */}
            <div className="mb-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Date Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate || ""}
                    onChange={(e) => {
                      setSelectedDate(e.target.value || null);
                      setCurrentPage(1);
                    }}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                {/* Vehicle No Search */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Vehicle No
                  </label>
                  <input
                    type="text"
                    placeholder="Enter vehicle no"
                    value={searchVehicleNo}
                    onChange={(e) => {
                      setSearchVehicleNo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                {/* Trip ID Search */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Trip ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter trip ID"
                    value={searchTripId}
                    onChange={(e) => {
                      setSearchTripId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                {/* Reset Button */}
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

            {/* 📊 TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-100 text-xs uppercase">
                  <tr>
                    <th className="border px-3 py-2">SN</th>
                    <th className="border px-3 py-2">Trip ID</th>
                    <th className="border px-3 py-2">Convoy Time</th>
                    <th className="border px-3 py-2">Checkout Time</th>
                    <th className="border px-3 py-2">Vehicle</th>
                    <th className="border px-3 py-2">Driver</th>
                    <th className="border px-3 py-2">Type</th>
                    <th className="border px-3 py-2">Passenger Count</th>
                    <th className="border px-3 py-2 text-center">View</th>
                  </tr>
                </thead>

                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((row, i) => (
                      <tr key={row.tId} className="hover:bg-gray-50">
                        {/* SN */}
                        <td className="border px-3 py-2">
                          {(currentPage - 1) * rowsPerPage + i + 1}
                        </td>

                        {/* Trip ID */}
                        <td className="border px-3 py-2">{row.tId}</td>

                        {/* ✅ ACTUAL TIME */}
                        <td className="border px-3 py-2">
                          {row.actualDateTime
                            ? new Date(row.actualDateTime).toLocaleString(
                                "en-GB",
                              )
                            : "-"}
                        </td>

                        {/* ✅ CHECKOUT TIME */}
                        <td className="border px-3 py-2">
                          {row.checkoutDateTime
                            ? new Date(row.checkoutDateTime).toLocaleString(
                                "en-GB",
                              )
                            : "-"}
                        </td>

                        {/* ✅ VEHICLE */}
                        <td className="border px-3 py-2">
                          {row.vehicle || "-"}
                        </td>

                        {/* ✅ DRIVER */}
                        <td className="border px-3 py-2">
                          {row.driverName || "-"}
                        </td>
                        <td className="border px-3 py-2">
                          {(() => {
                            const val = Number(row.convoyTime);

                            if (val >= 100 && val < 200)
                              return "Emergency Case";
                            if (val >= 200) return "VIP / Special Convoy";

                            return row.convoyTime || "-";
                          })()}
                        </td>

                        {/* ✅ PASSENGER COUNT */}
                        <td className="border px-3 py-2">
                          {row.passengerCount || "0"}
                        </td>

                        {/* VIEW */}
                        <td className="border px-3 py-2 text-center">
                          <Button
                            size="sm"
                            className="bg-blue-500 text-white"
                            onClick={() =>
                              navigate(`/ManageTrip/PoliceViewTrip/${row.tId}`)
                            }
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {filteredTrips.length > rowsPerPage && (
              <div className="flex justify-between mt-4 text-sm items-center">
                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
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
                    size="sm"
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SpecialConvoyReport;
