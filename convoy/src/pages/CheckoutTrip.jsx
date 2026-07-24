import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  getCheckOutTrip,
  getStopConveyDetails,
  getCurrentDateTime1,
  getConveyDetails,
  getRunningCheckoutAPI,
} from "@/contexts/GetApi"; // ✅ use your checkout API
import { toast } from "@/hooks/use-toast";

import {
  handleStartCheckoutAPI,
  stopCheckoutConveyAPI,
  updateCheckoutTripAPI,
} from "@/contexts/PostApi"; // ✅ use your checkout update API

const CheckoutTrip = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serverDate, setServerDate] = useState(null);
  const [stoppedConveys, setStoppedConveys] = useState([]);
  const [conveyList, setConveyList] = useState([]);
  const [selectedConveyId, setSelectedConveyId] = useState("");
  const [runningConveyId, setRunningConveyId] = useState(null);
  const [runningConvey, setRunningConvey] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); // { minutes, seconds }
  const [actionAllowed, setActionAllowed] = useState(false);

  const rowsPerPage = 10;

  // ✅ Fetch checkout trips
  const fetchTrips = useCallback(async () => {
    if (accessToken) {
      const data = await getCheckOutTrip(accessToken, user.checkpostid); // pass checkpostId dynamically if needed
      console.log("Checkout Trips Data:", data);

      const tripList = Array.isArray(data?.data?.data)
        ? data.data.data.map((t) => ({
            trip_id: t.trip_id,
            origin: t.origin_name,
            destination: t.destination_name,
            vehicle_number: t.vehicle_number,
            driver_name: t.driver_name,
            date: t.date,
            convoy_time: `${t.convey_time} (${t.convey_name})`,
            arr_time: t.arr_time,
            total_passengers: t.total_passengers,
            approveby: t.approved_by,
          }))
        : [];

      setTrips(tripList);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  ////////////////close trip ////////////////
  // Fetch stopped conveys
  useEffect(() => {
    const fetchStoppedConveys = async () => {
      if (!accessToken || !user?.checkpostid || !serverDate) return;
      // 🔁 SWAP CHECKPOST ID
      const swappedCheckpostId =
        user.checkpostid === 1
          ? 2
          : user.checkpostid === 2
            ? 1
            : user.checkpostid;

      try {
        const response = await getStopConveyDetails(
          accessToken,
          swappedCheckpostId,
          serverDate,
        );

        console.log("✅ Stopped convoy response:", response);

        // ✅ response IS the array
        const stoppedList = Array.isArray(response) ? response : [];

        if (stoppedList.length === 0) {
          console.log("⚠️ No stopped convoy found");
          setStoppedConveys(null);
          return;
        }

        // ✅ find latest by closetime
        const latestStopped = [...stoppedList].sort((a, b) =>
          b.closetime.localeCompare(a.closetime),
        )[0];

        console.log("✅ Latest stopped convey:", latestStopped);
        console.log("✅ Latest convey name:", latestStopped.closetime);

        setStoppedConveys(latestStopped);
      } catch (error) {
        console.error("❌ Error fetching stopped convoy:", error);
        setStoppedConveys(null);
      }
    };

    fetchStoppedConveys();
  }, [accessToken, user?.checkpostid, serverDate]);

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        if (!accessToken) return;
        const currentTimeData = await getCurrentDateTime1(accessToken);
        if (currentTimeData) {
          setServerDate(currentTimeData.date);
        }
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };
    fetchServerTime();
  }, [accessToken]);

  useEffect(() => {
    const fetchConveys = async () => {
      if (!accessToken || !user?.checkpostid) return;

      // 🔁 Swap checkpost ID
      const swappedCheckpostId =
        user.checkpostid === 1
          ? 2
          : user.checkpostid === 2
            ? 1
            : user.checkpostid;

      try {
        const res = await getConveyDetails(accessToken, swappedCheckpostId);
        setConveyList(res?.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch convoy:", error);
        setConveyList([]);
      }
    };

    fetchConveys();
  }, [accessToken, user?.checkpostid]);
  useEffect(() => {
    const fetchConveys = async () => {
      if (!accessToken || !user?.checkpostid) return;

      // 🔁 Swap checkpost ID
      const swappedCheckpostId =
        user.checkpostid === 1
          ? 2
          : user.checkpostid === 2
            ? 1
            : user.checkpostid;

      try {
        const res = await getConveyDetails(accessToken, swappedCheckpostId);
        setConveyList(res?.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch convoy:", error);
        setConveyList([]);
      }
    };

    fetchConveys();
  }, [accessToken, user?.checkpostid]);
  useEffect(() => {
    const fetchConveys = async () => {
      if (!accessToken || !user?.checkpostid) return;

      // 🔁 Swap checkpost ID
      let swappedCheckpostId = user.checkpostid;
      if (user.checkpostid === 1) {
        swappedCheckpostId = 2;
      } else if (user.checkpostid === 2) {
        swappedCheckpostId = 1;
      }

      try {
        const res = await getConveyDetails(accessToken, swappedCheckpostId);
        setConveyList(res?.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch convoy:", error);
        setConveyList([]);
      }
    };

    fetchConveys();
  }, [accessToken, user?.checkpostid]);

  useEffect(() => {
    if (accessToken && user?.checkpostid) {
      fetchRunningCheckout();
    }
  }, [accessToken, user?.checkpostid]);

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
  const handleAction = async (status, tripId, remarks) => {
    try {
      console.log("actiondestials", { status, tripId, remarks });
      const data = await updateCheckoutTripAPI(accessToken, {
        tId: tripId,
        status,
        checkpostId: user.checkpostid,
        remarks, // ✅ include remarks in payload
        runningConveyId,
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
  //////////////////start checkout //////////////////
  const handleStartCheckout = async () => {
    if (!selectedConveyId) {
      toast({
        title: "Select Convoy",
        description: "Please select a convoy to start checkout",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        convey_id: selectedConveyId,
        checkpost_id: user.checkpostid,
      };

      console.log("▶ Start checkout payload:", payload);

      const res = await handleStartCheckoutAPI(accessToken, payload);

      if (res?.success) {
        toast({
          title: "Checkout Started",
          description: res.message || "Checkout started successfully",
        });

        // ✅ mark checkout as running
        setRunningConveyId(selectedConveyId);
        setRunningConvey(
          conveyList.find((c) => c.id === Number(selectedConveyId)) || null,
        );

        setSelectedConveyId("");
        await fetchTrips();
      } else {
        toast({
          title: "Failed",
          description: res?.message || "Unable to start checkout",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }

    useEffect(() => {
      if (accessToken) fetchRunningCheckout();
    }, [accessToken]);
  };

  /////////////////stop checkout //////////////////
  const handleStopCheckout = async () => {
    if (!runningConveyId) return;

    try {
      const payload = {
        convey_id: runningConveyId,
        checkpost_id: user.checkpostid,
      };

      console.log("⛔ Stop checkout payload:", payload);

      const res = await stopCheckoutConveyAPI(accessToken, payload);

      if (res?.success) {
        toast({
          title: "Checkout Closed",
          description: "Generating report...",
        });

        // ✅ SAVE VALUES BEFORE RESET
        const conveyId = runningConveyId;
        const checkpostId = user.checkpostid;

        // ✅ RESET STATE
        setRunningConveyId(null);
        setRunningConvey(null);

        // ✅ OPTIONAL: refresh list
        await fetchTrips();

        // 🚀 NAVIGATE TO REPORT PAGE WITH PARAMS
        navigate(`/generate-checkout-report/${conveyId}/${checkpostId}`);
      } else {
        toast({
          title: "Failed",
          description: res?.message || "Unable to stop checkout",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const fetchRunningCheckout = async () => {
    const res = await getRunningCheckoutAPI(accessToken, user.checkpostid);
    console.log("Running checkout response:", res);

    if (res?.success && res?.data) {
      setRunningConvey({
        convey_name: res.data.tconvey?.convey_name,
        convey_time: res.data.tconvey?.convey_time,
        start_time: res.data.starttime,
      });
      setRunningConveyId(res.data.conveyid);
    } else {
      setRunningConvey(null);
      setRunningConveyId(null);
    }
  };

  // useEffect(() => {
  //   if (!stoppedConveys?.closetime || !serverDate) {
  //     setTimeLeft(null);
  //     setActionAllowed(false);
  //     return;
  //   }

  //   const stopDateTime = new Date(`${serverDate}T${stoppedConveys.closetime}`);

  //   const updateTimer = () => {
  //     const now = new Date();
  //     const elapsedSeconds = Math.floor((now - stopDateTime) / 1000);
  //     const remainingSeconds = 75 * 60 - elapsedSeconds;

  //     if (remainingSeconds <= 0) {
  //       setActionAllowed(true);
  //       setTimeLeft(null);
  //     } else {
  //       setActionAllowed(false);
  //       setTimeLeft({
  //         minutes: Math.floor(remainingSeconds / 60),
  //         seconds: remainingSeconds % 60,
  //       });
  //     }
  //   };

  //   updateTimer();
  //   const interval = setInterval(updateTimer, 1000);

  //   return () => clearInterval(interval);
  // }, [stoppedConveys?.closetime, serverDate]);
  useEffect(() => {
    setActionAllowed(true);
  }, []);
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* LEFT */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Arrival Trips</h1>

            {/* ✅ RUNNING CHECKOUT STATUS (ADD HERE) */}
            {runningConvey ? (
              <p className="text-sm text-green-600 mt-1">
                <span className="font-semibold">Running Checkout:</span>{" "}
                {runningConvey.convey_name}
                <br />
                <span className="text-gray-600">
                  Scheduled: {runningConvey.convey_time}
                </span>
                <br />
                <span className="text-gray-600">
                  Started At: {runningConvey.start_time}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-500 mt-1 font-semibold">
                🚫 No running checkout
              </p>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
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
                  {conveyList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.convey_name} ({c.convey_time})
                    </option>
                  ))}
                </select>

                <Button
                  onClick={handleStartCheckout}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Start Checkout
                </Button>
              </>
            ) : (
              <Button
                onClick={handleStopCheckout}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Stop Checkout
              </Button>
            )}
          </div>
        </div>

        <Card>
          {/* {!actionAllowed && stoppedConveys && (
            <p className="text-sm text-orange-600 mt-2">
              ⏳ Actions will be enabled 1 hour 15 minutes after convoy stop
              time ({stoppedConveys.closetime})
            </p>
          )} */}
          {/* ⏳ CHECKOUT TIMER */}
          {/* {!actionAllowed && stoppedConveys && timeLeft && (
            <div className="mx-4 mt-3 px-3 py-2 text-xs bg-orange-50 border border-orange-300 rounded-md text-orange-700 flex items-center gap-2">
              ⏳ ⏳ Arrival actions will start in
              <span className="font-semibold">
                {timeLeft.minutes}m {timeLeft.seconds}s
              </span>
              <span className="text-gray-500">
                (Closed at {stoppedConveys.closetime})
              </span>
            </div>
          )} */}

          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle>Today's Arrival Trips</CardTitle>

            {stoppedConveys && (
              <div className="text-sm font-medium text-gray-700 bg-yellow-50 border border-yellow-300 px-3 py-1 rounded-md">
                <span className="font-semibold">Convoy:</span>{" "}
                <span className="font-semibold">
                  {stoppedConveys.tconvey?.convey_name}
                </span>
                {stoppedConveys.starttime && (
                  <span className="ml-2 text-gray-600">
                    (Start Time: {stoppedConveys.starttime})
                  </span>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-semibold">{filteredTrips.length}</span>{" "}
                  trip(s)
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Use the search field to quickly find a vehicle, driver, or
                  route.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search vehicle, driver or route"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-72"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {currentRows.length > 0 ? (
                <div className="space-y-4 sm:space-y-0">
                  <div className="block sm:hidden space-y-4">
                    {currentRows.map((row, i) => (
                      <div
                        key={row.trip_id}
                        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-base font-semibold text-slate-900">
                              {row.vehicle_number}
                            </div>
                            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                              #{(currentPage - 1) * rowsPerPage + i + 1}
                            </div>
                          </div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {row.total_passengers} pax
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-slate-600">
                          <div className="flex justify-between gap-2">
                            <span className="font-semibold text-slate-800">
                              Driver
                            </span>
                            <span>{row.driver_name}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="font-semibold text-slate-800">
                              Route
                            </span>
                            <span className="text-right">
                              {row.origin} → {row.destination}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="font-semibold text-slate-800">
                              Convoy
                            </span>
                            <span className="text-right">
                              {row.convoy_time}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="font-semibold text-slate-800">
                              Arrived
                            </span>
                            <span>{row.arr_time}</span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/ViewCheckoutTrip/${row.trip_id}`)
                            }
                            className="w-full"
                          >
                            View Details
                          </Button>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={!actionAllowed}
                              onClick={() =>
                                handleAction(1, row.trip_id, "Trip checked OK")
                              }
                              className="w-full"
                            >
                              Checked OK
                            </Button>
                            <Button
                              size="sm"
                              variant="warning"
                              disabled={!actionAllowed}
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
                                handleAction(2, row.trip_id, remarks);
                              }}
                              className="w-full"
                            >
                              Check Problem
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!actionAllowed}
                              onClick={() =>
                                handleAction(0, row.trip_id, "Trip not arrived")
                              }
                              className="w-full"
                            >
                              Non-arrival
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                          <tr>
                            <th className="px-5 py-3 text-left">#</th>
                            <th className="px-5 py-3 text-left">Trip ID</th>
                            <th className="px-5 py-3 text-left">Vehicle</th>
                            <th className="px-5 py-3 text-left">Driver</th>
                            <th className="px-5 py-3 text-left">Route</th>
                            <th className="px-5 py-3 text-left">Convoy</th>
                            <th className="px-5 py-3 text-left">Arrived</th>
                            <th className="px-5 py-3 text-left">Approved By</th>
                            <th className="px-5 py-3 text-left">Passengers</th>
                            <th className="px-5 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {currentRows.map((row, i) => (
                            <tr key={row.trip_id} className="hover:bg-slate-50">
                              <td className="px-5 py-4 font-medium text-slate-900">
                                {(currentPage - 1) * rowsPerPage + i + 1}
                              </td>
                              <td className="px-5 py-4 break-words max-w-[150px]">
                                {row.trip_id}
                              </td>
                              <td className="px-5 py-4">
                                {row.vehicle_number}
                              </td>
                              <td className="px-5 py-4">{row.driver_name}</td>
                              <td className="px-5 py-4 max-w-[220px] break-words">
                                {row.origin} → {row.destination}
                              </td>
                              <td className="px-5 py-4">{row.convoy_time}</td>
                              <td className="px-5 py-4">{row.arr_time}</td>
                              <td className="px-5 py-4">{row.approveby}</td>
                              <td className="px-5 py-4">
                                {row.total_passengers}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex flex-wrap gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      navigate(
                                        `/ViewCheckoutTrip/${row.trip_id}`,
                                      )
                                    }
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="success"
                                    disabled={!actionAllowed}
                                    onClick={() =>
                                      handleAction(
                                        1,
                                        row.trip_id,
                                        "Trip checked OK",
                                      )
                                    }
                                  >
                                    OK
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="warning"
                                    disabled={!actionAllowed}
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
                                      handleAction(2, row.trip_id, remarks);
                                    }}
                                  >
                                    Problem
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={!actionAllowed}
                                    onClick={() =>
                                      handleAction(
                                        0,
                                        row.trip_id,
                                        "Trip not arrived",
                                      )
                                    }
                                  >
                                    No-Show
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  {trips.length > 0
                    ? `No data found for "${searchTerm}".`
                    : "No trips found."}
                </div>
              )}
            </div>

            {filteredTrips.length > rowsPerPage && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
                <span className="text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex flex-wrap gap-2">
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

export default CheckoutTrip;
