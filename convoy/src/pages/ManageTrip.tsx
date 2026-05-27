import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTripListCitizen } from "@/contexts/GetApi";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteTrip } from "@/contexts/PostApi";
import toast from "react-hot-toast";

const ManageTrip = () => {
  const { accessToken } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  // =========================
  // STATES
  // =========================
  const [trips, setTrips] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [tripType, setTripType] = useState("upcoming");

  const [deleteId, setDeleteId] = useState(null);

  // =========================
  // PAGINATION STATES
  // =========================
  const [currentPage, setCurrentPage] = useState(1);

  const [chunkPage, setChunkPage] = useState(1);

  const [totalRecords, setTotalRecords] = useState(0);

  // =========================
  // PAGINATION CONSTANTS
  // =========================
  const rowsPerPage = 10;

  const chunkSize = 100;

  // =========================
  // TAB CONFIG
  // =========================
  const tabConfig = {
    todays: {
      title: "Today's Trips",
      badge: (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
          Today's Trip
        </span>
      ),
      emptyMessage: "No trips found for today.",
      showEdit: true,
      showDelete: true,
    },

    upcoming: {
      title: "Upcoming Trips",
      badge: (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
          Pending
        </span>
      ),
      emptyMessage: "No upcoming trips found.",
      showEdit: true,
      showDelete: true,
    },

    completed: {
      title: "Completed Trips",
      badge: (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
          Completed
        </span>
      ),
      emptyMessage: "No completed trips found.",
      showEdit: false,
      showDelete: false,
    },

    rejected: {
      title: "Rejected Trips",
      badge: (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
          Rejected
        </span>
      ),
      emptyMessage: "No rejected trips found.",
      showEdit: false,
      showDelete: false,
    },
  };

  const currentConfig = tabConfig[tripType];

  // =========================
  // FETCH TRIPS
  // =========================
  const fetchTripList = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);

      const response = await getTripListCitizen(
        accessToken,
        tripType,
        chunkPage,
        chunkSize,
        searchTerm,
        selectedDate,
      );

      const rawTrips = response?.data?.trips || [];

      setTotalRecords(response?.data?.totalRecords || 0);

      const parsedTrips = rawTrips.map((trip) => {
        const conveyTime = trip.convey?.convey_time || "N/A";

        const conveyName = trip.convey?.convey_name || "";

        return {
          t_id: trip.tId,

          origin: trip.originLocation?.location || "N/A",

          destination: trip.destinationLocation?.location || "N/A",

          date: trip.date,

          convoyTime: conveyName ? `${conveyTime} (${conveyName})` : conveyTime,

          driverName:
            `${trip.driver?.dFirstName || ""} ${
              trip.driver?.dLastName || ""
            }`.trim() || "N/A",

          vehicleNo: trip.vehicle?.vNum || "N/A",

          passengerCount: trip.passengers?.length || 0,

          status: trip.status,
        };
      });

      setTrips(parsedTrips);
    } catch (error) {
      console.error("Error fetching trips:", error);

      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [accessToken, tripType, chunkPage, searchTerm, selectedDate]);

  // =========================
  // FETCH ON CHANGE
  // =========================
  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  // =========================
  // RESET PAGINATION
  // =========================
  // RESET WHEN TAB CHANGES
  useEffect(() => {
    setCurrentPage(1);

    setChunkPage(1);

    setSearchTerm("");

    setSelectedDate("");
  }, [tripType]);

  // RESET PAGINATION WHEN FILTER CHANGES
  useEffect(() => {
    setCurrentPage(1);

    setChunkPage(1);
  }, [searchTerm, selectedDate]);

  // =========================
  // AUTO NEXT CHUNK
  // =========================
  // =========================
  // AUTO NEXT CHUNK
  // =========================
  useEffect(() => {
    const requiredChunk =
      Math.floor(((currentPage - 1) * rowsPerPage) / chunkSize) + 1;

    if (requiredChunk !== chunkPage) {
      setChunkPage(requiredChunk);
    }
  }, [currentPage, rowsPerPage, chunkSize, chunkPage]);

  // =========================
  // =========================
  // LOCAL PAGINATION
  // =========================
  // =========================
  // LOCAL PAGINATION
  // =========================
  const localIndex = ((currentPage - 1) * rowsPerPage) % chunkSize;

  const currentRows = trips.slice(localIndex, localIndex + rowsPerPage);

  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  // =========================
  // PAGINATION BUTTONS
  // =========================
  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  // =========================
  // URL TAB SYNC
  // =========================
  // =========================
  // URL TAB SYNC (ONLY FIRST LOAD)
  // =========================
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const tab = params.get("tab");

    if (tab && ["todays", "upcoming", "completed", "rejected"].includes(tab)) {
      setTripType(tab);
    }
  }, []);

  // =========================
  // DELETE TRIP
  // =========================
  const handleDelete = async (tripId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this trip?",
    );

    if (!confirmDelete) return;

    try {
      setDeleteId(tripId);

      const res = await deleteTrip(accessToken, tripId);

      if (res?.success) {
        toast.success("Trip deleted successfully");

        fetchTripList();
      } else {
        toast.error(res?.message || "Delete failed");
      }
    } catch (error) {
      console.error(error);

      toast.error("Delete failed");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-4">
        {/* HEADER */}
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

        {/* TABS */}
        <Tabs value={tripType} onValueChange={setTripType}>
          <TabsList className="mb-4 flex flex-wrap gap-2">
            <TabsTrigger value="todays">Today's Trips</TabsTrigger>

            <TabsTrigger value="upcoming">Upcoming Trips</TabsTrigger>

            <TabsTrigger value="completed">Completed Trips</TabsTrigger>

            <TabsTrigger value="rejected">Rejected Trips</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* MAIN CARD */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{currentConfig.title}</CardTitle>
          </CardHeader>

          <CardContent>
            {/* SEARCH */}
            {/* FILTER SECTION */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
              {/* LEFT SIDE */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing {currentRows.length} of {totalRecords} trips
                </p>
              </div>

              {/* RIGHT SIDE FILTERS */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                {/* SEARCH */}
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    placeholder="Search by Trip ID or Vehicle No..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* DATE FILTER */}
                <div className="w-full sm:w-52">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* CLEAR FILTER */}
                {(searchTerm || selectedDate) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDate("");
                    }}
                    className="w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="text-center py-10 text-gray-500">
                Loading trips...
              </div>
            ) : (
              <>
                {/* MOBILE VIEW */}
                <div className="block lg:hidden space-y-4">
                  {currentRows.length > 0 ? (
                    currentRows.map((trip, i) => (
                      <div
                        key={trip.t_id}
                        className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">
                            #{(currentPage - 1) * rowsPerPage + i + 1}
                          </div>

                          {currentConfig.badge}
                        </div>

                        <div className="text-sm font-semibold">
                          {trip.origin} → {trip.destination}
                        </div>

                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            <span className="font-semibold">Trip ID:</span>{" "}
                            {trip.t_id}
                          </p>

                          <p>
                            <span className="font-semibold">Date:</span>{" "}
                            {trip.date}
                          </p>

                          <p>
                            <span className="font-semibold">Convoy:</span>{" "}
                            {trip.convoyTime}
                          </p>

                          <p>
                            <span className="font-semibold">Driver:</span>{" "}
                            {trip.driverName}
                          </p>

                          <p>
                            <span className="font-semibold">Vehicle:</span>{" "}
                            {trip.vehicleNo}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            size="sm"
                            className="bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => navigate(`ViewTrip/${trip.t_id}`)}
                          >
                            View
                          </Button>

                          {currentConfig.showEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/CitizenEditTrip/${trip.t_id}`)
                              }
                            >
                              Edit
                            </Button>
                          )}

                          {currentConfig.showDelete && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deleteId === trip.t_id}
                              onClick={() => handleDelete(trip.t_id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-10">
                      {currentConfig.emptyMessage}
                    </div>
                  )}
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm text-left text-gray-700 border">
                    <thead className="bg-gray-100 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 border">#</th>

                        <th className="px-4 py-2 border">Trip ID</th>

                        <th className="px-4 py-2 border">Origin</th>

                        <th className="px-4 py-2 border">Destination</th>

                        <th className="px-4 py-2 border">Date</th>

                        <th className="px-4 py-2 border">Convoy</th>

                        <th className="px-4 py-2 border">Driver</th>

                        <th className="px-4 py-2 border">Vehicle</th>

                        <th className="px-4 py-2 border text-center">Status</th>

                        <th className="px-4 py-2 border text-center">
                          Actions
                        </th>
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

                            <td className="px-4 py-2 border">{row.origin}</td>

                            <td className="px-4 py-2 border">
                              {row.destination}
                            </td>

                            <td className="px-4 py-2 border">
                              {row.date
                                ? new Date(row.date).toLocaleDateString("en-GB")
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
                              {currentConfig.badge}
                            </td>

                            <td className="px-4 py-2 border">
                              <div className="flex justify-center gap-2">
                                <Button
                                  size="sm"
                                  className="bg-blue-500 text-white hover:bg-blue-600"
                                  onClick={() =>
                                    navigate(`ViewTrip/${row.t_id}`)
                                  }
                                >
                                  View
                                </Button>

                                {currentConfig.showEdit && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      navigate(`/CitizenEditTrip/${row.t_id}`)
                                    }
                                  >
                                    Edit
                                  </Button>
                                )}

                                {currentConfig.showDelete && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={deleteId === row.t_id}
                                    onClick={() => handleDelete(row.t_id)}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={10}
                            className="text-center text-gray-500 py-10"
                          >
                            {currentConfig.emptyMessage}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <span className="text-sm text-gray-600">
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageTrip;
