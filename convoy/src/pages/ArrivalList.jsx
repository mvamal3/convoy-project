import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getArrivaldetails } from "@/contexts/GetApi";

const TodayArrivalList = () => {
  const { user, accessToken } = useAuth();
  const [arrivalData, setArrivalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ✅ Fetch API Data
  useEffect(() => {
    const fetchArrivalData = async () => {
      if (!accessToken || !user?.checkpostid) return;

      try {
        setLoading(true);
        const res = await getArrivaldetails(accessToken, user.checkpostid);
        console.log("📦 Arrival API Response:", res);

        if (!res) {
          setMessage("Server did not respond.");
          setArrivalData(null);
          return;
        }

        // ✅ Case 1: Backend says convoy not found
        if (res?.data?.success === false) {
          setMessage(res.data.message || "No running convoy found.");
          setArrivalData(null);
          return;
        }

        // ✅ Case 2: No convoy details
        if (!res?.data?.conveyDetails) {
          setMessage(res?.message || "No arrival data found.");
          setArrivalData(null);
          return;
        }

        // ✅ Case 3: Convoy data available
        setArrivalData(res.data);
        setMessage("");
      } catch (err) {
        console.error("❌ Error fetching arrival data:", err);
        setMessage("Failed to fetch data.");
        setArrivalData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArrivalData();
  }, [accessToken, user?.checkpostid]);

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        {/* ✅ Loading */}
        {loading && (
          <div className="text-center text-gray-600 py-10">Loading...</div>
        )}

        {/* ✅ Message from backend or error */}
        {!loading && message && (
          <div className="text-center bg-yellow-50 border border-yellow-300 text-yellow-800 py-3 rounded-md shadow-sm">
            {message}
          </div>
        )}

        {/* ✅ When data exists */}
        {!loading && arrivalData && (
          <>
            {/* ✅ Summary Card */}
            <Card className="bg-blue-50 border border-blue-200 shadow-sm">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold text-blue-800">
                  Convoy Arrival Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-5 gap-4 text-sm text-gray-800">
                <div>
                  <p className="font-semibold text-gray-600">From Checkpost:</p>
                  <p>{arrivalData.conveyDetails.checkpost_name}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Convoy:</p>
                  <p>{arrivalData.conveyDetails.convey_name}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Start Time:</p>
                  <p>{arrivalData.conveyDetails.start_time}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">End Time:</p>
                  <p>{arrivalData.conveyDetails.close_time}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">
                    Total Vehicles Pending:
                  </p>
                  <p>{arrivalData.approvedTrips?.length || 0}</p>
                </div>
              </CardContent>
            </Card>

            {/* ✅ Arrival Table */}
            <Card className="overflow-x-auto">
              <CardHeader>
                <h1 className="text-2xl font-bold text-gray-900">
                  Today’s Arrival Trip List
                </h1>
              </CardHeader>

              <CardContent>
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[800px] w-full text-sm text-left text-gray-700 border">
                    <thead className="bg-gray-100 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 border">#</th>
                        <th className="px-4 py-2 border">Trip ID</th>
                        <th className="px-4 py-2 border">Origin</th>
                        <th className="px-4 py-2 border">Destination</th>
                        <th className="px-4 py-2 border">Trip Date</th>
                        <th className="px-4 py-2 border">Approve Time</th>
                        <th className="px-4 py-2 border">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arrivalData.approvedTrips?.length > 0 ? (
                        arrivalData.approvedTrips.map((trip, index) => (
                          <tr
                            key={trip.tId}
                            className="hover:bg-gray-50 border-b"
                          >
                            <td className="px-4 py-2 border">{index + 1}</td>
                            <td className="px-4 py-2 border">{trip.tId}</td>
                            <td className="px-4 py-2 border">{trip.origin}</td>
                            <td className="px-4 py-2 border">
                              {trip.destination}
                            </td>
                            <td className="px-4 py-2 border">
                              {trip.trip_date
                                ? new Date(trip.trip_date).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </td>

                            <td className="px-4 py-2 border">{trip.arrtime}</td>
                            <td className="px-4 py-2 border">{trip.remarks}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center text-gray-500 py-4"
                          >
                            No trips found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TodayArrivalList;
