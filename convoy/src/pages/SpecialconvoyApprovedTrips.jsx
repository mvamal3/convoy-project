import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getsplconvoyTripList } from "@/contexts/GetApi";

const SpecialconvoyApprovedTrips = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // ✅ FETCH API (same pattern as ManageTrip)
  const fetchTrips = useCallback(async () => {
    if (!accessToken) return;

    try {
      const data = await getsplconvoyTripList(accessToken);
      console.log("Fetched Special Convoy Trips:", data);

      const tripList = Array.isArray(data?.data?.trips)
        ? data.data.trips.map((trip) => {
            return {
              t_id: trip.tId,
              date: trip.date,
              vNum: trip.vehicle?.vNum || "",
              time: trip.convey?.actual_start_time || "-",
              vehicle: `${trip.vehicle?.vNum || "-"}${
                trip.vehicle?.vCat ? " (" + trip.vehicle.vCat + ")" : ""
              } (${trip.convey?.convey_name || "-"})`,
              passengerCount: trip.passengers?.length || 0,
              status: trip.status,
            };
          })
        : [];

      setTrips(tripList);
    } catch (error) {
      console.error("Error fetching special convoy trips:", error);
      setTrips([]);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // 🔍 Filter
  const filteredTrips = trips.filter((t) =>
    `${t.vNum} ${t.t_id} ${t.date}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);

  const currentRows = filteredTrips.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return (
    <DashboardLayout>
      <div className="p-2 sm:p-4">
        <Card className="overflow-hidden shadow-md">
          <CardHeader>
            <CardTitle>Approved Special Convoy Trips</CardTitle>
          </CardHeader>

          <CardContent>
            {/* 🔍 Search */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
              <p className="text-sm text-gray-500">
                Showing {filteredTrips.length} trip(s)
              </p>

              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64 border rounded px-3 py-2 text-sm"
              />
            </div>

            {/* 📱 MOBILE */}
            <div className="block sm:hidden space-y-4">
              {currentRows.length > 0 ? (
                currentRows.map((trip, i) => (
                  <div
                    key={trip.t_id}
                    className="border rounded-lg p-4 shadow-sm bg-white"
                  >
                    <div className="text-sm font-medium">
                      #{(currentPage - 1) * rowsPerPage + i + 1} - {trip.origin}{" "}
                      → {trip.destination}
                    </div>

                    <div className="text-xs text-gray-600 mt-2">
                      <p>Date: {trip.date}</p>
                      <p>Convoy Time: {trip.convoyTime}</p>
                      <p>Driver: {trip.driverName}</p>
                      <p>Vehicle: {trip.vehicleNo}</p>
                      <p>Passengers: {trip.passengerCount}</p>
                      <p className="text-green-600 font-semibold">Approved</p>
                    </div>

                    <Button
                      size="sm"
                      className="mt-2 bg-blue-500 text-white"
                      onClick={() => navigate(`ViewTrip/${trip.t_id}`)}
                    >
                      View Application
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No trips found.</p>
              )}
            </div>

            {/* 💻 DESKTOP */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-100 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 border">SN</th>
                    <th className="px-4 py-2 border">Trip Id</th>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Time</th>
                    <th className="px-4 py-2 border">Vehicle No (Type)</th>
                    <th className="px-4 py-2 border">Passengers</th>
                    <th className="px-4 py-2 border text-center">Status</th>
                    <th className="px-4 py-2 border text-center">View</th>
                  </tr>
                </thead>

                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((row, i) => (
                      <tr key={row.t_id} className="hover:bg-gray-50">
                        {/* SN */}
                        <td className="px-4 py-2 border">
                          {(currentPage - 1) * rowsPerPage + i + 1}
                        </td>
                        <td className="px-4 py-2 border">{row.t_id}</td>

                        {/* Date */}
                        <td className="px-4 py-2 border">
                          {row.date
                            ? new Date(row.date).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        {/* Time */}
                        <td className="px-4 py-2 border">{row.time || "-"}</td>

                        {/* Vehicle + Type */}
                        <td className="px-4 py-2 border">{row.vehicle}</td>

                        {/* Passenger Count */}
                        <td className="px-4 py-2 border text-center">
                          {row.passengerCount}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-2 border text-center">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            Approved
                          </span>
                        </td>

                        {/* View */}
                        <td className="px-4 py-2 border text-center">
                          <Button
                            size="sm"
                            className="bg-blue-500 text-white"
                            onClick={() =>
                              navigate(`/ManageTrip/ViewTrip/${row.t_id}`)
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
                        No trips found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 📄 Pagination */}
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

export default SpecialconvoyApprovedTrips;
