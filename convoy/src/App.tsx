import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute"; // ✅ imported new ProtectedRoute
import useAutoLogout from "@/hooks/useAutoLogout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ManageVehicle from "./pages/ManageVehicle";
import ManageDriver from "./pages/ManageDriver";
import ManageTrip from "./pages/ManageTrip";
import AddTrip from "./pages/AddTrip";
import ViewTripDetails from "./pages/ViewTripDetails"; // ✅ imported ViewTripDetails
import PoliceLogin from "./pages/PoliceLogin"; // ✅ imported PoliceLogin
import PoliceDashboard from "./pages/PoliceDashboard"; // ✅ imported PoliceDashboard
import PoliceManageTrip from "./pages/PoliceManageTrip"; // ✅ imported PoliceManageTrip
import ApproveTrip from "./pages/ApproveTrip"; // ✅ imported ApproveTrip
import AllTrips from "./pages/Alltrips"; // ✅ imported AllTrips
import AllApproveTrips from "./pages/AllApproveTrips"; // ✅ imported AllApproveTrips
import AllRejectedTrips from "./pages/AllRejectedTrips"; // ✅ imported AllRejectedTrips
import AllPendingTrips from "./pages/AllPendingTrips"; // ✅ imported AllPendingTrips
import ConveyWise from "./pages/ConveyWiseReport"; // ✅ imported ConveyWise
import OtpVerification from "./pages/OtpVerification"; // ✅ imported OtpVerification
import Viewtripdetailspolice from "./pages/viewtripdetailspolice"; // ✅ imported ViewTripDetails

import PoliceRegister from "@/pages/PoliceRegister";
import Qr from "@/pages/qr";
import ProfilePage from "@/pages/ProfilePage"; // ✅ imported ProfilePage
import Checkout from "@/pages/CheckoutTrip"; // ✅ imported CheckoutTrip
import TestTripForm from "@/pages/TestTripForm";
import ViewCheckoutTrip from "@/pages/ViewCheckoutTrip";
import CheckoutReport from "@/pages/ViewCheckoutReports"; // ✅ imported ViewCheckoutReports
import PoliceProfile from "@/pages/PoliceProfile"; // ✅ imported PoliceProfile
import EditTrip from "@/pages/EditTrip"; // ✅ imported EditTrip
import CitizenEditTrip from "@/pages/CitizenEditTrip"; // ✅ imported EditTrip
import MyTrips from "@/pages/MyTrips";
import TripPrintPage from "@/pages/TripPrintPage";
import ArrivalList from "@/pages/ArrivalList";
import CheckoutPrint from "@/pages/CheckoutPrint";
import VerifiedTrips from "@/pages/VerifiedTrips"; // ✅ imported VerifiedTrips
import TripReport from "@/pages/TripReport";
import ViewVerifyTrip from "@/pages/ViewVerifyTrip"; // ✅ imported ViewVerifyTrip
import GenerateReport from "@/pages/GenerateReport"; // ✅ imported GenerateReport
import ViewAllVerifiedTrips from "@/pages/ViewAllVerifiedTrips"; // ✅ imported ViewAllVerifiedTrips
import AdminLogin from "@/pages/AdminLogin"; //
import GenerateCheckoutReport from "@/pages/GenerateCheckoutReport"; //
import AdminDashboard from "@/pages/AdminDashboard"; //
import TodaysTripDetails from "@/pages/TodaysTripDetails"; //
import RegisteredPolice from "@/pages/RegisteredPolice"; //
import FreezPolice from "@/pages/FreezPolice"; //
import SearchTrip from "@/pages/SearchTrip"; //
import SpDashboard from "@/pages/SpDashboard"; //
import TodayVehicleReport from "@/pages/TodaysVehicleReport"; //
import SpecialConvoyDeparture from "@/pages/SpecialConvoyDeparture";
import Specialconvoyarrival from "@/pages/Specialconvoyarrival"; //
import SpecialConvoyApprovedTrips from "@/pages/SpecialConvoyApprovedTrips";

import GenerateReport1 from "@/pages/GenerateReport"; //

const queryClient = new QueryClient();

const AppRoutes = () => {
  //useAutoLogout();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/ManageDriver" element={<ManageDriver />} />
      <Route path="/AddTrip" element={<AddTrip />} />
      <Route path="/PoliceLogin" element={<PoliceLogin />} />
      <Route path="/AllTrips" element={<AllTrips />} />
      <Route path="/ApprovedTrips" element={<AllApproveTrips />} />
      <Route path="/RejectedTrips" element={<AllRejectedTrips />} />
      <Route path="/PendingTrips" element={<AllPendingTrips />} />
      <Route path="/ConveyWiseReport" element={<ConveyWise />} />
      <Route path="/OtpVerification" element={<OtpVerification />} />
      <Route path="/PoliceRegister" element={<PoliceRegister />} />
      <Route path="/qr" element={<Qr />} />
      <Route path="/PoliceProfile" element={<PoliceProfile />} />
      <Route path="/TestTripForm" element={<TestTripForm />} />
      <Route path="/ViewCheckoutTrip/:tripId" element={<ViewCheckoutTrip />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/EditTrip/:tripId" element={<EditTrip />} />
      <Route path="/CitizenEditTrip/:tripId" element={<CitizenEditTrip />} />
      <Route path="/MyTrips" element={<MyTrips />} />
      <Route path="/ArrivalList" element={<ArrivalList />} />
      <Route path="/ManageTrip/CheckoutPrint" element={<CheckoutPrint />} />
      <Route path="/trip-report" element={<TripReport />} />
      <Route path="/generate-report" element={<GenerateReport />} />
      <Route path="/ViewAllVerifiedTrips" element={<ViewAllVerifiedTrips />} />
      <Route path="/AdminLogin" element={<AdminLogin />} />
      <Route path="/AdminDashboard" element={<AdminDashboard />} />
      <Route path="/TodaysTripDetails" element={<TodaysTripDetails />} />
      <Route path="/RegisteredPolice" element={<RegisteredPolice />} />
      <Route path="/FreezPolice" element={<FreezPolice />} />
      <Route path="/SearchTrip" element={<SearchTrip />} />
      <Route path="/SpDashboard" element={<SpDashboard />} />
      <Route
        path="/SpecialConvoyApprovedTrips"
        element={<SpecialConvoyApprovedTrips />}
      />
      <Route
        path="/specialConvoydeparture"
        element={<SpecialConvoyDeparture />}
      />
      <Route path="/Specialconvoyarrival" element={<Specialconvoyarrival />} />
      <Route
        path="/generate-checkout-report/:conveyId/:checkpostId"
        element={<GenerateCheckoutReport />}
      />
      <Route path="/TodayVehicleReport" element={<TodayVehicleReport />} />
      <Route
        path="/ManageTrip/PoliceViewTrip/:tripId"
        element={<Viewtripdetailspolice />}
      />{" "}
      <Route
        path="/ManageTrip/ViewTrip/:tripId"
        element={<ViewTripDetails />}
      />{" "}
      {/* Protected Routes for USER */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole={["user", "scs"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/trip/print/:tripId" element={<TripPrintPage />} />
      <Route
        path="/PoliceDashboard"
        element={
          <ProtectedRoute requiredRole={["police", "scs"]}>
            <PoliceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute requiredRole="police">
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ViewCheckoutReport"
        element={
          <ProtectedRoute requiredRole="police">
            <CheckoutReport />
          </ProtectedRoute>
        }
      />
      {/* Protected Routes for USER */}
      <Route
        path="/Managevehicle"
        element={
          <ProtectedRoute requiredRole={["user", "scs"]}>
            <ManageVehicle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute requiredRole="user">
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">Vehicles Management</h1>
              <p className="text-gray-600 mt-2">
                Vehicle management functionality will be implemented here.
              </p>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <ProtectedRoute requiredRole="user">
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">Drivers Management</h1>
              <p className="text-gray-600 mt-2">
                Driver management functionality will be implemented here.
              </p>
            </div>
          </ProtectedRoute>
        }
      />
      {/* Protected Routes for USER */}
      <Route
        path="/ManageTrip"
        element={
          <ProtectedRoute requiredRole="user">
            <ManageTrip />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/new"
        element={
          <ProtectedRoute requiredRole="user">
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">Add New Trip</h1>
              <p className="text-gray-600 mt-2">
                New trip creation form will be implemented here.
              </p>
            </div>
          </ProtectedRoute>
        }
      />
      {/* Protected Routes for POLICE */}
      <Route
        path="/approvals"
        element={
          <ProtectedRoute requiredRole="police">
            <PoliceManageTrip />
          </ProtectedRoute>
        }
      />
      {/* Protected Routes for POLICE */}
      <Route
        path="/VerifiedTrips"
        element={
          <ProtectedRoute requiredRole="police">
            <VerifiedTrips />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals/ApproveTrip/:tripId"
        element={
          <ProtectedRoute requiredRole="police">
            <ApproveTrip />
          </ProtectedRoute>
        }
      />
      <Route
        path="/VerifiedTrips/VerifyTrip/:tripId"
        element={
          <ProtectedRoute requiredRole="police">
            <ViewVerifyTrip />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-trips"
        element={
          <ProtectedRoute requiredRole="police">
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">All Trips</h1>
              <p className="text-gray-600 mt-2">
                Complete trip overview for police officers will be implemented
                here.
              </p>
            </div>
          </ProtectedRoute>
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/convoy">
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
