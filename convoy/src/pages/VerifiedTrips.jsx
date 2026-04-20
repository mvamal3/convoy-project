import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDateDDMMYY } from "@/utils/dateUtils";

import {
  getPendingVerifiedTripList,
  getConveyDetails,
  getRunningConveyDetails,
} from "@/contexts/GetApi";
import {
  verfiedTrip,
  handleStartConvoyAPI,
  stopConveyAPI,
} from "@/contexts/PostApi";
import { toast } from "@/components/ui/use-toast";
import { Html5Qrcode } from "html5-qrcode";

const VerifiedTrips = () => {
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
      const data = await getPendingVerifiedTripList(
        accessToken,
        user.checkpostid
      );
      //console.log("user", user.pol_reg_id);
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
            };
          })
        : [];

      // ✅ Sort by latest entrydatetime first
      tripList.sort((a, b) => {
        const dateA = new Date(a.entrydatetime);
        const dateB = new Date(b.entrydatetime);
        return dateB - dateA; // descending order
      });

      setTrips(tripList);
    }
  }, [accessToken, user.checkpostid]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  const filteredTrips = trips.filter((t) =>
    `${t.t_id} ${t.origin} ${t.destination} ${t.driverName} ${t.vehicleNo}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredTrips.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTrips.length / rowsPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  /** ---------------- Approve Trip ------------------ */
  const handlesVeritrip = async (tripId, buttonId) => {
    try {
      const payload = {
        tId: String(tripId),
        checkpost_id: user.checkpostid,
        remarks: "All details verified and OK.",
        astatus: 1,
        buttonId: Number(buttonId),
        verifiedby: user.pol_reg_id,
      };
      //console.log("verification payloasd", payload);
      await verfiedTrip(payload, accessToken);
      toast({ title: "Trip verified successfully" });

      fetchTripList();
    } catch (error) {
      toast({
        title: "Failed to verify trip",
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
  //       checkpost_id: user.checkpostid,
  //       remarks: "Cancel via UI",
  //       astatus: 0,
  //       buttonId: Number(buttonId),
  //       verifiedby: user.pol_reg_id,
  //     };
  //     await verfiedTrip(payload, accessToken);
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
        checkpost_id: user.checkpostid,
        remarks: cancelRemarks, // ✅ user-entered remarks
        astatus: 0,
        buttonId: Number(cancelTripInfo.buttonId),
        verifiedby: user.pol_reg_id,
      };
      //console.log("cancellation payload", payload);

      await verfiedTrip(payload, accessToken);
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

  /** ---------------- QR Scanner ------------------ */
  useEffect(() => {
    if (!showScannerModal) return;

    const startScanner = async () => {
      try {
        // Create instance only once
        if (!qrScannerRef.current) {
          qrScannerRef.current = new Html5Qrcode("qr-reader");
        }

        await qrScannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            // Stop safely after scan
            if (qrScannerRef.current) {
              await qrScannerRef.current.stop();
              await qrScannerRef.current.clear();
              qrScannerRef.current = null;
            }

            setShowScannerModal(false);

            navigate(`/VerifiedTrips/VerifyTrip/${decodedText}`);
          }
        );
      } catch (err) {
        console.error("QR Scanner error:", err);
        toast({
          title: "Camera Error",
          description:
            "Unable to access camera. Please allow permission or use HTTPS.",
          variant: "destructive",
        });
        setShowScannerModal(false);
      }
    };

    startScanner();

    return () => {
      // Cleanup ONLY if scanner is running
      if (qrScannerRef.current) {
        qrScannerRef.current
          .stop()
          .then(() => qrScannerRef.current.clear())
          .catch(() => {})
          .finally(() => {
            qrScannerRef.current = null;
          });
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
          <div className="flex flex-col"></div>
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
              <span className="font-bold text-lg">
                <h1 className="text-2xl font-bold text-gray-900">
                  Verified Trip Details
                </h1>
              </span>
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
                placeholder="Vehicle Number Or Trip Id"
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
                            {" "}
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
                                navigate(
                                  `/VerifiedTrips/VerifyTrip/${row.t_id}`
                                )
                              }
                            >
                              View Details
                            </Button>
                          </td>
                          <td className="px-4 py-2 border">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlesVeritrip(row.t_id, 2)}
                                style={{
                                  backgroundColor: "#16a34a",
                                  color: "white",
                                }}
                              >
                                Details check and Verified
                              </Button>
                              {/* <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelTrip(row.t_id, 1)}
                              >
                                Cancel Trip
                              </Button> */}

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

            {/* Mobile compact list view (visible on small screens) */}
            <div className="sm:hidden">
              {currentRows.length > 0 ? (
                <div className="space-y-3">
                  {currentRows.map((row, i) => (
                    <div
                      key={row.t_id}
                      className="bg-white border rounded-lg shadow-sm p-3 flex items-start justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {row.vehicleNo}{" "}
                            {row.vehicleCategory
                              ? `(${row.vehicleCategory})`
                              : ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            #{(currentPage - 1) * rowsPerPage + i + 1}
                          </div>
                        </div>

                        <div className="mt-1 text-sm text-gray-600 truncate">
                          <div className="flex gap-2">
                            <span className="font-medium">From:</span>
                            <span className="truncate">{row.origin}</span>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <span className="font-medium">To:</span>
                            <span className="truncate">{row.destination}</span>
                          </div>
                          <div className="flex gap-2 mt-1 text-xs text-gray-500">
                            <span>{row.entrydatetime}</span>
                            <span className="mx-1">•</span>
                            <span>{row.passengerCount} pax</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-3 flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-500 text-white hover:bg-blue-600"
                          onClick={() =>
                            navigate(`/VerifiedTrips/VerifyTrip/${row.t_id}`)
                          }
                        >
                          View
                        </Button>

                        <div className="flex flex-col w-full">
                          <Button
                            size="sm"
                            onClick={() => handlesVeritrip(row.t_id, 2)}
                            style={{
                              backgroundColor: "#16a34a",
                              color: "white",
                            }}
                            className="w-full mt-1"
                          >
                            Verify
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setCancelTripInfo({
                                tripId: row.t_id,
                                buttonId: 1,
                              });
                              setCancelRemarks("");
                              setShowCancelModal(true);
                            }}
                            className="w-full mt-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6">
                  {trips.length > 0
                    ? `No data found for "${searchTerm}".`
                    : "No trips found."}
                </div>
              )}
            </div>
          </CardContent>
          {/* ✅ Pagination Controls */}
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
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VerifiedTrips;
