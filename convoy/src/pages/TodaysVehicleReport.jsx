import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getTodaysReport } from "@/contexts/GetApi";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import VehicleReport from "@/components/VehicleReport";

const TodaysVehicleReport = () => {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(null);
  const [convoys, setConvoys] = useState([]);
  const [specialSummary, setSpecialSummary] = useState(null);

  /* ================= Fetch Vehicle Report ================= */
  const fetchVehicleReport = useCallback(async () => {
    if (!accessToken) return;

    try {
      const payload = {
        checkpostId: user?.checkpostid,
      };

      if (selectedDate) {
        payload.date = selectedDate;
      }

      const res = await getTodaysReport(accessToken, payload);
      setConvoys(res?.data?.convoys || []);
      setSpecialSummary(res?.data?.specialSummary || null);
    } catch (error) {
      console.error("Failed to fetch vehicle report", error);
    }
  }, [accessToken, user?.checkpostid, selectedDate]);

  useEffect(() => {
    fetchVehicleReport();
  }, [fetchVehicleReport]);

  /* ================= CONVOY FILTER (SAME AS YOUR PAGE) ================= */
  const convoysToShow = !user?.checkpostid
    ? convoys
    : Number(user?.checkpostid) === 1
      ? convoys.filter((c) => [1, 2, 3, 4].includes(c.convey_id))
      : convoys.filter((c) => [5, 6, 7, 8].includes(c.convey_id));

  const handleBack = () => navigate(-1);

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <Card className="overflow-x-auto">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Today’s Vehicle Report
                </h1>
                <p className="text-sm text-muted-foreground">
                  Vehicle-wise count across all convoys
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
            {/* ===== DATE FILTER ===== */}
            <div className="mb-4 flex gap-4 border-b pb-4">
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
            </div>

            {/* ===== SUMMARY CARDS (ADD HERE ✅) ===== */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg bg-blue-50 p-3 text-center shadow-sm">
                <p className="text-xs text-blue-700">Total Convoys</p>
                <p className="text-xl font-bold text-blue-900">
                  {convoysToShow.length}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-3 text-center shadow-sm">
                <p className="text-xs text-green-700">Total Vehicles</p>
                <p className="text-xl font-bold text-green-900">
                  {convoysToShow.reduce((sum, c) => {
                    const vs = c.vehicleStats || {};
                    return (
                      sum +
                      (vs.Car || 0) +
                      (vs.SUV || 0) +
                      (vs.LMVCargo || 0) +
                      (vs.Van || 0) +
                      (vs.PickupTruck || 0) +
                      (vs.Truck || 0) +
                      (vs.HMV || 0) +
                      (vs.BusGovernment || 0) +
                      (vs.BusCommercial || 0) +
                      (vs.Ambulance || 0) +
                      (vs.MortuaryVan || 0) +
                      (vs.WaterTanker || 0) +
                      (vs.OilTanker || 0) +
                      (vs.LPGTanker || 0) +
                      (vs.Other || 0)
                    );
                  }, 0)}
                </p>
              </div>
            </div>

            {/* ===== VEHICLE REPORT TABLE ===== */}
            <VehicleReport
              convoysToShow={convoysToShow}
              specialSummary={specialSummary}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TodaysVehicleReport;
