import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { getTripList, getCurrentDateTime1 } from "@/contexts/GetApi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { deleteTrip } from "@/contexts/PostApi"; // make sure this API function exists
import toast from "react-hot-toast";
import { verify } from "crypto";

const ManageTrip = () => {
  const { accessToken } = useAuth();
  const [deleteId, setDeleteId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState("upcoming");
  //const today = new Date().toISOString().split("T")[0];
  const [serverTime, setServerTime] = useState("");
  const [serverDate, setServerDate] = useState("");
  const today = serverDate; // use server date for accurate comparisons

  const navigate = useNavigate();
  const location = useLocation();
  const rowsPerPage = 10;

  const fetchTripList = useCallback(async () => {
    if (accessToken) {
      const data = await getTripList(accessToken);
      //console.log("fethcdaata", data);
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
                ? `${conveyTime} (${conveyName})`
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
  // Filters
  // const today = new Date().toISOString().split("T")[0];

  // 🔹 Delete effect (same pattern as ManageVehicle)
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
            "Failed to delete trip: " + (res?.message || "Unknown error")
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

  //console.log("Trips data:", trips);

  const filteredTrips = trips
    .filter((t) => Number(t.status) === 1)
    .filter((t) => {
      const tripDate = t.date ? t.date.split("T")[0] : "";
      return tripDate > today;
    })
    .filter((t) =>
      `${t.origin} ${t.destination} ${t.driverName} ${t.vehicleNo}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const todaysTrips = trips
    .filter((t) => {
      const tripDate = t.date ? t.date.split("T")[0] : "";
      return tripDate === today;
    })
    .filter((t) =>
      `${t.origin} ${t.destination} ${t.driverName} ${t.vehicleNo}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const completedTrips = trips
    .filter((t) => Number(t.status) === 2)
    .filter((t) =>
      `${t.origin} ${t.destination} ${t.driverName} ${t.vehicleNo}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const rejectedTrips = trips
    .filter(
      (t) =>
        Number(t.status) === 3 ||
        Number(t.verifyStatus) === 3 ||
        Number(t.verifyStatus) === 0 ||
        Number(t.status) === 0
    )
    .filter((t) =>
      `${t.origin} ${t.destination} ${t.driverName} ${t.vehicleNo}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  // Set tab from URL or defaults
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (
      tabParam &&
      ["todays", "upcoming", "completed", "rejected"].includes(tabParam)
    ) {
      setTab(tabParam);
    } else {
      if (todaysTrips.length > 0) setTab("todays");
      else if (filteredTrips.length > 0) setTab("upcoming");
      else if (completedTrips.length > 0) setTab("completed");
      else setTab("upcoming");
    }
  }, [
    location.search,
    trips,
    todaysTrips.length,
    filteredTrips.length,
    completedTrips.length,
  ]);

  // Pagination
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredTrips.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);

  // Similarly for completed, rejected, todays trips paginations
  const indexOfLastCompleted = currentPage * rowsPerPage;
  const indexOfFirstCompleted = indexOfLastCompleted - rowsPerPage;
  const currentCompletedRows = completedTrips.slice(
    indexOfFirstCompleted,
    indexOfLastCompleted
  );
  const totalCompletedPages = Math.ceil(completedTrips.length / rowsPerPage);

  const indexOfLastRejected = currentPage * rowsPerPage;
  const indexOfFirstRejected = indexOfLastRejected - rowsPerPage;
  const currentRejectedRows = rejectedTrips.slice(
    indexOfFirstRejected,
    indexOfLastRejected
  );
  const totalRejectedPages = Math.ceil(rejectedTrips.length / rowsPerPage);

  const indexOfLastToday = currentPage * rowsPerPage;
  const indexOfFirstToday = indexOfLastToday - rowsPerPage;
  const currentTodayRows = todaysTrips.slice(
    indexOfFirstToday,
    indexOfLastToday
  );
  const totalTodayPages = Math.ceil(todaysTrips.length / rowsPerPage);

  // Handlers
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  // const handleDelete = (tripId) => {
  //   if (window.confirm("Are you sure you want to delete this trip?")) {
  //     console.log(tripId);
  //   }
  // };
  const handleDelete = (tripId) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      setDeleteId(tripId);
    }
  };

  // init open based on current route
  const [reportsOpen, setReportsOpen] = useState(() =>
    location.pathname.startsWith("/ManageTrip")
  );

  useEffect(() => {
    // keep reports submenu open when on ManageTrip routes
    if (location.pathname.startsWith("/ManageTrip")) {
      setReportsOpen(true);
    }
  }, [location.pathname]);

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-4">
        {/* Header */}
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

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 flex flex-wrap gap-2">
            <TabsTrigger value="todays">Today's Trips</TabsTrigger>

            <TabsTrigger value="upcoming">Upcoming Trips</TabsTrigger>
            <TabsTrigger value="completed">
              Completed Trips/Approved Trip
            </TabsTrigger>
            <TabsTrigger value="rejected">Rejected Trips</TabsTrigger>
          </TabsList>

          {/* Upcoming Trips Tab */}
          <TabsContent value="upcoming">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Trip List</CardTitle>
              </CardHeader>

              <CardContent>
                {/* Search and Info */}
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
                    placeholder="Search by origin, destination, driver, or vehicle..."
                    className="w-full sm:w-64 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
                  />
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden space-y-4">
                  {currentRows.length > 0 ? (
                    currentRows.map((trip, i) => (
                      <div
                        key={trip.t_id}
                        className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
                      >
                        <div className="text-sm font-medium text-gray-800">
                          #{(currentPage - 1) * rowsPerPage + i + 1} -{" "}
                          {trip.origin} → {trip.destination}
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>Date: {trip.date}</p>
                          <p>Convoy Time: {trip.convoyTime}</p>
                          <p>Driver: {trip.driverName}</p>
                          <p>Vehicle: {trip.vehicleNo}</p>
                          <p>Passengers: {trip.passengerCount}</p>
                          <p>status: {trip.status}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            size="sm"
                            className="bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => navigate(`ViewTrip/${trip.t_id}`)}
                          >
                            View Applicatiom
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/CitizenEditTrip/${trip.t_id}`)
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(trip.t_id)}
                          >
                            Delete
                          </Button>
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
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm text-left text-gray-700 border">
                    <thead className="bg-gray-100 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 border">#</th>
                        <th className="px-4 py-2 border">Trip Id</th>
                        <th className="px-4 py-2 border">Origin</th>
                        <th className="px-4 py-2 border">Destination</th>
                        <th className="px-4 py-2 border">Date</th>
                        <th className="px-4 py-2 border">Convoy Time</th>
                        <th className="px-4 py-2 border">Driver</th>
                        <th className="px-4 py-2 border">Vehicle</th>
                        <th className="px-4 py-2 border text-center">Status</th>

                        <th className="px-4 py-2 border text-center">View</th>
                        <th className="px-4 py-2 border">Action</th>
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
                              {row.date
                                ? new Date(row.date).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </td>

                            <td className="px-4 py-2 border">
                              {row.convoyTime}
                            </td>
                            <td className="px-4 py-2 border">
                              {row.driverName}
                            </td>
                            <td className="px-4 py-2 border">
                              {row.vehicleNo}
                            </td>
                            <td className="px-4 py-2 border text-center">
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                                Pending
                              </span>
                            </td>
                            <td className="px-4 py-2 border text-center">
                              <Button
                                size="sm"
                                className="bg-blue-500 text-white hover:bg-blue-600"
                                onClick={() => navigate(`ViewTrip/${row.t_id}`)}
                              >
                                View Application
                              </Button>
                            </td>
                            <td className="px-4 py-2 border">
                              <div className="flex flex-wrap gap-2">
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
                              ? `No data found for "${searchTerm}".`
                              : "No trips found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredTrips.length > rowsPerPage && (
                  <div className="flex flex-col sm:flex-row justify-between mt-4 text-sm items-center gap-2">
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex flex-wrap gap-1">
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
                          variant={
                            currentPage === i + 1 ? "default" : "outline"
                          }
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
          </TabsContent>

          {/* Completed Trips Tab */}
          <TabsContent value="completed">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Completed Trip List</CardTitle>
              </CardHeader>

              <CardContent>
                {/* Search and Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {completedTrips.length} trip(s)
                  </p>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by origin, destination, driver, or vehicle..."
                    className="w-full sm:w-64 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
                  />
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden space-y-4">
                  {currentCompletedRows.length > 0 ? (
                    currentCompletedRows.map((trip, i) => (
                      <div
                        key={trip.t_id}
                        className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
                      >
                        <div className="text-sm font-medium text-gray-800">
                          #{(currentPage - 1) * rowsPerPage + i + 1} -{" "}
                          {trip.origin} → {trip.destination}
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>Date: {trip.date}</p>
                          <p>Convoy Time: {trip.convoyTime}</p>
                          <p>Driver: {trip.driverName}</p>
                          <p>Vehicle: {trip.vehicleNo}</p>
                          <p>Passengers: {trip.passengerCount}</p>
                          <p>Status: Completed</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            size="sm"
                            className="bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => navigate(`ViewTrip/${trip.t_id}`)}
                          >
                            View Application
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm">
                      {completedTrips.length > 0
                        ? `No data found for "${searchTerm}".`
                        : "No trips found."}
                    </p>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm text-left text-gray-700 border">
                    <thead className="bg-gray-100 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 border">#</th>
                        <th className="px-4 py-2 border">Trip Id</th>
                        <th className="px-4 py-2 border">Origin</th>
                        <th className="px-4 py-2 border">Destination</th>
                        <th className="px-4 py-2 border">Date</th>
                        <th className="px-4 py-2 border">Convoy Time</th>
                        <th className="px-4 py-2 border">Driver</th>
                        <th className="px-4 py-2 border">Vehicle</th>
                        <th className="px-4 py-2 border text-center">Status</th>
                        <th className="px-4 py-2 border text-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCompletedRows.length > 0 ? (
                        currentCompletedRows.map((row, i) => (
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
                              {row.date
                                ? new Date(row.date).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </td>

                            <td className="px-4 py-2 border">
                              {row.convoyTime}
                            </td>
                            <td className="px-4 py-2 border">
                              {row.driverName}
                            </td>
                            <td className="px-4 py-2 border">
                              {row.vehicleNo}
                            </td>
                            <td className="px-4 py-2 border text-center">
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                Completed
                              </span>
                            </td>
                            <td className="px-4 py-2 border text-center">
                              <Button
                                size="sm"
                                className="bg-blue-500 text-white hover:bg-blue-600"
                                onClick={() => navigate(`ViewTrip/${row.t_id}`)}
                              >
                                View Application
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="text-center text-gray-500 py-4"
                          >
                            {completedTrips.length > 0
                              ? `No data found for "${searchTerm}".`
                              : "No trips found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {completedTrips.length > rowsPerPage && (
                  <div className="flex flex-col sm:flex-row justify-between mt-4 text-sm items-center gap-2">
                    <span>
                      Page {currentPage} of {totalCompletedPages}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalCompletedPages }, (_, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={
                            currentPage === i + 1 ? "default" : "outline"
                          }
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalCompletedPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Rejected Trip List</CardTitle>
              </CardHeader>

              <CardContent>
                {/* Search and Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {rejectedTrips.length} trip(s)
                  </p>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by origin, destination, driver, or vehicle..."
                    className="w-full sm:w-64 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
                  />
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden space-y-4">
                  {currentRejectedRows.length > 0 ? (
                    currentRejectedRows.map((trip, i) => (
                      <div
                        key={trip.t_id}
                        className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
                      >
                        <div className="text-sm font-medium text-gray-800">
                          #{(currentPage - 1) * rowsPerPage + i + 1} -{" "}
                          {trip.origin} → {trip.destination}
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>Date: {trip.date}</p>
                          <p>Convoy Time: {trip.convoyTime}</p>
                          <p>Driver: {trip.driverName}</p>
                          <p>Vehicle: {trip.vehicleNo}</p>
                          <p>Passengers: {trip.passengerCount}</p>
                          <p>Status: Rejected</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            size="sm"
                            className="bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => navigate(`ViewTrip/${trip.t_id}`)}
                          >
                            View Application
                          </Button>
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
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm text-left text-gray-700 border">
                    <thead className="bg-gray-100 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 border">#</th>
                        <th className="px-4 py-2 border">Trip Id</th>
                        <th className="px-4 py-2 border">Origin</th>
                        <th className="px-4 py-2 border">Destination</th>
                        <th className="px-4 py-2 border">Date</th>
                        <th className="px-4 py-2 border">Convoy Time</th>
                        <th className="px-4 py-2 border">Driver</th>
                        <th className="px-4 py-2 border">Vehicle</th>
                        <th className="px-4 py-2 border text-center">Status</th>
                        <th className="px-4 py-2 border text-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRejectedRows.length > 0 ? (
                        currentRejectedRows.map((row, i) => (
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
                              {row.date
                                ? new Date(row.date).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </td>

                            <td className="px-4 py-2 border">
                              {row.convoyTime}
                            </td>
                            <td className="px-4 py-2 border">
                              {row.driverName}
                            </td>
                            <td className="px-4 py-2 border">
                              {row.vehicleNo}
                            </td>
                            <td className="px-4 py-2 border text-center">
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                                Rejected
                              </span>
                            </td>
                            <td className="px-4 py-2 border text-center">
                              <Button
                                size="sm"
                                className="bg-blue-500 text-white hover:bg-blue-600"
                                onClick={() => navigate(`ViewTrip/${row.t_id}`)}
                              >
                                View Application
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={10}
                            className="text-center text-gray-500 py-4"
                          >
                            {trips.length > 0
                              ? `No data found for "${searchTerm}".`
                              : "No trips found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {rejectedTrips.length > rowsPerPage && (
                  <div className="flex flex-col sm:flex-row justify-between mt-4 text-sm items-center gap-2">
                    <span>
                      Page {currentPage} of {totalRejectedPages}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalRejectedPages }, (_, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={
                            currentPage === i + 1 ? "default" : "outline"
                          }
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalRejectedPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Today's Trips Tab */}
          <TabsContent value="todays">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Today's Trip List</CardTitle>
              </CardHeader>

              <CardContent>
                {/* Search and Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {todaysTrips.length} trip(s) scheduled for today
                  </p>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by origin, destination, driver, or vehicle..."
                    className="w-full sm:w-64 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
                  />
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden space-y-4">
                  {currentTodayRows.length > 0 ? (
                    currentTodayRows.map((trip, i) => (
                      <div
                        key={trip.t_id}
                        className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
                      >
                        <div className="text-sm font-medium text-gray-800">
                          #{(currentPage - 1) * rowsPerPage + i + 1} -{" "}
                          {trip.origin} → {trip.destination}
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>Date: {trip.date}</p>
                          <p>Convoy Time: {trip.convoyTime}</p>
                          <p>Driver: {trip.driverName}</p>
                          <p>Vehicle: {trip.vehicleNo}</p>
                          <p>Passengers: {trip.passengerCount}</p>
                          <p>Status: Today's Trip</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            size="sm"
                            className="bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => navigate(`ViewTrip/${trip.t_id}`)}
                          >
                            View Application
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm">
                      {trips.length > 0
                        ? `No data found for "${searchTerm}".`
                        : "No trips scheduled for today."}
                    </p>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm text-left text-gray-700 border">
                    <thead className="bg-gray-100 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 border">#</th>
                        <th className="px-4 py-2 border">Trip Id</th>
                        <th className="px-4 py-2 border">Origin</th>
                        <th className="px-4 py-2 border">Destination</th>
                        <th className="px-4 py-2 border">Date</th>
                        <th className="px-4 py-2 border">Convoy Time</th>
                        <th className="px-4 py-2 border">Driver</th>
                        <th className="px-4 py-2 border">Vehicle</th>
                        <th className="px-4 py-2 border text-center">View</th>
                        <th className="px-4 py-2 border text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTodayRows.length > 0 ? (
                        currentTodayRows.map((row, i) => (
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
                              {row.date
                                ? new Date(row.date).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </td>

                            <td className="px-4 py-2 border">
                              {row.convoyTime}
                            </td>
                            <td className="px-4 py-2 border">
                              {row.driverName}
                            </td>
                            <td className="px-4 py-2 border">
                              {row.vehicleNo}
                            </td>

                            <td className="px-4 py-2 border text-center">
                              <Button
                                size="sm"
                                className="bg-blue-500 text-white hover:bg-blue-600"
                                onClick={() => navigate(`ViewTrip/${row.t_id}`)}
                              >
                                View Application
                              </Button>
                            </td>
                            <td className="px-4 py-2 border text-center">
                              {row.status === "1" ? (
                                // ✅ Status = 1 → Pending (show Edit/Delete)
                                <div className="flex flex-row flex-nowrap justify-center gap-2 items-center">
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
                                    Reject Trip
                                  </Button>
                                </div>
                              ) : row.status === "2" ? (
                                // ✅ Status = 2 → Approved (show text)
                                <span className="text-green-600 text-xs font-medium">
                                  Approved
                                </span>
                              ) : (
                                // ✅ Status = 0 → Rejected
                                <span className="text-red-500 text-xs font-medium">
                                  Rejected
                                </span>
                              )}
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
                              ? `No data found for "${searchTerm}".`
                              : "No trips scheduled for today."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {todaysTrips.length > rowsPerPage && (
                  <div className="flex flex-col sm:flex-row justify-between mt-4 text-sm items-center gap-2">
                    <span>
                      Page {currentPage} of {totalTodayPages}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalTodayPages }, (_, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={
                            currentPage === i + 1 ? "default" : "outline"
                          }
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalTodayPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManageTrip;
