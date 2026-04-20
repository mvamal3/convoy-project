import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDateDDMMYY } from "@/utils/dateUtils";

import {
  getTripListByPoliceId,
  getConveyDetails,
  getRunningConveyDetails,
} from "@/contexts/GetApi";
import {
  approveTripAPI,
  handleStartConvoyAPI,
  stopConveyAPI,
} from "@/contexts/PostApi";
import { toast } from "@/components/ui/use-toast";
import { Html5Qrcode } from "html5-qrcode";

const PoliceManageTrip = () => {
  const { user, accessToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [scannerActive, setScannerActive] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [conveyList, setConveyList] = useState([]);
  const [selectedConveyId, setSelectedConveyId] = useState("");
  const [runningConveyId, setRunningConveyId] = useState(null);
  const [runningConvey, setRunningConvey] = useState(null);
  const navigate = useNavigate();
  const rowsPerPage = 10;

  // Updated on 30th December 2025
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRemarks, setCancelRemarks] = useState("");
  const [cancelTripInfo, setCancelTripInfo] = useState(null);
  const qrScannerRef = useRef(null);

  /** ---------------- Fetch Trips ------------------ */
  const fetchTripList = useCallback(async () => {
    if (accessToken) {
      const data = await getTripListByPoliceId(accessToken, user.checkpostid);
      console.log("Trip list", data);

      const tripList = Array.isArray(data?.data?.trips)
        ? data.data.trips.map((trip) => {
            const conveyTime = trip.convey?.convey_time || "N/A";
            const conveyName = trip.convey?.convey_name || "";

            return {
              t_id: trip.tId,
              origin: trip.originLocation?.location || "N/A",
              destination: trip.destinationLocation?.location || "N/A",
              date: trip.date,
              convoyTime: conveyName
                ? `${conveyTime} (${conveyName})`
                : conveyTime,
              driverName: trip.driver
                ? `${trip.driver.dFirstName || ""} ${
                    trip.driver.dLastName || ""
                  }`.trim()
                : "N/A",
              licenseNo: trip.driver?.licenseNo || "N/A",
              vehicleNo: trip.vehicle?.vNum || "N/A",
              vehicleCategory: trip.vehicle?.vCat || "N/A",
              passengerCount: trip.passengers?.length || 0,
              entrydatetime: trip.entrydatetime || null,
              verifiedtime: trip.verifiedtime || null,
            };
          })
        : [];

      tripList.sort((a, b) => {
        if (!a.verifiedtime && !b.verifiedtime) return 0;
        if (!a.verifiedtime) return 1;
        if (!b.verifiedtime) return -1;

        // ✅ Compare verifiedtime strings directly (HH:MM:SS)
        return a.verifiedtime.localeCompare(b.verifiedtime);
      });

      setTrips(tripList);
    }
  }, [accessToken, user.checkpostid]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  const filteredTrips = trips.filter((t) =>
    `${t.origin} ${t.destination} ${t.driverName} ${t.vehicleNo}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredTrips.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  /** ---------------- Fetch Running Convey ------------------ */
  const fetchRunningConvey = useCallback(async () => {
    if (!accessToken) return;

    try {
      const res = await getRunningConveyDetails(accessToken, user.checkpostid);
      const payload = res?.data?.data ?? res?.data ?? res;
      //console.log("PAyoadtime", payload.starttime);
      if (payload && payload.status === 1) {
        // Merge tconvey info with the actual starttime
        setRunningConvey({
          ...payload.tconvey, // id, convey_name, convey_time
          start_time: payload.starttime, // actual started time
        });
        setRunningConveyId(payload.conveyid ?? payload.tconvey?.id ?? null);
      } else {
        setRunningConveyId(null);
        setRunningConvey(null);
      }
    } catch {
      setRunningConveyId(null);
      setRunningConvey(null);
    }
  }, [accessToken, user.checkpostid]);

  useEffect(() => {
    fetchRunningConvey();
  }, [fetchRunningConvey]);

  /** ---------------- Approve Trip ------------------ */
  const handlesapprovetrip = async (tripId, buttonId) => {
    try {
      const res = await getRunningConveyDetails(accessToken, user.checkpostid);
      const running = res?.data?.data ?? res?.data ?? res;
      const conveyId = running?.conveyid;

      if (!conveyId) {
        toast({
          title: "No running convoy found",
          description: "Cannot approve trip without an active convoy.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        tId: String(tripId),
        convey_id: conveyId,
        checkpost_id: user.checkpostid,
        remarks: "All details verified and OK.",
        astatus: 1,
        buttonId: Number(buttonId),
        approveby: user.pol_reg_id,
      };
      //console.log("Approve Payload", payload);

      await approveTripAPI(payload, accessToken);
      toast({ title: "Trip approved successfully" });
      await fetchRunningConvey();
      fetchTripList();
    } catch (error) {
      toast({
        title: "Failed to approve trip",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  /** ---------------- Cancel Trip ------------------ */
  // const handleCancelTrip = async (tripId, buttonId) => {
  //   try {
  //     const payload = {
  //       tId: String(tripId),
  //       convey_id: 1, // default/fallback
  //       checkpost_id: user.checkpostid,
  //       remarks: "Cancel via UI",
  //       astatus: 0,
  //       buttonId: Number(buttonId),
  //       approveby: user.pol_reg_id,
  //     };
  //     await approveTripAPI(payload, accessToken);
  //     toast({ title: "Trip canceled successfully" });
  //     fetchTripList();
  //   } catch (error) {
  //     toast({
  //       title: "Failed to cancel trip",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   }
  // };

  // Updated on 30th December 2025
  const handleCancelTrip = async () => {
    const res = await getRunningConveyDetails(accessToken, user.checkpostid);
    const running = res?.data?.data ?? res?.data ?? res;
    const conveyId = running?.conveyid;

    if (!conveyId) {
      toast({
        title: "No running convoy found",
        description: "Cannot approve trip without an active convoy.",
        variant: "destructive",
      });
      return;
    }
    if (!cancelRemarks.trim()) {
      toast({
        title: "Remarks required",
        description: "Please enter cancellation remarks",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        tId: String(cancelTripInfo.tripId),
        convey_id: conveyId,
        checkpost_id: user.checkpostid,
        remarks: cancelRemarks, // ✅ user-entered remarks
        astatus: 0,
        buttonId: Number(cancelTripInfo.buttonId),
        approveby: user.pol_reg_id,
      };
      console.log("Cancel Payload", payload);

      await approveTripAPI(payload, accessToken);

      toast({ title: "Trip canceled successfully" });
      setShowCancelModal(false);
      fetchTripList();
    } catch (error) {
      toast({
        title: "Failed to cancel trip",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  /** ---------------- Start Convey ------------------ */
  const handleStartConvoy = async () => {
    if (!selectedConveyId) {
      toast({
        title: "Error",
        description: "Please select a convoy",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        convey_id: selectedConveyId,
        checkpost_id: user.checkpostid,
      };
      const response = await handleStartConvoyAPI(accessToken, payload);

      if (response.success) {
        toast({ title: "Success", description: response.message });
        await fetchRunningConvey();
        setSelectedConveyId("");
        fetchTripList();
      } else {
        toast({
          title: "Failed",
          description: response.message || "Unable to start convoy.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.message || "Something went wrong while starting convoy.",
        variant: "destructive",
      });
    }
  };

  /** ---------------- Stop Convey ------------------ */
  const handleStopConvey = async () => {
    if (!runningConveyId) return;

    try {
      const payload = {
        convey_id: runningConveyId,
        checkpost_id: user.checkpostid,
      };

      const response = await stopConveyAPI(accessToken, payload);
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Convoy stopped successfully.",
        });
        await fetchRunningConvey();
        fetchTripList();
        const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
        const queryParams = new URLSearchParams();
        queryParams.append("date", today);
        queryParams.append("convey", runningConveyId);

        // ✅ Navigate to Trip Report page
        navigate(`/trip-report?${queryParams.toString()}`);
      } else {
        toast({
          title: "Failed",
          description: response.message || "Unable to stop convoy.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.message || "Something went wrong while stopping convoy.",
        variant: "destructive",
      });
    }
  };

  /** ---------------- QR Scanner ------------------ */
  useEffect(() => {
    if (!showScannerModal) return;

    // ✅ Create scanner instance
    qrScannerRef.current = new Html5Qrcode("qr-reader");

    qrScannerRef.current
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          // 🔒 Prevent multiple triggers
          if (!qrScannerRef.current) return;

          await qrScannerRef.current.stop();
          await qrScannerRef.current.clear();
          qrScannerRef.current = null;

          setShowScannerModal(false);

          // ✅ SPA navigation
          navigate(`/approvals/ApproveTrip/${decodedText}`);
        },
      )
      .catch(() => {
        setShowScannerModal(false);
        toast({
          title: "Camera Error",
          description:
            "Camera not accessible. Please use a secure browser or HTTPS.",
          variant: "destructive",
        });
      });

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {});
        qrScannerRef.current = null;
      }
    };
  }, [showScannerModal, navigate]);

  /** ---------------- Fetch Convey List ------------------ */
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

  /** ---------------- UI ------------------ */
  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900">
              Today Trip List
            </h1>
            {runningConveyId ? (
              <p className="text-sm text-green-600 mt-1">
                Running Convoy: {runningConvey?.convey_name ?? "Unknown"} <br />
                Scheduled: {runningConvey?.convey_time ?? "--:--"} <br />
                Started At:{runningConvey?.start_time ?? "--:--"}
              </p>
            ) : (
              <p className="text-sm text-red-500 mt-1 font-semibold">
                🚫 Currently No Convoy Started
              </p>
            )}
          </div>

          <div className="flex items-center space-x-8">
            {!runningConveyId ? (
              <>
                <select
                  className="border border-gray-300 rounded-md p-2"
                  value={selectedConveyId}
                  onChange={(e) => setSelectedConveyId(e.target.value)}
                >
                  <option value="" disabled>
                    Select Convoy
                  </option>
                  {conveyList.length > 0 ? (
                    conveyList.map((convey) => (
                      <option key={convey.id} value={convey.id}>
                        {convey.convey_name} ({convey.convey_time})
                      </option>
                    ))
                  ) : (
                    <option disabled>No convoys available</option>
                  )}
                </select>
                <Button
                  onClick={handleStartConvoy}
                  className="ml-8 bg-blue-600 text-white hover:bg-blue-700"
                >
                  Start Convoy
                </Button>
              </>
            ) : (
              <Button
                onClick={handleStopConvey}
                className="ml-8"
                style={{ backgroundColor: "red", color: "white" }}
              >
                {" "}
                Stop Convoy{" "}
              </Button>
            )}
          </div>
        </div>

        {/* Cancel Trip Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 relative w-full max-w-md">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowCancelModal(false)}
              >
                <X size={20} />
              </button>

              <h2 className="mb-4 text-lg font-semibold text-gray-800">
                Reject Trip – Remarks
              </h2>

              <textarea
                rows={4}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-red-400"
                placeholder="Enter remarks for cancelling the trip..."
                value={cancelRemarks}
                onChange={(e) => setCancelRemarks(e.target.value)}
              />

              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                >
                  Close
                </Button>
                <Button variant="destructive" onClick={handleCancelTrip}>
                  Submit
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Modal */}
        {showScannerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 relative flex flex-col items-center">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowScannerModal(false)}
              >
                <X size={24} />
              </button>
              <h2 className="mb-4 text-lg font-semibold text-indigo-700">
                Scan QR Code
              </h2>
              <div
                id="qr-reader"
                style={{ width: "300px", height: "300px" }}
              ></div>
              <p className="mt-4 text-sm text-gray-600">
                Point your camera at a QR code to approve a trip.
              </p>
            </div>
          </div>
        )}

        {/* Trip Table */}
        <Card className="overflow-x-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">Today Trip List</span>
              <Button
                onClick={() => setShowScannerModal(true)}
                className="bg-black text-white hover:bg-gray-800 ml-4"
              >
                Scan QR
              </Button>
            </div>
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
                placeholder="Vehicle Number"
                className="w-full sm:w-64 border rounded px-3 py-1 text-sm focus:outline-none focus:ring focus:border-blue-400"
              />
            </div>

            <div className="hidden sm:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[800px] w-full text-sm text-left text-gray-700 border">
                  <thead className="bg-gray-100 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Trip Id</th>
                      <th className="px-4 py-2 border">Origin</th>
                      <th className="px-4 py-2 border">Destination</th>
                      <th className="px-4 py-2 border">Vehicle Number</th>
                      <th className="px-4 py-2 border">Date</th>
                      <th className="px-4 py-2 border">Convoy Time</th>
                      <th className="px-4 py-2 border">Total Passenger</th>
                      <th className="px-4 py-2 border">View details</th>
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
                            {row.vehicleNo}{" "}
                            {row.vehicleCategory
                              ? `(${row.vehicleCategory})`
                              : ""}
                          </td>
                          <td className="px-4 py-2 border">
                            {formatDateDDMMYY(row.date)}
                          </td>
                          <td className="px-4 py-2 border">{row.convoyTime}</td>
                          <td className="px-4 py-2 border">
                            {row.passengerCount}
                          </td>
                          <td className="px-4 py-2 border text-center">
                            <Button
                              size="sm"
                              className="bg-blue-500 text-white hover:bg-blue-600"
                              onClick={() =>
                                navigate(`/approvals/ApproveTrip/${row.t_id}`)
                              }
                            >
                              View Details
                            </Button>
                          </td>
                          <td className="px-4 py-2 border">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlesapprovetrip(row.t_id, 2)}
                                style={{
                                  backgroundColor: "#16a34a",
                                  color: "white",
                                }}
                              >
                                Approve Trip
                              </Button>
                              {/* <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancelTrip(row.t_id, 3)}
                                >
                                  Cancel Trip
                                </Button> */}

                              {/* Updated on 30th December 2025 */}

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setCancelTripInfo({
                                    tripId: row.t_id,
                                    buttonId: 3,
                                  });
                                  setCancelRemarks("");
                                  setShowCancelModal(true);
                                }}
                              >
                                Reject Trip
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
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PoliceManageTrip;
