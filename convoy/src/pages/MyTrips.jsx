import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getTripList,
  getCurrentDateTime1,
  getConveyDetails,
} from "@/contexts/GetApi";
import { deleteTrip } from "@/contexts/PostApi"; // make sure this API function exists
import toast from "react-hot-toast";

const MyTrips = () => {
  const { accessToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [serverTime, setServerTime] = useState("");
  const [serverDate, setServerDate] = useState("");
  const rowsPerPage = 5;
  const navigate = useNavigate();

  const [convoyList, setConvoyList] = useState([]);
  const [selectedConvoy, setSelectedConvoy] = useState("");

  //const today = new Date().toISOString().split("T")[0];
  const today = serverDate; // use server date for accurate comparisons
  console.log("Today's date:", today);

  const fetchTripList = useCallback(async () => {
    if (accessToken) {
      const data = await getTripList(accessToken);
      //console.log("Fetched trip data:", data);
      const tripList = Array.isArray(data?.data?.trips)
        ? data.data.trips.map((trip) => {
            const conveyTime = trip.convey?.convey_time || "N/A";
            const conveyName = trip.convey?.convey_name || "";
            return {
              t_id: trip.tId,
              origin: trip.originLocation.location,
              destination: trip.destinationLocation.location,
              date: trip.date,
              convoyTime: conveyName
                ? `${conveyTime}<br />(${conveyName})` // ✅ Line break added here
                : conveyTime,
              driverName:
                `${trip.driver.dFirstName} ${trip.driver.dLastName}`.trim(),
              licenseNo: trip.driver.licenseNo,
              vehicleNo: trip.vehicle.vNum,
              passengerCount: trip.passengers.length,
              status: trip.status,
              verifystatus: trip.verifiystatus,
            };
          })
        : [];
      tripList.sort((a, b) => Number(b.t_id) - Number(a.t_id));
      setTrips(tripList);
    }
  }, [accessToken]);
  // console.log("Trips fetched:", tripList);

  useEffect(() => {
    const fetchConvoys = async () => {
      if (!accessToken) return;
      try {
        const res = await getConveyDetails(accessToken);
        console.log("Fetched convoy data:", res);
        setConvoyList(res?.data?.data || []);
      } catch {
        setConvoyList([]);
      }
    };
    fetchConvoys();
  }, [accessToken]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  useEffect(() => {
    const fetchServerTime = async () => {
      if (!accessToken) return;
      try {
        const currentTimeData = await getCurrentDateTime1(accessToken);
        setServerTime(currentTimeData?.time); // format "HH:mm"
        setServerDate(currentTimeData?.date); // format "YYYY-MM-DD"
        console.log("Fetched server time:", currentTimeData?.time);
        console.log("Fetched server date:", currentTimeData?.date);
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };
    fetchServerTime();
  }, [accessToken]);

  useEffect(() => {
    if (!deleteId) return;

    const performDelete = async () => {
      try {
        const res = await deleteTrip(accessToken, deleteId);
        if (res?.success) {
          toast.success("Trip deleted successfully!");
          // ✅ Refresh list from server after delete
          await fetchTripList();
        } else {
          toast.error(
            "Failed to delete trip: " + (res?.message || "Unknown error"),
          );
        }
      } catch (error) {
        console.error("Delete API error:", error);
        toast.error("Error deleting trip");
      } finally {
        setDeleteId(null);
      }
    };

    performDelete();
  }, [deleteId, accessToken, fetchTripList]);

  // Filter and sort trips
  // Filter and sort trips — ✅ Search only by Trip ID
  const filteredAndSortedTrips = trips
    .filter((t) =>
      t.t_id.toString().toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedTrips.length / rowsPerPage);
  const currentTrips = filteredAndSortedTrips.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleDelete = (tripId) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      setDeleteId(tripId);
      setTrips((prev) => prev.filter((t) => t.t_id !== tripId));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Manage Trips</h1>
          <Button
            className="w-full sm:w-auto"
            onClick={() => navigate("/AddTrip")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Trip
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>All Trips</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedTrips.length} trip(s)
              </p>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                placeholder="Search by Trip ID..."
                className="w-full sm:w-64 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
              />
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm text-left text-gray-700 border">
                <thead className="bg-gray-100 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 border whitespace-nowrap">#</th>
                    <th className="px-4 py-2 border whitespace-nowrap">
                      Trip Id
                    </th>
                    <th className="px-4 py-2 border whitespace-nowrap">
                      Route
                    </th>
                    <th className="px-4 py-2 border whitespace-nowrap">Date</th>
                    <th className="px-4 py-2 border whitespace-nowrap">
                      Convoy Time
                    </th>
                    <th className="px-4 py-2 border whitespace-nowrap">
                      Vehicle
                    </th>
                    <th className="px-4 py-2 border text-center whitespace-nowrap">
                      Status
                    </th>

                    {/* <th className="px-4 py-2 border text-center whitespace-nowrap">
                      status
                    </th>
                    <th className="px-4 py-2 border text-center whitespace-nowrap">
                      verify
                    </th> */}
                    <th className="px-4 py-2 border text-center whitespace-nowrap">
                      View
                    </th>
                    <th className="px-4 py-2 border whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrips.length > 0 ? (
                    currentTrips.map((row, i) => {
                      const tripDate = row.date ? row.date.split("T")[0] : "";

                      // ✅ date conditions
                      const isPastTrip = tripDate < today;
                      const isTodayOrFuture = tripDate >= today;

                      // ✅ pending stage condition
                      const isPending =
                        Number(row.status) === 1 &&
                        Number(row.verifystatus) === 0;

                      const isEditable = tripDate >= today; // today or future
                      const isCompleted =
                        row.status === "2" ||
                        row.status === 2 ||
                        row.status === "Completed";

                      return (
                        <tr
                          key={row.t_id}
                          className={`border-b hover:bg-gray-50 ${
                            isPastTrip ? "bg-gray-50 opacity-70" : ""
                          }`}
                        >
                          <td className="px-4 py-2 border whitespace-nowrap">
                            {(currentPage - 1) * rowsPerPage + i + 1}
                          </td>
                          <td className="px-4 py-2 border whitespace-nowrap">
                            {row.t_id}
                          </td>
                          <td className="px-4 py-2 border text-sm font-medium text-gray-700 whitespace-nowrap">
                            <span className="text-primary">{row.origin}</span>
                            <span className="mx-1 text-gray-500">→</span>
                            <span className="text-primary">
                              {row.destination}
                            </span>
                          </td>
                          <td className="px-4 py-2 border">
                            {row.date
                              ? new Date(row.date).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>

                          <td
                            className="px-4 py-2 border whitespace-nowrap"
                            dangerouslySetInnerHTML={{ __html: row.convoyTime }}
                          />
                          <td className="px-4 py-2 border whitespace-nowrap">
                            {row.vehicleNo}
                          </td>
                          <td className="px-4 py-2 border text-center whitespace-nowrap">
                            {(Number(row.status) === 1 &&
                              Number(row.verifystatus) === 0) ||
                            Number(row.verifystatus) === "NULL" ? (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                                Pending
                              </span>
                            ) : Number(row.status) === 2 ? (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                Completed
                              </span>
                            ) : Number(row.status) === 3 ||
                              Number(row.verifystatus) === 3 ||
                              Number(row.verifystatus) === 1 ? (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                                Rejected
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                Unknown
                              </span>
                            )}
                          </td>
                          {/* <td className="px-4 py-2 border whitespace-nowrap">
                            {row.status}
                          </td>
                          <td className="px-4 py-2 border whitespace-nowrap">
                            {row.verifystatus}
                          </td> */}

                          <td className="px-4 py-2 border text-center whitespace-nowrap">
                            <Button
                              size="sm"
                              className="bg-blue-500 text-white hover:bg-blue-600"
                              onClick={() =>
                                navigate(`/ManageTrip/ViewTrip/${row.t_id}`)
                              }
                            >
                              View Application
                            </Button>
                          </td>

                          {/* ✅ Disable edit/delete if completed */}
                          {/* ✅ Disable edit/delete if completed OR status is 0 (soft deleted) */}
                          <td className="px-4 py-2 border whitespace-nowrap text-center">
                            {isTodayOrFuture && isPending ? (
                              <div className="flex flex-wrap justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(`/CitizenEditTrip/${row.t_id}`)
                                  }
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(row.t_id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 italic">
                                {isPastTrip
                                  ? "Past trips cannot be modified"
                                  : !isPending
                                    ? "Trip already processed"
                                    : "Editing disabled"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center text-gray-500 py-4"
                      >
                        No trips found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-between items-center mt-4">
              <Button
                className="mr-2"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                className="ml-2"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyTrips;
