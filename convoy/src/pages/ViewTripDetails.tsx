import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, Printer } from "lucide-react";
import "./TripPrint.css"; // ✅ Keep for consistent layout style

import TripStatusCards from "@/components/TripStatusCards";
import TripOverviewCard from "@/components/TripOverviewCard";
import PassengerCard from "@/components/PassengerCard";

const TripViewDetails = () => {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const accessToken = localStorage.getItem("accessToken");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const BASE_URL = `${API_BASE_URL}/api/auth`;
  ///console.log("baseurl", BASE_URL);

  // ✅ Open new print page
  const handleOpenPrintPage = () => {
    const base = import.meta.env.BASE_URL;
    window.open(`${base}trip/print/${tripId}`, "_blank");
  };

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const res = await fetch(`${BASE_URL}/get-trip-details-by-tId-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ tId: tripId }),
        });

        const data = await res.json();
        console.log("Trip details:", data);
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

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-center py-16 text-lg text-gray-600 animate-pulse">
          Loading trip details...
        </div>
      </DashboardLayout>
    );

  if (!trip)
    return (
      <DashboardLayout>
        <div className="text-center py-16 text-red-500 text-xl font-semibold">
          Trip not found or an error occurred.
        </div>
      </DashboardLayout>
    );

  const tripDetails = trip.trips || trip;
  const checkoutTrips = trip.checkoutTrips || [];
  const approveTrip = trip.approveTrip || null;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8 px-2 sm:px-4">
        {/* Header - hidden in print */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            🚐 Trip Details
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleOpenPrintPage}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Printer className="mr-2 h-5 w-5" />
              Print / Save PDF
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
          </div>
        </div>

        {/* Trip Details */}
        <TripOverviewCard tripDetails={tripDetails} />
        <TripStatusCards
          approveTrip={approveTrip}
          checkoutTrips={checkoutTrips}
        />

        <Card className="shadow-md border-0 bg-gradient-to-br from-purple-50 to-white mt-6">
          <CardHeader className="bg-purple-100/70 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-purple-900 text-lg font-semibold">
              <Users className="text-purple-700" />
              Passenger Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 bg-white rounded-b-xl">
            <PassengerCard passengers={tripDetails.passengers} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TripViewDetails;
