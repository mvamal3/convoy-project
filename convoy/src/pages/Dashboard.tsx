import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getVehicleList,
  getDriverList,
  getTripList,
  getCurrentDateTime1,
} from "@/contexts/GetApi";
import {
  Car,
  Users,
  Route,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import AddVehicle from "@/components/Addvehicle";
import AddDriver from "@/components/AddDriver";
import { useNavigate } from "react-router-dom";
import AddTripComponent from "@/components/AddTripComponent";
import TripTableWithPagination from "@/components/TripTableWithPagination";
import QuickActionsCard from "@/components/QuickActionsCard";

const Dashboard = () => {
  const navigate = useNavigate();

  const { user, accessToken } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);
  //driver model
  const [showDriverModal, setShowDriverModal] = useState(false);
  const openDriverModal = () => setShowDriverModal(true);
  const closeDriverModal = () => setShowDriverModal(false);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [driverCount, setDriverCount] = useState(0);
  const [tripCount, setTripcount] = useState(0);
  const [todaysTrips, setTodaysTrips] = useState(0);
  const [upcomingTrips, setUpcomingTrips] = useState(0);
  const [tripList, setTripList] = useState([]);
  const [serverTime, setServerTime] = useState(null);

  useEffect(() => {
    const fetchVehicleCount = async () => {
      try {
        if (accessToken) {
          const res = await getVehicleList(accessToken);
          const count = Array.isArray(res?.data?.vehicle)
            ? res.data.vehicle.length
            : 0;
          setVehicleCount(count);
        }
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      }
    };

    fetchVehicleCount();
  }, [accessToken]);
  useEffect(() => {
    const fetchDriverCount = async () => {
      try {
        if (accessToken) {
          const res = await getDriverList(accessToken);
          const count = Array.isArray(res?.data?.driver)
            ? res.data.driver.length
            : 0;
          setDriverCount(count);
        }
      } catch (error) {
        console.error("Failed to fetch drivers:", error);
      }
    };

    fetchDriverCount();
  }, [accessToken]);
  useEffect(() => {
    const fetchTripCount = async () => {
      if (!accessToken || !serverTime) return;

      try {
        const res = await getTripList(accessToken);

        const trips = Array.isArray(res?.data?.trips) ? res.data.trips : [];
        //console.log("Fetched trips:", trips.length);
        setTripcount(trips.length);

        // Parse serverTime to Date object
        const serverDateObj = new Date(serverTime);
        // Format to YYYY-MM-DD (server-based date)
        const serverDateString = serverDateObj.toISOString().split("T")[0];

        // Filter trips with date >= server date (future and today)
        const filteredTrips = trips.filter(
          (trip) => trip.date >= serverDateString,
        );
        setTripList(filteredTrips);

        // Count trips for today (date === serverDateString)
        const todaysTripsCount = trips.filter(
          (trip) => trip.date === serverDateString,
        ).length;

        // Count upcoming trips (date > serverDateString)
        const upcomingTripsCount = trips.filter(
          (trip) => trip.date > serverDateString,
        ).length;

        setTodaysTrips(todaysTripsCount);
        setUpcomingTrips(upcomingTripsCount);
      } catch (error) {
        console.error("Failed to fetch trips:", error);
      }
    };
    fetchTripCount();
  }, [accessToken, serverTime]);
  // Fetch server time once on mount and when accessToken changes
  useEffect(() => {
    const fetchServerTime = async () => {
      if (!accessToken) return;
      try {
        const currentTime = await getCurrentDateTime1(accessToken);
        //console.log("Server time fetched in Dashboard:", currentTime?.time);
        setServerTime(currentTime?.date);
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };
    fetchServerTime();
  }, [accessToken]);

  const stats = {
    vehicles: vehicleCount,
    drivers: driverCount,
    trips: tripCount,
    pendingApprovals: 0,
    approvedTrips: 0,
    rejectedTrips: 0,
    todaysTrips,
    upcomingTrips,
  };
  // ... rest of your code remains unchanged
  const CitizenDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Trips */}
        {/* Today's Trips */}
        <Card
          onClick={() => navigate("/MyTrips")}
          className="h-[130px] w-full sm:w-[280px] bg-blue-50 rounded-xl shadow-md border-0 
     cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg"
        >
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800">
              My Trips
            </CardTitle>
            <Route className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {stats.trips}
            </div>
            <p className="text-xs text-blue-700">All Trips</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate("/Managevehicle")}
          className="h-[130px] bg-amber-50 rounded-xl shadow-md border-0 
             cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg"
        >
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-amber-800">
              My Vehicles
            </CardTitle>
            <Car className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {stats.vehicles}
            </div>
            <p className="text-xs text-amber-700">Registered vehicles</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate("/ManageDriver")}
          className="h-[130px] bg-violet-50 rounded-xl shadow-md border-0 
             cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg"
        >
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-violet-800">
              My Drivers
            </CardTitle>
            <Users className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-900">
              {stats.drivers}
            </div>
            <p className="text-xs text-violet-700">Registered drivers</p>
          </CardContent>
        </Card>

        {/* Add Trip Form */}
        <Card className="md:col-span-1 lg:col-span-2 bg-white rounded-xl shadow-md border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-800">
              <Users className="h-4 w-4 text-indigo-400" />
              Add Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddTripComponent />
          </CardContent>
        </Card>
        {/* Quick Actions Card */}
        <QuickActionsCard
          openModal={openModal}
          openDriverModal={openDriverModal}
        />
      </div>
      {/* Status Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Card */}
        <Card className="bg-white rounded-xl shadow border-0">
          <CardHeader>
            <CardTitle className="text-indigo-800">
              Trip Status Overview
            </CardTitle>
            <CardDescription className="text-gray-600">
              Summary of your trip applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">Approved</span>
              </div>
              <span className="text-sm font-bold text-green-900">
                {stats.approvedTrips}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-700">Pending</span>
              </div>
              <span className="text-sm font-bold text-yellow-900">
                {stats.pendingApprovals}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">Rejected</span>
              </div>
              <span className="text-sm font-bold text-red-900">
                {stats.rejectedTrips}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Second Duplicate Card */}
        <Card className="bg-white rounded-xl shadow border-0 max-w-full overflow-x-auto">
          <CardHeader>
            <CardTitle className="text-indigo-800 text-lg font-semibold">
              Upcomming Trip and Todays Trip
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TripTableWithPagination
              tripList={tripList}
              serverTime={serverTime}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );

  const PoliceDashboard = () => <>{/* */}</>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === "police"
              ? "Here's an overview of pending approvals and system activity."
              : "Here's an overview of your convoy management activities."}
          </p>
          {user?.role === "scs" && (
            <p className="text-blue-800 font-semibold mt-1">Special Convoy</p>
          )}
        </div>

        {user?.role === "police" ? <PoliceDashboard /> : <CitizenDashboard />}
      </div>
      {showModal && (
        <AddVehicle
          isOpen={showModal}
          onClose={closeModal}
          onSuccessAdd={closeModal}
        />
      )}
      {showDriverModal && (
        <AddDriver
          isOpen={showDriverModal}
          onClose={closeDriverModal}
          onSuccessAdd={closeDriverModal}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
