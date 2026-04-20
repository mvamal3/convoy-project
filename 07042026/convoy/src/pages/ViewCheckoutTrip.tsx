import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { updateCheckoutTripAPI } from "@/contexts/PostApi";

// Reusable modular components
import TripOverviewCard from "@/components/TripOverviewCard";
import TripStatusCards from "@/components/TripStatusCards";
import PassengerCard from "@/components/PassengerCard";
import { getRunningCheckoutAPI } from "@/contexts/GetApi";
import { set } from "date-fns";

const ViewCheckoutTrip = () => {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();
  const [tripData, setTripData] = useState<any>(null);
  const [tripDataApprove, setTripDataApprove] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const accessToken = localStorage.getItem("accessToken");
  const [runningConveyId, setRunningcheckoutConvey] = useState(null);
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
        //console.log("Trip details:", data?.data);
        setTripDataApprove(data?.data || null);
        setTripData(data?.data?.trips || null);
      } catch (error) {
        console.error("Error fetching trip details:", error);
        toast.error("Failed to fetch trip details");
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && tripId) fetchTripDetails();
  }, [tripId, accessToken]);

  useEffect(() => {
    fetchRunningCheckout();
  }, [accessToken, user?.checkpostid]);

  const fetchRunningCheckout = async () => {
    const res = await getRunningCheckoutAPI(accessToken, user.checkpostid);
    console.log("Running checkout response:", res);

    if (res?.success && res?.data) {
      setRunningcheckoutConvey({
        convey_name: res.data.tconvey?.convey_name,
        convey_time: res.data.tconvey?.convey_time,
        start_time: res.data.starttime,
      });
      setRunningcheckoutConvey(res.data.conveyid);
    } else {
      setRunningcheckoutConvey(null);
      setRunningcheckoutConvey(null);
    }
  };

  const handleCheckoutAction = async (status: number, remarks?: string) => {
    try {
      const payload = {
        tId: tripId,
        status,
        checkpostId: user.checkpostid,
        remarks:
          remarks ||
          (status === 1
            ? "Trip checked and verified OK."
            : status === 0
              ? "Trip marked as non-arrival."
              : "Trip marked as problem."),
        runningConveyId,
      };
      console.log("payload", payload);
      const response = await updateCheckoutTripAPI(accessToken, payload);

      if (status === 1) toast("Trip marked as Checked OK ✅");
      else if (status === 0) toast("Trip marked as Non-arrival ❌");
      else if (status === 2) toast("Trip marked as Problem ⚠️");
      else toast(response?.message || "Checkout trip updated");

      navigate("/checkout");
    } catch (error: any) {
      toast(error.message || "Something went wrong during update");
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-gray-600 animate-pulse">
          Loading trip details...
        </div>
      </DashboardLayout>
    );

  if (!tripData)
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-red-500 font-semibold">
          Trip not found or an error occurred.
        </div>
      </DashboardLayout>
    );
  const tripDetails = tripData.trips || tripData;
  const checkoutTrips = tripData.checkoutTrips || [];
  const approveTrip = tripDataApprove.approveTrip || null;
  console.log("approveTrip", approveTrip);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8 px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            🚐 Checkout Trip Details
          </h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>

        {/* Trip Overview */}
        <TripOverviewCard tripDetails={tripData} />

        {/* Trip Checkout Status */}
        <TripStatusCards approveTrip={null} checkoutTrips={[tripData]} />

        <TripStatusCards
          approveTrip={approveTrip}
          checkoutTrips={checkoutTrips}
        />

        {/* Passenger Details */}
        <Card className="shadow-md border-0 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="bg-purple-100/70 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-purple-900 text-lg font-semibold">
              <Users className="text-purple-700" />
              Passenger Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 bg-white rounded-b-xl">
            <PassengerCard passengers={tripData.passengers || []} />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 px-4 sm:px-6">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() => handleCheckoutAction(1)}
            >
              Checked OK
            </Button>

            <Button
              size="sm"
              variant="warning"
              onClick={() => {
                const remarks = prompt(
                  "🚨 Please enter remarks for the problem:",
                );
                if (remarks) handleCheckoutAction(2, remarks);
              }}
            >
              Check Problem
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleCheckoutAction(0)}
            >
              Non-arrival
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewCheckoutTrip;
