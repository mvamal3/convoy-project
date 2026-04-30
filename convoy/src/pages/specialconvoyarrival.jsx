import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getSpecialConvoyCheckOutTrip } from "@/contexts/GetApi";
import { updateCheckoutTripAPI } from "@/contexts/PostApi";
import { toast } from "@/hooks/use-toast";

const Specialconvoyarrival = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [checkoutDate, setCheckoutDate] = useState("");
  const [checkoutTime, setCheckoutTime] = useState("");

  const rowsPerPage = 10;

  // ✅ Fetch checkout trips
  const fetchTrips = useCallback(async () => {
    if (accessToken) {
      const data = await getSpecialConvoyCheckOutTrip(
        accessToken,
        user.checkpostid,
      ); // pass checkpostId dynamically if needed
      console.log("Checkout Trips Data:", data);

      const tripList = Array.isArray(data?.data?.data)
        ? data.data.data.map((t) => ({
            trip_id: t.trip_id,
            origin: t.origin_name,
            destination: t.destination_name,
            vehicle_number: t.vehicle_number,
            driver_name: t.driver_name,
            date: t.date,
            convoy_time: t.convey?.convey_name || "N/A",
            convoyid: t.convey?.id,
            arr_time: t.arr_time,
            total_passengers: t.total_passengers,
          }))
        : [];

      setTrips(tripList);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // ✅ Filter by driver name, vehicle number, origin, destination
  const filteredTrips = trips.filter((t) => {
    const search = searchTerm.toLowerCase();
    return (
      t.driver_name?.toLowerCase().includes(search) ||
      t.vehicle_number?.toLowerCase().includes(search) ||
      t.origin?.toLowerCase().includes(search) ||
      t.destination?.toLowerCase().includes(search)
    );
  });

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredTrips.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handleAction = async (
    status,
    tripId,
    remarks,
    runningConveyId,
    checkoutDate,
    checkoutTime,
  ) => {
    try {
      console.log("actiondestials", {
        status,
        tripId,
        remarks,
        runningConveyId,
        checkoutDate,
        checkoutTime,
      });
      const data = await updateCheckoutTripAPI(accessToken, {
        tId: tripId,
        status,
        checkpostId: user.checkpostid,
        remarks, // ✅ include remarks in payload
        runningConveyId, // ✅ include runningConveyId in payload
        checkoutDate,
        checkoutTime,
      });

      // Show different messages based on status
      let toastMessage = "";
      if (status === 1) {
        toastMessage = "Trip marked as Checked OK ✅";
      } else if (status === 0) {
        toastMessage = "Trip marked as Non-arrival ❌";
      } else if (status === 2) {
        toastMessage = "Trip marked as Problem ⚠️";
      } else {
        toastMessage = data.message || "Checkout trip updated";
      }

      toast({
        title: status === 0 ? "Alert" : "Success",
        description: toastMessage,
        variant: status === 0 ? "destructive" : "default",
      });

      // Refresh trips
      await fetchTrips();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* LEFT */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Arrival Special Convoy Trips
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and process Special Convoy arriving trips at this
              checkpoint
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Arrival Trips</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTrips.length} trip(s)
              </p>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Vehicle Number"
                className="w-full sm:w-64 border rounded px-3 py-1 text-sm focus:outline-none focus:ring focus:border-blue-400"
              />
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden space-y-4">
              {currentRows.length > 0 ? (
                currentRows.map((row, i) => (
                  <div
                    key={row.trip_id}
                    className="border rounded-lg p-4 shadow-sm bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-800">
                      #{(currentPage - 1) * rowsPerPage + i + 1} -{" "}
                      {row.vehicle_number}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Driver: {row.driver_name}
                      <br />
                      Origin: {row.origin} → {row.destination}
                      <br />
                      Convoy: {row.convoy_time}, Arrived: {row.arr_time}
                      <br />
                      Passengers: {row.total_passengers}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm">
                  {trips.length > 0
                    ? `No data found for "${searchTerm}".`
                    : "No trips found."}
                </p>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-700 border">
                  <thead className="bg-gray-100 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Trip Id</th>
                      <th className="px-4 py-2 border">Vehicle</th>
                      <th className="px-4 py-2 border">Driver</th>
                      <th className="px-4 py-2 border">Route</th>
                      <th className="px-4 py-2 border">Convoy Time</th>
                      <th className="px-4 py-2 border">Approve Date & time</th>
                      <th className="px-4 py-2 border">Passengers</th>
                      <th className="px-4 py-2 border">View Details</th>{" "}
                      {/* ✅ NEW */}
                      <th className="px-4 py-2 border">Action</th>{" "}
                      {/* ✅ NEW */}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, i) => (
                      <tr
                        key={row.trip_id}
                        className="hover:bg-gray-50 border-b"
                      >
                        <td className="px-4 py-2 border">
                          {(currentPage - 1) * rowsPerPage + i + 1}
                        </td>
                        <td className="px-4 py-2 border">{row.trip_id}</td>
                        <td className="px-4 py-2 border">
                          {row.vehicle_number}
                        </td>
                        <td className="px-4 py-2 border whitespace-nowrap">
                          {row.driver_name}
                        </td>
                        <td className="px-4 py-2 border whitespace-nowrap">
                          {row.origin} → {row.destination}
                        </td>
                        <td className="px-4 py-2 border">{row.convoy_time}</td>
                        <td className="px-4 py-2 border">
                          {new Date(row.date).toLocaleDateString("en-GB")}{" "}
                          {row.arr_time}
                        </td>

                        <td className="px-4 py-2 border">
                          {row.total_passengers}
                        </td>

                        {/* ✅ View button now inside <td> */}
                        <td className="px-3 py-2 border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/ViewCheckoutTrip/${row.trip_id}`)
                            }
                          >
                            View
                          </Button>
                        </td>

                        {/* ✅ Action buttons also inside <td> */}
                        <td className="px-3 py-2 border">
                          <div className="flex gap-2 whitespace-nowrap">
                            {/* Checked OK */}
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => {
                                setSelectedTrip(row);
                                setCheckoutDate(
                                  new Date().toISOString().split("T")[0],
                                );
                                setCheckoutTime(
                                  new Date().toTimeString().slice(0, 5),
                                );
                                setShowModal(true);
                              }}
                            >
                              Checked OK
                            </Button>

                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => {
                                let remarks = "";
                                while (!remarks.trim()) {
                                  remarks = window.prompt(
                                    "🚨 Please enter remarks for the problem:",
                                  );
                                  if (remarks === null) return;
                                  if (!remarks.trim())
                                    alert("Remarks are required!");
                                }
                                handleAction(
                                  2,
                                  row.trip_id,
                                  remarks,
                                  row.convoyid,
                                );
                              }}
                            >
                              Check Problem
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleAction(
                                  0,
                                  row.trip_id,
                                  "Trip not arrived",
                                  row.convoyid,
                                )
                              }
                            >
                              Non-arrival
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {showModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[350px] shadow-lg">
                      <h2 className="text-lg font-semibold mb-4">
                        Checkout Details
                      </h2>

                      {/* DATE */}
                      <label className="text-sm font-medium">
                        Checkout Date
                      </label>
                      <input
                        type="date"
                        value={checkoutDate}
                        onChange={(e) => setCheckoutDate(e.target.value)}
                        className="w-full border rounded px-2 py-1 mb-3"
                      />

                      {/* TIME */}
                      <label className="text-sm font-medium">
                        Checkout Time
                      </label>
                      <input
                        type="time"
                        value={checkoutTime}
                        onChange={(e) => setCheckoutTime(e.target.value)}
                        className="w-full border rounded px-2 py-1 mb-4"
                      />

                      {/* ACTION BUTTONS */}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowModal(false)}
                        >
                          Cancel
                        </Button>

                        <Button
                          onClick={() => {
                            if (!checkoutDate || !checkoutTime) {
                              alert("Date and Time are required!");
                              return;
                            }

                            handleAction(
                              1,
                              selectedTrip.trip_id,
                              "Special Convoy Checked OK",
                              selectedTrip.convoyid,
                              checkoutDate,
                              checkoutTime,
                            );

                            setShowModal(false);
                          }}
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {filteredTrips.length > rowsPerPage && (
              <div className="flex justify-between mt-4 text-sm items-center">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                  >
                    Previous
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Specialconvoyarrival;
