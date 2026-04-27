import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getTodaysReport } from "@/contexts/GetApi";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ✅ FIXED IMPORTS
import TodaysDetailedReport from "@/components/TodaysDetailedReport";
import TodaysCountReport from "@/components/TodaysCountReport";

const TodaysTripDetails = () => {
  const { accessToken, user } = useAuth();

  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);

  const [convoys, setConvoys] = useState([]);
  const [specialSummary, setSpecialSummary] = useState({});

  const [activeTab, setActiveTab] = useState("count"); // details | count

  /* ================= Fetch Today Report ================= */
  const fetchTodayReport = useCallback(async () => {
    if (!accessToken) return;

    try {
      const payload = {
        checkpostId: user?.checkpostid,
      };

      // ✅ send date ONLY if selected
      if (selectedDate) {
        payload.date = selectedDate;
      }

      const res = await getTodaysReport(accessToken, payload);
      setConvoys(res?.data?.convoys || []);
      setSpecialSummary(res?.data?.specialSummary || {});
    } catch (error) {
      console.error("Failed to fetch report", error);
    }
  }, [accessToken, user?.checkpostid, selectedDate]);

  useEffect(() => {
    fetchTodayReport();
  }, [fetchTodayReport]);

  const convoysToShow = !user?.checkpostid
    ? convoys
    : convoys.filter((c) => {
        const id = Number(c.convey_id);

        if (id >= 100) return true; // ✅ KEEP SPECIAL ALWAYS

        if (Number(user?.checkpostid) === 1) {
          return [1, 2, 3, 4].includes(id);
        } else {
          return [5, 6, 7, 8].includes(id);
        }
      });

  const handleBack = () => navigate(-1);

  /* ================= GRAND TOTAL ================= */
  const grandTotal = convoysToShow.reduce(
    (acc, c) => {
      acc.approvedTrips += c.approvedTripsCount || 0;
      acc.rejectedTrips += c.rejectedTripsCount || 0;
      acc.verificationRejected += c.verificationRejectedCount || 0;
      acc.verificationPending += c.verificationPendingCount || 0;
      acc.touristTrips += c.touristTripsCount || 0;

      acc.totalPassengers += c.totalPassengers || 0;
      acc.totalMale += c.totalMale || 0;
      acc.totalFemale += c.totalFemale || 0;
      acc.totalChild += c.totalChild || 0;
      acc.totalForeigners += c.totalForeigners || 0;

      acc.vehicle.Government += c.vehicleStats?.Government || 0;
      acc.vehicle.Commercial += c.vehicleStats?.Commercial || 0;
      acc.vehicle.Private += c.vehicleStats?.Private || 0;

      acc.vehicle.LMV += c.vehicleStats?.LMV || 0;
      acc.vehicle.Ambulance += c.vehicleStats?.Ambulance || 0;
      acc.vehicle.PickupTruck += c.vehicleStats?.PickupTruck || 0;
      acc.vehicle.OilTanker += c.vehicleStats?.OilTanker || 0;
      acc.vehicle.LPGTruck += c.vehicleStats?.LPGTruck || 0;

      return acc;
    },
    {
      approvedTrips: 0,
      rejectedTrips: 0,
      verificationRejected: 0,
      verificationPending: 0,
      totalPassengers: 0,
      touristTrips: 0, //
      totalMale: 0,
      totalFemale: 0,
      totalChild: 0,
      totalForeigners: 0,
      vehicle: {
        Government: 0,
        Commercial: 0,
        Private: 0,
        LMV: 0,
        LMVCargo: 0,
        Truck: 0,
        WaterTanker: 0,
        OilTanker: 0,
        LPGTruck: 0,
        BusGovernment: 0,
        BusCommercial: 0,
        Ambulance: 0,
        PickupTruck: 0,
      },
    },
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <Card className="overflow-x-auto">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Today’s Convoy Report
                </h1>
                <p className="text-sm text-muted-foreground">
                  Live summary of convoy movement & verification
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleBack}
                className="h-8 px-3 text-sm"
              >
                ← Back
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* ===== TAB SWITCH ===== */}
            <div className="mb-4 flex gap-2 border-b pb-2">
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium mb-1">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value || null)}
                  className="w-full border rounded px-3 py-2 text-sm
             focus:outline-none focus:ring focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`text-sm font-semibold ${
                    activeTab === "count" ? "text-blue-700" : "text-gray-500"
                  }`}
                ></span>

                {/* Toggle Switch */}
                <button
                  onClick={() =>
                    setActiveTab(activeTab === "count" ? "details" : "count")
                  }
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors
      ${activeTab === "details" ? "bg-blue-600" : "bg-gray-300"}`}
                  aria-label="Toggle report view"
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform
        ${activeTab === "details" ? "translate-x-7" : "translate-x-1"}`}
                  />
                </button>

                <span
                  className={`text-sm font-semibold ${
                    activeTab === "details" ? "text-blue-700" : "text-gray-500"
                  }`}
                >
                  📋 Detailed Report
                </span>
              </div>
            </div>

            {/* ===== TAB CONTENT ===== */}
            {activeTab === "details" && (
              <TodaysDetailedReport
                convoysToShow={convoysToShow}
                grandTotal={grandTotal}
              />
            )}

            {activeTab === "count" && (
              <TodaysCountReport
                convoysToShow={convoysToShow}
                grandTotal={grandTotal}
                role={user?.role}
                checkpostId={user?.checkpostid}
                specialSummary={specialSummary}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TodaysTripDetails;
