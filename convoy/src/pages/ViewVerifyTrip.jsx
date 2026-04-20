import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { verfiedTrip } from "@/contexts/PostApi";
import TripOverviewCard from "@/components/TripOverviewCard";

import {
  ArrowLeft,
  CheckCircle,
  Users,
  MapPin,
  UserCircle,
  Phone,
  IdCard,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// For Rejecte Trip Remarks Popup
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between px-5 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-default">
    <span className="text-gray-600 font-semibold">{label}</span>
    <span className="text-gray-900 font-bold text-right">{value}</span>
  </div>
);

const PassengerCard = ({ passenger }) => (
  <div className="border rounded-xl p-5 bg-indigo-50 shadow-sm hover:shadow-lg transition-all duration-300">
    <div className="flex items-center gap-3 mb-3">
      <UserCircle className="w-7 h-7 text-indigo-600" />
      <p className="font-bold text-indigo-900">{passenger.passengerName}</p>
    </div>
    <div className="flex items-center gap-3 text-sm text-indigo-800 mb-2">
      <Phone className="w-5 h-5 text-indigo-600" />
      <span>{passenger.phoneNo}</span>
    </div>
    <div className="flex items-center gap-3 text-sm text-indigo-800">
      <IdCard className="w-5 h-5 text-indigo-600" />
      <span>
        {passenger.docType} / {passenger.docId}
      </span>
    </div>
  </div>
);

const ViewVerifyTrip = () => {
  const { user, accessToken } = useAuth();

  const navigate = useNavigate();
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  //const accessToken = localStorage.getItem("accessToken");
  //For Reject Trip Remarks Popup
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const BASE_URL = `${API_BASE_URL}/api/auth`;
  //console.log("baseurl", BASE_URL);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const res = await fetch(`${BASE_URL}/get-trip-details-by-tId`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ tId: tripId }),
        });

        const data = await res.json();
        console.log("trip details", data);
        setTrip(data?.data?.trips || null);
      } catch (error) {
        console.error("Error fetching trip details:", error);
        setTrip(null);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && tripId) {
      fetchTripDetails();
    }
  }, [tripId, accessToken]);

  useEffect(() => {
    const closeSidebarOnMobile = () => {
      if (window.innerWidth < 768) {
        const checkbox = document.querySelector("#sidebar-toggle");
        if (checkbox && checkbox.checked) {
          checkbox.click();
        }
      }
    };
    closeSidebarOnMobile();
  }, []);

  const handlesapprovetrip = async (tripId, buttonId) => {
    try {
      // Build payload as per API requirements
      const payload = {
        tId: String(tripId),
        checkpost_id: user.checkpostid,
        remarks: "All details verified and OK.",
        astatus: 1,
        buttonId: Number(buttonId),
        verifiedby: user.pol_reg_id,
      };

      // Call API to approve trip
      await verfiedTrip(payload, accessToken);

      // Show toast and refresh relevant data
      toast({ title: "Trip Verified successfully" });
      navigate("/VerifiedTrips");
      //await fetchRunningConvey();
    } catch (error) {
      toast({
        title: "Failed to approve trip",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // const handleCancelTrip = async (tripId, ButtonId) => {
  //   try {
  //     const payload = {
  //       tId: String(tripId),
  //       convey_id: 1, // default/fallback
  //       checkpost_id: user.checkpostid,
  //       remarks: "Cancel via UI",
  //       astatus: 0,
  //       buttonId: Number(ButtonId),
  //     };
  //     //console.log("cancel payload", payload);
  //     await approveTripAPI(payload, accessToken)
  //     await approveTripAPI(tripId, ButtonId, accessToken, () => {
  //       toast({ title: "Trip Cancel successfully" });
  //       navigate("/approvals");
  //     });
  //   } catch (error) {
  //     toast({
  //       title: "Failed to Cancel trip",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   }
  // };

  // For Cancel Trip (Comented out for Reject Trip with Remarks)
  // const handleCancelTrip = async (tripId, buttonId) => {
  //   try {
  //     const payload = {
  //       tId: String(tripId),
  //       checkpost_id: user.checkpostid,
  //       remarks: "Cancel from Police",
  //       astatus: 0,
  //       buttonId: Number(buttonId),
  //       verifiedby: user.pol_reg_id,
  //     };
  //     await verfiedTrip(payload, accessToken);
  //     toast({ title: "Trip canceled successfully" });
  //     navigate("/VerifiedTrips");
  //   } catch (error) {
  //     toast({
  //       title: "Failed to cancel trip",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   }
  // };

  // For Reject Trip with Remarks
  const handleRejectTrip = async () => {
    if (!rejectRemarks.trim()) {
      toast({
        title: "Remarks required",
        description: "Please enter remarks before rejecting the trip.",
        variant: "destructive",
      });
      return;
    }

    try {
      setRejectLoading(true);

      const payload = {
        tId: String(tripId),
        checkpost_id: user.checkpostid,
        remarks: rejectRemarks,
        astatus: 0, // rejected
        buttonId: 3,
        verifiedby: user.pol_reg_id,
      };

      await verfiedTrip(payload, accessToken);

      toast({ title: "Trip rejected successfully" });
      setRejectOpen(false);
      navigate("/VerifiedTrips");
    } catch (error) {
      toast({
        title: "Failed to reject trip",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-lg text-gray-600 animate-pulse">
          Loading trip details...
        </div>
      </DashboardLayout>
    );
  }

  if (!trip) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-red-600 text-xl font-semibold">
          Trip not found or an error occurred.
        </div>
      </DashboardLayout>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = trip.date.split("-").map(Number);
  const tripDate = new Date(year, month - 1, day);
  tripDate.setHours(0, 0, 0, 0);
  const tripDetails = trip.trips || trip;

  if (tripDate < today) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-red-700 text-xl font-semibold">
          ❌ This trip is expired. Approval is only allowed for today or future
          trips.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-8 px-3 sm:px-6 max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            🚐 Trip Details
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-4 py-2 sm:px-5 sm:py-3"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </Button>
        </div>

        {/* Trip Overview Card */}
        <TripOverviewCard tripDetails={tripDetails} />

        {/* Passenger Details Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-white rounded-xl">
          <CardHeader className="bg-purple-100/80 rounded-t-xl px-6 py-4">
            <CardTitle className="flex items-center gap-3 text-purple-900 text-xl font-bold">
              <Users className="text-purple-700" /> Passenger Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 bg-white rounded-b-xl">
            {Array.isArray(trip.passengers) && trip.passengers.length > 0 ? (
              trip.passengers.length > 3 ? (
                <div className="overflow-x-auto rounded-lg shadow-md border border-purple-300">
                  <table className="min-w-full table-auto">
                    <thead className="bg-purple-100">
                      <tr>
                        <th className="p-3 text-left font-semibold text-purple-800 border-b border-purple-300">
                          S.No
                        </th>
                        <th className="p-3 text-left font-semibold text-purple-800 border-b border-purple-300">
                          Name
                        </th>
                        <th className="p-3 text-left font-semibold text-purple-800 border-b border-purple-300">
                          Phone
                        </th>
                        <th className="p-3 text-left font-semibold text-purple-800 border-b border-purple-300">
                          Document Type
                        </th>
                        <th className="p-3 text-left font-semibold text-purple-800 border-b border-purple-300">
                          Document ID
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {trip.passengers.map((passenger, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-purple-50 transition-colors"
                        >
                          <td className="p-3 border-b border-purple-200 text-purple-900 font-semibold">
                            {idx + 1}
                          </td>
                          <td className="p-3 border-b border-purple-200">
                            {passenger.passengerName}
                          </td>
                          <td className="p-3 border-b border-purple-200">
                            {passenger.phoneNo}
                          </td>
                          <td className="p-3 border-b border-purple-200">
                            {passenger.docType}
                          </td>
                          <td className="p-3 border-b border-purple-200">
                            {passenger.docId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trip.passengers.map((passenger, idx) => (
                    <PassengerCard key={idx} passenger={passenger} />
                  ))}
                </div>
              )
            ) : (
              <p className="text-gray-600 text-center">No passengers found.</p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-8">
          <Button
            onClick={() => handlesapprovetrip(tripId, 2)}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 text-lg rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-6 h-6" /> Checked and Verified Trip
          </Button>

          <Button
            // For Reject Trip with Remarks
            // onClick={() => handleCancelTrip(tripId, 3)}
            onClick={() => setRejectOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 text-lg rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <XCircle className="w-6 h-6" /> Reject Trip
          </Button>

          <Button
            onClick={() => navigate(`/EditTrip/${tripId}`)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            Edit Trip
          </Button>
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Reject Trip
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Please provide a reason for rejecting this trip.
                </p>

                <Textarea
                  placeholder="Enter rejection remarks..."
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <DialogFooter className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>

                <Button
                  onClick={handleRejectTrip}
                  disabled={rejectLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {rejectLoading ? "Rejecting..." : "Confirm Reject"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewVerifyTrip;
