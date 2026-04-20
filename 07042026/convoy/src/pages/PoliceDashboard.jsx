import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import {
  getalltrips,
  gettodayconveydetails,
  getConveyDetails,
  getRunningConveyDetails,
  getStopConveyDetails,
  getApproveTripCount,
  getCurrentDateTime1,
} from "@/contexts/GetApi";
import { Users, Route, CheckCircle, Clock } from "lucide-react";

// Updated on 29th December 2025
import { getCheckpostDisplayName } from "@/utils/checkpost";

const PoliceDashboard = () => {
  const { user, accessToken } = useAuth();
  // console.log("Police Dashboard User:", user);
  const navigate = useNavigate();

  // States
  const [pendingCount, setTodayPendingCount] = useState(0);
  const [cancelCount, setTodayCancelCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [reports, setReports] = useState([]);
  const [approveCounts, setApproveCounts] = useState([]);
  const [conveyDetails, setConveyDetails] = useState([]);
  const [runningConveydetails, setRunningConvey] = useState(null);
  const [stoppedConveys, setStoppedConveys] = useState([]);
  const [totalclosedconvey, setotalclosedconvey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverTime, setServerTime] = useState(null);
  const [serverDate, setServerDate] = useState(null);

  // Fetch server time/date once
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        if (!accessToken) return;
        const currentTimeData = await getCurrentDateTime1(accessToken);
        if (currentTimeData) {
          setServerTime(currentTimeData.time);
          setServerDate(currentTimeData.date);
        }
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };
    fetchServerTime();
  }, [accessToken]);

  // Fetch total conveys
  useEffect(() => {
    const fetchConveyDetails = async () => {
      if (!accessToken || !user?.checkpostid) return;
      try {
        const res = await getConveyDetails(accessToken, user.checkpostid);
        setConveyDetails(res?.data?.data || []);
      } catch {
        setConveyDetails([]);
      }
    };
    fetchConveyDetails();
  }, [accessToken, user?.checkpostid]);

  // Fetch running convey
  useEffect(() => {
    const fetchRunningConveyDetails = async () => {
      if (!accessToken || !user?.checkpostid) return;
      try {
        const running = await getRunningConveyDetails(
          accessToken,
          user.checkpostid,
        );
        setRunningConvey(
          running && Object.keys(running).length > 0 ? running : null,
        );
      } catch (error) {
        console.error("Failed to fetch running convey details:", error);
        setRunningConvey(null);
      }
    };
    fetchRunningConveyDetails();
  }, [accessToken, user?.checkpostid]);

  // Fetch stopped conveys
  useEffect(() => {
    const fetchStoppedConveys = async () => {
      if (!accessToken || !user?.checkpostid || !serverDate) return;
      try {
        const stopped = await getStopConveyDetails(
          accessToken,
          user.checkpostid,
          serverDate,
        );
        //console.log("runing stop", stopped  );

        setStoppedConveys(stopped || []);
        setotalclosedconvey(stopped?.length || 0);
      } catch {
        setStoppedConveys([]);
        setotalclosedconvey(0);
      }
    };
    fetchStoppedConveys();
  }, [accessToken, user?.checkpostid, serverDate]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's convoy reports
  const fetchTripList = useCallback(async () => {
    if (!accessToken || !user?.checkpostid || !serverDate) return;
    try {
      const response = await gettodayconveydetails(
        accessToken,
        user.checkpostid,
        serverDate,
      );
      //console.log("Convoy Reports Response:", response);
      setReports(response?.data?.convoyReports || []);
    } catch {
      setReports([]);
    }
  }, [accessToken, user?.checkpostid, serverDate]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  // Fetch approve counts
  useEffect(() => {
    const fetchApproveCounts = async () => {
      if (!accessToken || !user?.checkpostid) return;
      try {
        const response = await getApproveTripCount(
          accessToken,
          user.checkpostid,
        );
        setApproveCounts(response?.data ?? []);
      } catch (error) {
        console.error("Error fetching approve counts:", error);
        setApproveCounts([]);
      }
    };
    fetchApproveCounts();
  }, [accessToken, user?.checkpostid]);

  // Fetch today's trips counts (based on server date)
  useEffect(() => {
    const fetchTripCount = async () => {
      if (!accessToken || !user?.checkpostid || !serverDate) return;
      try {
        const data = await getalltrips(accessToken, user.checkpostid);
        console.log("All Trips Data:", data);
        const trips = Array.isArray(data?.data?.trips) ? data.data.trips : [];
        //console.log("Fetched Trips:", trips);

        setTodayPendingCount(
          trips.filter(
            (t) =>
              t.status === "1" &&
              t.date === serverDate &&
              (t.verifiystatus === 0 || t.verifiystatus === 2),
          ).length,
        );
        setTodayCancelCount(
          trips.filter(
            (t) =>
              (t.status === "3" || t.verifiystatus === 3) &&
              t.date === serverDate,
          ).length,
        );
        setApprovedCount(
          trips.filter((t) => t.status === "2" && t.date === serverDate).length,
        );
      } catch {
        setTodayPendingCount(0);
        setTodayCancelCount(0);
        setApprovedCount(0);
      }
    };
    fetchTripCount();
  }, [accessToken, user?.checkpostid, serverDate]);

  // Filter upcoming conveys
  const upcomingConveys = React.useMemo(() => {
    if (!conveyDetails?.length) return [];
    const runningId = runningConveydetails?.tconvey?.id;
    const stoppedIds = stoppedConveys?.map((c) => c.tconvey?.id) || [];
    return conveyDetails.filter(
      (c) => c.id !== runningId && !stoppedIds.includes(c.id),
    );
  }, [conveyDetails, runningConveydetails, stoppedConveys]);

  // Find next convey
  const nextUpcomingConvey = React.useMemo(() => {
    if (!conveyDetails.length) return null;

    const sortedConveys = [...conveyDetails].sort((a, b) => {
      const [h1, m1, s1] = a.convey_time.split(":").map(Number);
      const [h2, m2, s2] = b.convey_time.split(":").map(Number);
      return h1 - h2 || m1 - m2 || s1 - s2;
    });

    const closedConveyIds = stoppedConveys.map((c) => c.tconvey?.id);
    const runningConveyId = runningConveydetails?.tconvey?.id;
    const processedIds = new Set([...closedConveyIds]);
    if (runningConveyId) processedIds.add(runningConveyId);

    let maxProcessedIndex = -1;
    sortedConveys.forEach((c, idx) => {
      if (processedIds.has(c.id)) {
        if (idx > maxProcessedIndex) maxProcessedIndex = idx;
      }
    });

    const upcomingIndex = maxProcessedIndex + 1;
    return upcomingIndex < sortedConveys.length
      ? sortedConveys[upcomingIndex]
      : null;
  }, [conveyDetails, stoppedConveys, runningConveydetails]);

  // Police Cards UI component
  const PoliceCards = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Convey Status Card */}
        <Card className="border-2 border-indigo-400 bg-gradient-to-tr from-indigo-50 to-indigo-100 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-indigo-900 flex items-center">
              Convey Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-indigo-800">
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">Current Time</span>
              <span className="text-2xl font-extrabold tabular-nums">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">Running Convey</span>
              {runningConveydetails?.tconvey ? (
                <span className="text-lg font-semibold truncate max-w-[60%] text-yellow-500">
                  {runningConveydetails.tconvey.convey_name} (
                  {runningConveydetails.tconvey.convey_time})
                </span>
              ) : (
                <span className="text-lg font-semibold truncate max-w-[60%]">
                  No running Convey
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">Upcoming Convey</span>
              <span className="text-lg font-semibold truncate max-w-[60%]">
                {nextUpcomingConvey
                  ? `${nextUpcomingConvey.convey_name} (${nextUpcomingConvey.convey_time})`
                  : "No upcoming conveys"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">
                Total Closed Conveys
              </span>
              <span className="text-lg font-semibold">{totalclosedconvey}</span>
            </div>
          </CardContent>
        </Card>

        {/* Convey Requests Card */}
        <Card className="border-2 border-purple-400 bg-gradient-to-tr from-purple-50 to-purple-100 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 overflow-auto">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-purple-900 truncate">
              Total Convey Requests/Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-purple-800 max-h-[320px] overflow-y-auto">
            {conveyDetails && conveyDetails.length > 0 ? (
              conveyDetails.map((convey) => {
                const runningId = runningConveydetails?.tconvey?.id;
                const stoppedIds =
                  stoppedConveys?.map((c) => c.tconvey?.id) || [];

                let status = "upcoming";
                if (convey.id === runningId) status = "running";
                else if (stoppedIds.includes(convey.id)) status = "completed";

                let textColor;
                switch (status) {
                  case "running":
                    textColor = "text-yellow-500";
                    break;
                  case "completed":
                    textColor = "text-green-600";
                    break;
                  default:
                    textColor = "text-blue-600";
                }

                // Find requestCount report
                const report = reports.find(
                  (r) => Number(r.convoyTime) === Number(convey.id),
                );

                // Find approveCount report

                const approve = approveCounts.find(
                  (a) => Number(a.conveyId) === Number(convey.id),
                );
                // console.log(
                //   "Matching Convey",
                //   convey.id,
                //   "with Approve Count:",
                //   approveCounts
                // );
                return (
                  <div
                    key={convey.id}
                    className="flex justify-between items-center border-b border-purple-300 py-1 text-sm"
                  >
                    <span
                      className={`flex items-center gap-2 font-medium ${textColor} truncate max-w-[60%]`}
                    >
                      <span>{convey.convey_name}</span>
                      <span className={`text-xs ${textColor}`}>
                        {convey.convey_time}
                      </span>
                    </span>
                    <span className={`font-medium ${textColor} tabular-nums`}>
                      {`${report?.requestCount ?? 0}/${
                        approve?.approvedCount ?? 0
                      }`}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-purple-500 italic text-center">
                No convey data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Trip Stats */}
      <p className="text-gray-700 mt-6 mb-4 font-semibold text-lg">
        Today's Trip Statistics
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
        {/* Approvals Pending Today */}
        <Card
          onClick={() => navigate(`/PendingTrips?date=${serverDate}`)}
          className="border-4 border-orange-600 bg-orange-100 rounded-lg hover:shadow-xl transition-shadow cursor-pointer p-4 sm:p-6 flex flex-col justify-between"
        >
          <CardHeader className="flex justify-between items-center mb-3">
            <CardTitle className="text-sm font-bold text-orange-700 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" /> Approvals Pending
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-orange-700 tabular-nums">
              {pendingCount}
            </div>
            <p className="text-xs text-orange-600 mt-1">Require your review</p>
          </CardContent>
        </Card>

        {/* Trip Approved Today */}
        <Card
          onClick={() => navigate(`/ApprovedTrips?date=${serverDate}`)}
          className="border-4 border-green-600 bg-green-100 rounded-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer p-4 sm:p-6 flex flex-col justify-between"
        >
          <CardHeader className="flex justify-between items-center mb-3">
            <CardTitle className="text-sm font-bold text-green-700 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" /> Trip Approved
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-green-700 tabular-nums">
              {approvedCount}
            </div>
            <p className="text-xs text-green-600 mt-1">Trips approved today</p>
          </CardContent>
        </Card>

        {/* Trip Cancelled Today */}
        <Card
          onClick={() => navigate(`/RejectedTrips?date=${serverDate}`)}
          className="border-4 border-red-600 bg-red-100 rounded-lg hover:shadow-xl transition-shadow cursor-pointer p-4 sm:p-6 flex flex-col justify-between"
        >
          <CardHeader className="flex justify-between items-center mb-3">
            <CardTitle className="text-sm font-bold text-red-700 flex items-center gap-2">
              <Route className="h-5 w-5 text-red-600" /> Trip Rejected Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-red-700 tabular-nums">
              {cancelCount}
            </div>
            <p className="text-xs text-red-600 mt-1">Rejected today</p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="border-4 border-blue-600 bg-blue-100 rounded-lg hover:shadow-xl transition-shadow cursor-default p-4 sm:p-6 flex flex-col justify-between">
          <CardHeader className="flex justify-between items-center mb-3">
            <CardTitle className="text-sm font-bold text-blue-700 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-700 tabular-nums">
              0
            </div>
            <p className="text-xs text-blue-600 mt-1">Registered citizens</p>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 px-4 sm:px-8 lg:px-12 pb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {user?.role === "police"
              ? `Welcome to ${getCheckpostDisplayName(user)} Checkpost`
              : "Welcome"}
          </h1>
        </div>

        {user?.role === "police" && <PoliceCards />}
      </div>
    </DashboardLayout>
  );
};

export default PoliceDashboard;
