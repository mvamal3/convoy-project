import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TripStatusCards from "@/components/TripStatusCards";
import PassengerCard1 from "@/components/PassengerCard";
import TripOverviewCard from "@/components/TripOverviewCard"; // <-- new import

import {
  ArrowLeft,
  Users,
  MapPin,
  UserCircle,
  Phone,
  IdCard,
} from "lucide-react";

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center justify-between px-4 py-2 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="text-gray-900 font-semibold text-right">{value}</span>
  </div>
);

const PassengerCard = ({ passenger }: { passenger: any }) => (
  <div className="border rounded-xl p-4 bg-gray-50 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-3 mb-2">
      <UserCircle className="w-6 h-6 text-gray-600" />
      <p className="font-semibold text-gray-800">{passenger.passengerName}</p>
    </div>
    <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
      <Phone className="w-4 h-4" />
      <span>{passenger.phoneNo}</span>
    </div>
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <IdCard className="w-4 h-4" />
      <span>
        {passenger.docType} / {passenger.docId}
      </span>
    </div>
  </div>
);

const ViewTripDetailsPolice = () => {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const accessToken = localStorage.getItem("accessToken");
  console.log("Access Token:", accessToken);
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
        console.log("Fetched Trip Details:", data);
        setTrip(data?.data || null);
      } catch (error) {
        console.error("Error fetching trip details:", error);
        setTrip(null);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && tripId) fetchTripDetails();
  }, [tripId, accessToken]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-16 text-lg text-gray-600 animate-pulse">
          Loading trip details...
        </div>
      </DashboardLayout>
    );
  }

  if (!trip?.trips) {
    return (
      <DashboardLayout>
        <div className="text-center py-16 text-red-500 text-xl font-semibold">
          Trip not found or an error occurred.
        </div>
      </DashboardLayout>
    );
  }

  const { trips: tripDetails, checkoutTrips, approveTrip } = trip;

  const hasApproveData = approveTrip && !approveTrip?.message;
  const hasCheckoutData =
    Array.isArray(checkoutTrips) &&
    checkoutTrips.length > 0 &&
    !checkoutTrips[0]?.message;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8 px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            🚐 Trip Details
          </h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>

        {/* Trip Overview */}
        <TripOverviewCard tripDetails={tripDetails} />

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
            <PassengerCard1 passengers={tripDetails.passengers} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ViewTripDetailsPolice;
