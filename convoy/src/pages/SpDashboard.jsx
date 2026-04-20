import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getSpReport, getSpTripDetails } from "@/contexts/GetApi";
import {
  Route,
  Car,
  Users,
  XCircle,
  AlertTriangle,
  Truck,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Shield,
  TrendingUp,
  BarChart3,
  Filter,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 🔹 Enhanced Stat Card with gradient and animations
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  bgColor = "bg-white",
  onClick,
}) => (
  <Card
    onClick={onClick}
    className={`cursor-pointer relative overflow-hidden ${bgColor}
      shadow-md hover:shadow-xl transition-all duration-300
      hover:-translate-y-1 border-0 group`}
  >
    {/* Gradient accent */}
    <div
      className={`absolute top-0 left-0 w-1 h-full ${color.replace("border-", "bg-")}`}
    ></div>

    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${color.replace("border-", "bg-")} bg-opacity-10`}
          >
            <Icon className="h-4 w-4" />
          </div>
          {title}
        </CardTitle>
        {trend && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-1xl md:text-5xl font-bold text-gray-900">
        {value}
      </div>
      {subtitle && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">{subtitle}</p>
          <div className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

// 🔹 Date Navigation Component
const DateNavigator = ({ selectedDate, onChange, onPrevious, onNext }) => (
  <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
    <button
      onClick={onPrevious}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
    >
      <ChevronLeft size={18} />
      <span className="hidden sm:inline">Previous</span>
    </button>

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border shadow-sm">
        <Calendar className="text-blue-600" size={20} />
        <input
          type="date"
          value={selectedDate}
          max={new Date().toISOString().split("T")[0]} // ✅ BLOCK FUTURE
          onChange={onChange}
          className="bg-transparent border-none focus:outline-none text-gray-700 font-medium"
        />
      </div>
    </div>

    <button
      onClick={onNext}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
    >
      <span className="hidden sm:inline">Next</span>
      <ChevronRight size={18} />
    </button>
  </div>
);
const formatDDMMYYYY = (dateStr) => {
  if (!dateStr) return "-";
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${dd}-${mm}-${yyyy}`;
};

// 🔹 Checkpost Header
const CheckpostHeader = ({ name, id, totalConvoys, date }) => (
  <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-xl p-6 shadow-lg">
    <div className="flex flex-col md:flex-row md:items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500 rounded-xl">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-0">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-300">Active Convoys</p>
            <p className="text-3xl font-bold">{totalConvoys}</p>
          </div>
          <div className="h-12 w-px bg-gray-700 hidden md:block"></div>
          <div className="text-center">
            <p className="text-sm text-gray-300">Report Date</p>
            <p className="text-lg font-semibold">{formatDDMMYYYY(date)}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SPDashboard = () => {
  const { user, accessToken } = useAuth();
  console.log("SP Dashboard User:", user);
  const today = new Date().toISOString().split("T")[0];

  const [checkpostReports, setCheckpostReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [rejectedModalOpen, setRejectedModalOpen] = useState(false);
  const [rejectedTrips, setRejectedTrips] = useState([]);
  const [rejectedLoading, setRejectedLoading] = useState(false);

  /////Non arrival
  const [nonArrivalModalOpen, setNonArrivalModalOpen] = useState(false);
  const [nonArrivalTrips, setNonArrivalTrips] = useState([]);
  const [nonArrivalLoading, setNonArrivalLoading] = useState(false);

  ///issue occure
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueTrips, setIssueTrips] = useState([]);
  const [issueLoading, setIssueLoading] = useState(false);

  // Arrival
  const [arrivalModalOpen, setArrivalModalOpen] = useState(false);
  const [arrivalTrips, setArrivalTrips] = useState([]);
  const [arrivalLoading, setArrivalLoading] = useState(false);

  // Departure
  const [departureModalOpen, setDepartureModalOpen] = useState(false);
  const [departureTrips, setDepartureTrips] = useState([]);
  const [departureLoading, setDepartureLoading] = useState(false);

  // Total Convoys
  const [totalConvoyModalOpen, setTotalConvoyModalOpen] = useState(false);
  const [totalConvoyTrips, setTotalConvoyTrips] = useState([]);
  const [totalConvoyLoading, setTotalConvoyLoading] = useState(false);

  // 📅 Date filter state
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  useEffect(() => {
    if (!accessToken || !selectedDate) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await getSpReport(accessToken, { date: selectedDate });
        console.log("SP Report Response:", res);

        if (res?.success && res?.data?.checkposts) {
          const mappedData = res.data.checkposts.map((cp) => ({
            checkpostId: cp.checkpostId,
            checkpostName: cp.checkpostName,
            report: {
              totalConvoys: cp.totalClosedConvoys,
              departureTrips: cp.totalApprovedConvoys, // ✅ Departure
              arrivalTrips:
                cp.totalArrivaltripsjirkatang ??
                cp.totalArrivaltripsmiddleStrait ??
                0,
              totalPassengers: cp.totalApprovedPassengers,
              rejectedTrips: cp.totalRejectedTrips,
              nonArrivalVehicles: cp.totalNonArrivalVehicles,
              issueTrips: cp.totalCheckProblem,
              totalArrivalPassengers: cp.totalArrivalPassengers,
            },
          }));
          console.log("Mapped Checkpost Reports:", mappedData);
          setCheckpostReports(mappedData);
        }
      } catch (err) {
        console.error("SP Report error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [accessToken, selectedDate]);

  // 🔹 Enhanced dummy data with trends
  const openRejectedModal = async (checkpostId) => {
    setRejectedModalOpen(true);
    setRejectedLoading(true);

    try {
      const res = await getSpTripDetails(accessToken, {
        type: "REJECTED",
        checkpostId,
        date: selectedDate,
      });
      console.log("Rejected Trips Response:", res);
      if (res?.success) {
        setRejectedTrips(res.data);
      }
    } catch (err) {
      console.error("Rejected trip fetch error:", err);
    } finally {
      setRejectedLoading(false);
    }
  };

  const openNonArrivalModal = async (checkpostId) => {
    setNonArrivalModalOpen(true);
    setNonArrivalLoading(true);

    try {
      const res = await getSpTripDetails(accessToken, {
        type: "NON_ARRIVAL",
        checkpostId,
        date: selectedDate,
      });

      if (res?.success) {
        setNonArrivalTrips(res.data);
      }
    } catch (err) {
      console.error("Non-arrival trip fetch error:", err);
    } finally {
      setNonArrivalLoading(false);
    }
  };

  //issue occure
  const openIssueModal = async (checkpostId) => {
    setIssueModalOpen(true);
    setIssueLoading(true);

    try {
      const res = await getSpTripDetails(accessToken, {
        type: "ISSUE",
        checkpostId,
        date: selectedDate,
      });

      if (res?.success) {
        setIssueTrips(res.data);
      }
    } catch (err) {
      console.error("Issue trip fetch error:", err);
    } finally {
      setIssueLoading(false);
    }
  };

  const openDepartureModal = async (checkpostId) => {
    setDepartureModalOpen(true);
    setDepartureLoading(true);

    try {
      const res = await getSpTripDetails(accessToken, {
        type: "DEPARTURE",
        checkpostId,
        date: selectedDate,
      });

      if (res?.success) {
        setDepartureTrips(res.data);
      }
    } catch (err) {
      console.error("Departure trip fetch error:", err);
    } finally {
      setDepartureLoading(false);
    }
  };

  //Arrival
  const openArrivalModal = async (checkpostId) => {
    setArrivalModalOpen(true);
    setArrivalLoading(true);

    try {
      const res = await getSpTripDetails(accessToken, {
        type: "ARRIVAL",
        checkpostId,
        date: selectedDate,
      });

      if (res?.success) {
        setArrivalTrips(res.data);
      }
    } catch (err) {
      console.error("Arrival trip fetch error:", err);
    } finally {
      setArrivalLoading(false);
    }
  };

  const openTotalConvoyModal = async (checkpostId) => {
    setTotalConvoyModalOpen(true);
    setTotalConvoyLoading(true);

    try {
      const res = await getSpTripDetails(accessToken, {
        type: "TOTAL_CONVOY",
        checkpostId,
        date: selectedDate,
      });

      if (res?.success) {
        setTotalConvoyTrips(res.data);
      }
    } catch (err) {
      console.error("Total convoy fetch error:", err);
    } finally {
      setTotalConvoyLoading(false);
    }
  };

  // 🔁 Date helpers
  const changeDateBy = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome {user?.name || "SP Officer"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Superintendent of Police South Andaman – Checkpost-wise
                    Overview
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3"> </div>
          </div>
        </div>

        {/* 📅 Enhanced Date Filter Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">
              Daily Operations Report
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Real-time Data
            </span>
          </div>

          <DateNavigator
            selectedDate={selectedDate}
            onChange={(e) => {
              if (e.target.value <= today) {
                setSelectedDate(e.target.value);
              }
            }}
            onPrevious={() => changeDateBy(-1)}
            onNext={() => {
              if (selectedDate < today) {
                changeDateBy(1);
              }
            }}
          />

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Showing comprehensive report for:{" "}
              <span className="font-semibold text-gray-900">
                {formatDate(selectedDate)}
              </span>
            </p>
          </div>
        </div>

        {/* 🔹 Enhanced Checkpost-wise Sections */}
        {checkpostReports.map((cp) => (
          <div key={cp.checkpostId} className="space-y-6">
            <CheckpostHeader
              name={cp.checkpostName}
              id={cp.checkpostId}
              totalConvoys={cp.report.totalConvoys}
              date={selectedDate}
            />

            {/* First Row: 3 Cards - Total Convoy, Total Trips, Total Passengers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Total Convoys */}
              <StatCard
                title="Total Convoys"
                value={cp.report.totalConvoys}
                icon={Route}
                color="bg-blue-500"
                bgColor="bg-gradient-to-br from-blue-50 to-white"
                onClick={() => openTotalConvoyModal(cp.checkpostId)}
              />

              <StatCard
                title="Total Vehicle"
                icon={Car}
                color="bg-blue-500"
                bgColor="bg-gradient-to-br from-blue-50 to-white"
                value={
                  <div className="grid grid-cols-2 divide-x divide-gray-300 mt-1">
                    {/* 🚍 Departure */}
                    <div
                      className="text-center px-2 cursor-pointer hover:bg-indigo-50 rounded-md py-1 transition"
                      onClick={(e) => {
                        e.stopPropagation(); // ⛔ prevent parent click
                        openDepartureModal(cp.checkpostId);
                      }}
                    >
                      <div className="text-xl font-bold text-gray-900">
                        {cp.report.departureTrips}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Departure</p>
                    </div>

                    {/* 🛬 Arrival */}
                    <div
                      className="text-center px-2 cursor-pointer hover:bg-green-50 rounded-md py-1 transition"
                      onClick={(e) => {
                        e.stopPropagation(); // ⛔ prevent parent click
                        openArrivalModal(cp.checkpostId);
                      }}
                    >
                      <div className="text-xl font-bold text-gray-900">
                        {cp.report.arrivalTrips}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Arrival</p>
                    </div>
                  </div>
                }
              />

              {/* 👥 Total Passengers */}
              <StatCard
                title="Total Passengers"
                icon={Users}
                color="bg-blue-500"
                bgColor="bg-gradient-to-br from-blue-50 to-white"
                value={
                  <div className="grid grid-cols-2 divide-x divide-gray-300 mt-1">
                    {/* 🚶 Departure */}
                    <div className="text-center px-2 py-1">
                      <div className="text-xl font-bold text-gray-900">
                        {cp.report.totalPassengers.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Departed Passenger
                      </p>
                    </div>

                    {/* 🛬 Arrival */}
                    <div className="text-center px-2 py-1">
                      <div className="text-xl font-bold text-gray-900">
                        {cp.report.totalArrivalPassengers.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Arrived Passengers
                      </p>
                    </div>
                  </div>
                }
              />
            </div>

            {/* Second Row: 3 Cards - Total Rejected, Non Arrival, Issues */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard
                title="Total Rejected"
                value={cp.report.rejectedTrips}
                icon={XCircle}
                color="bg-red-500"
                bgColor="bg-gradient-to-br from-red-50 to-white"
                onClick={() => openRejectedModal(cp.checkpostId)}
              />

              <StatCard
                title="Non Arrival"
                value={cp.report.nonArrivalVehicles}
                icon={Truck}
                color="bg-red-500"
                bgColor="bg-gradient-to-br from-red-50 to-white"
                onClick={() => openNonArrivalModal(cp.checkpostId)}
              />

              <StatCard
                title="Issues Occurred"
                value={cp.report.issueTrips}
                icon={AlertTriangle}
                color="bg-orange-500"
                bgColor="bg-gradient-to-br from-orange-50 to-white"
                onClick={() => openIssueModal(cp.checkpostId)}
              />
            </div>

            {/* Separator with custom style */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  • • •
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Footer Stats */}
        {/* <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Checkposts</p>
              <p className="text-3xl font-bold text-gray-900">
                {checkpostReports.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">
                Total Passengers Today
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {checkpostReports
                  .reduce((sum, cp) => sum + cp.report.totalPassengers, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Issues</p>
              <p className="text-3xl font-bold text-gray-900">
                {checkpostReports.reduce(
                  (sum, cp) =>
                    sum + cp.report.issueTrips + cp.report.rejectedTrips,
                  0,
                )}
              </p>
            </div>
          </div>
        </div> */}
      </div>
      <Dialog open={rejectedModalOpen} onOpenChange={setRejectedModalOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Rejected Vehicle</DialogTitle>
          </DialogHeader>

          {rejectedLoading ? (
            <p>Loading rejected trips...</p>
          ) : rejectedTrips.length === 0 ? (
            <p>No rejected trips found</p>
          ) : (
            <table className="w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-center w-[8%]">S.No</th>
                  <th className="border px-4 py-2 text-left w-[20%]">
                    Trip ID
                  </th>
                  <th className="border px-4 py-2 text-left w-[25%]">
                    Vehicle
                  </th>
                  <th className="border px-4 py-2 text-left w-[35%]">Driver</th>
                  <th className="border px-4 py-2 text-center w-[20%]">
                    Remarks
                  </th>
                  <th className="border px-4 py-2 text-center w-[20%]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {rejectedTrips.map((row, index) => (
                  <tr key={row.tId} className="hover:bg-gray-50">
                    <td className="border px-3 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border px-4 py-2">{row.tId}</td>

                    <td className="border px-4 py-2 whitespace-nowrap truncate">
                      {row.vehicle
                        ? `${row.vehicle.vNum} (${row.vehicle.Vcat})`
                        : "-"}
                    </td>

                    <td className="border px-4 py-2">
                      {row.driver
                        ? `${row.driver.dFirstName} ${row.driver.dLastName}`
                        : "-"}
                    </td>

                    <td className="border px-4 py-2">
                      {row.approveDetails
                        ? `${row.approveDetails.remarks}`
                        : "-"}
                    </td>

                    <td className="border px-4 py-2 text-center text-red-600 font-semibold">
                      Rejected
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={nonArrivalModalOpen} onOpenChange={setNonArrivalModalOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Non Arrival Vehicle</DialogTitle>
          </DialogHeader>

          {nonArrivalLoading ? (
            <p>Loading non-arrival trips...</p>
          ) : nonArrivalTrips.length === 0 ? (
            <p>No non-arrival trips found</p>
          ) : (
            <table className="w-full border border-gray-300 text-sm table-fixed">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-center w-[8%]">S.No</th>
                  <th className="border px-4 py-2 text-left w-[20%]">
                    Trip ID
                  </th>
                  <th className="border px-4 py-2 text-left w-[25%]">
                    Vehicle
                  </th>
                  <th className="border px-4 py-2 text-left w-[35%]">Driver</th>
                  <th className="border px-4 py-2 text-center w-[20%]">
                    Status
                  </th>
                  <th className="border px-4 py-2 text-center w-[20%]">
                    Remakrs
                  </th>
                </tr>
              </thead>

              <tbody>
                {nonArrivalTrips.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-gray-50">
                    {/* S.No */}
                    <td className="border px-3 py-2 text-center">
                      {index + 1}
                    </td>

                    {/* Trip ID */}
                    <td className="border px-4 py-2">{row.trip?.tId ?? "-"}</td>

                    {/* Vehicle Number */}
                    <td className="border px-4 py-2">
                      {row.trip?.vehicle?.vNum ?? "-"}
                    </td>

                    {/* Driver Name */}
                    <td className="border px-4 py-2">
                      {row.trip?.driver
                        ? `${row.trip.driver.dFirstName} ${row.trip.driver.dLastName}`
                        : "-"}
                    </td>

                    {/* Status */}
                    <td className="border px-4 py-2 text-center text-red-600 font-semibold">
                      Vehicle Non Arrive
                    </td>

                    {/* Remarks */}
                    <td className="border px-4 py-2">{row.remarks ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Issue Trips</DialogTitle>
          </DialogHeader>

          {issueLoading ? (
            <p>Loading issue trips...</p>
          ) : issueTrips.length === 0 ? (
            <p>No issue trips found</p>
          ) : (
            <table className="w-full border border-gray-300 text-sm table-fixed">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-center w-[8%]">S.No</th>
                  <th className="border px-4 py-2 text-left w-[18%]">
                    Trip ID
                  </th>
                  <th className="border px-4 py-2 text-left w-[22%]">
                    Vehicle
                  </th>
                  <th className="border px-4 py-2 text-left w-[28%]">Driver</th>
                  <th className="border px-4 py-2 text-center w-[14%]">
                    Status
                  </th>
                  <th className="border px-4 py-2 text-left w-[20%]">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody>
                {issueTrips.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-gray-50">
                    <td className="border px-3 py-2 text-center">
                      {index + 1}
                    </td>

                    <td className="border px-4 py-2 whitespace-nowrap truncate">
                      {row.trip?.tId ?? "-"}
                    </td>

                    <td className="border px-4 py-2 whitespace-nowrap truncate">
                      {row.trip?.vehicle
                        ? `${row.trip.vehicle.vNum} (${row.trip.vehicle.vCat})`
                        : "-"}
                    </td>

                    <td className="border px-4 py-2 whitespace-nowrap truncate">
                      {row.trip?.driver
                        ? `${row.trip.driver.dFirstName} ${row.trip.driver.dLastName}`
                        : "-"}
                    </td>

                    <td className="border px-4 py-2 text-center">
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                        Issue
                      </span>
                    </td>

                    <td className="border px-4 py-2 whitespace-nowrap truncate">
                      {row.remarks ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={arrivalModalOpen} onOpenChange={setArrivalModalOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Arrival Trips</DialogTitle>
          </DialogHeader>

          {arrivalLoading ? (
            <p>Loading arrival trips...</p>
          ) : arrivalTrips.length === 0 ? (
            <p>No arrival trips found</p>
          ) : (
            <table className="w-full border border-gray-300 text-sm table-fixed">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-center w-[8%]">S.No</th>
                  <th className="border px-4 py-2 text-left w-[18%]">
                    Trip ID
                  </th>
                  <th className="border px-4 py-2 text-left w-[22%]">
                    Vehicle
                  </th>
                  <th className="border px-4 py-2 text-left w-[28%]">Driver</th>
                  <th className="border px-4 py-2 text-center w-[14%]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {arrivalTrips.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-gray-50">
                    {/* S.No */}
                    <td className="border px-3 py-2 text-center">
                      {index + 1}
                    </td>

                    {/* Trip ID */}
                    <td className="border px-4 py-2">{row.trip?.tId ?? "-"}</td>

                    {/* Vehicle */}
                    <td className="border px-4 py-2 whitespace-nowrap truncate">
                      {row.trip?.vehicle
                        ? `${row.trip.vehicle.vNum} (${row.trip.vehicle.vCat})`
                        : "-"}
                    </td>

                    {/* Driver */}
                    <td className="border px-4 py-2 whitespace-nowrap truncate">
                      {row.trip?.driver
                        ? `${row.trip.driver.dFirstName} ${row.trip.driver.dLastName}`
                        : "-"}
                    </td>

                    {/* Status */}
                    <td className="border px-4 py-2 text-center text-green-600 font-semibold">
                      Arrived
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={departureModalOpen} onOpenChange={setDepartureModalOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Departure Vehicle</DialogTitle>
          </DialogHeader>

          {departureLoading ? (
            <p>Loading departure trips...</p>
          ) : departureTrips.length === 0 ? (
            <p>No departure trips found</p>
          ) : (
            <table className="w-full border border-gray-300 text-sm table-fixed">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-center w-[8%]">S.No</th>
                  <th className="border px-4 py-2 text-left w-[18%]">
                    Trip ID
                  </th>
                  <th className="border px-4 py-2 text-left w-[22%]">
                    Vehicle
                  </th>
                  <th className="border px-4 py-2 text-left w-[28%]">Driver</th>
                  <th className="border px-4 py-2 text-center w-[14%]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {departureTrips.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-gray-50">
                    {/* S.No */}
                    <td className="border px-3 py-2 text-center">
                      {index + 1}
                    </td>

                    {/* Trip ID */}
                    <td className="border px-4 py-2">{row.trip?.tId ?? "-"}</td>

                    {/* Vehicle */}
                    <td className="border px-4 py-2 whitespace-nowrap truncate">
                      {row.trip?.vehicle
                        ? `${row.trip.vehicle.vNum} (${row.trip.vehicle.vCat})`
                        : "-"}
                    </td>

                    {/* Driver */}
                    <td className="border px-4 py-2 whitespace-nowrap truncate">
                      {row.trip?.driver
                        ? `${row.trip.driver.dFirstName} ${row.trip.driver.dLastName}`
                        : "-"}
                    </td>

                    {/* Status */}
                    <td className="border px-4 py-2 text-center text-blue-600 font-semibold">
                      Departed
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={totalConvoyModalOpen}
        onOpenChange={setTotalConvoyModalOpen}
      >
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Total Convoys</DialogTitle>
          </DialogHeader>

          {totalConvoyLoading ? (
            <p>Loading convoys...</p>
          ) : totalConvoyTrips.length === 0 ? (
            <p>No convoys found</p>
          ) : (
            <table className="w-full border border-gray-300 text-sm table-fixed">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-center w-[8%]">S.No</th>

                  <th className="border px-4 py-2 w-[22%]">Convoy Name</th>

                  <th className="border px-4 py-2 text-center w-[15%]">
                    Est. Time
                  </th>

                  <th className="border px-4 py-2 text-center w-[18%]">
                    Start Time
                  </th>

                  <th className="border px-4 py-2 text-center w-[18%]">
                    Close Time
                  </th>

                  <th className="border px-4 py-2 text-center w-[19%]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {totalConvoyTrips.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {/* S.No */}
                    <td className="border px-3 py-2 text-center">
                      {index + 1}
                    </td>

                    {/* Convoy Name */}
                    <td className="border px-4 py-2 whitespace-nowrap">
                      {row.tconvey?.convey_name ?? "-"}
                    </td>

                    {/* Estimated Convoy Time */}
                    <td className="border px-4 py-2 text-center">
                      {row.tconvey?.convey_time ?? "-"}
                    </td>

                    {/* Start Time */}
                    <td className="border px-4 py-2 text-center">
                      {row.starttime}
                    </td>

                    {/* Close Time */}
                    <td className="border px-4 py-2 text-center">
                      {row.closetime}
                    </td>

                    {/* Status */}
                    <td className="border px-4 py-2 text-center">
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                        Closed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SPDashboard;
