import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getTodaysReport } from "@/contexts/GetApi";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import VehicleReport from "@/components/VehicleReport";

const MonthlyVehicleReport = () => {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();

  /* ================= CURRENT MONTH ================= */

  const currentDate = new Date();

  const currentMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [convoys, setConvoys] = useState([]);
  const [specialSummary, setSpecialSummary] = useState(null);

  const [loading, setLoading] = useState(false);

  /* ================= FETCH REPORT ================= */

  const fetchVehicleReport = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);

      /* ===== MONTH START ===== */
      const fromDate = `${selectedMonth}-01`;

      /* ===== MONTH END ===== */
      const lastDay = new Date(
        Number(selectedMonth.split("-")[0]),
        Number(selectedMonth.split("-")[1]),
        0,
      ).getDate();

      const toDate = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

      const payload = {
        checkpostId: user?.checkpostid,
        fromDate,
        toDate,
      };

      console.log("MONTHLY REPORT PAYLOAD:", payload);

      const res = await getTodaysReport(accessToken, payload);

      setConvoys(res?.data?.convoys || []);
      setSpecialSummary(res?.data?.specialSummary || null);
    } catch (error) {
      console.error("Failed to fetch vehicle report", error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user?.checkpostid, selectedMonth]);

  useEffect(() => {
    fetchVehicleReport();
  }, [fetchVehicleReport]);

  /* ================= CONVOY FILTER ================= */

  const convoysToShow = !user?.checkpostid
    ? convoys
    : Number(user?.checkpostid) === 1
      ? convoys.filter((c) => [1, 2, 3, 4].includes(c.convey_id))
      : convoys.filter((c) => [5, 6, 7, 8].includes(c.convey_id));

  const handleBack = () => navigate(-1);

  /* ================= TOTAL VEHICLES ================= */

  const totalVehicles = convoysToShow.reduce((sum, c) => {
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
  }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <Card className="overflow-x-auto">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Monthly Vehicle Report
                </h1>

                <p className="text-sm text-muted-foreground">
                  Vehicle-wise monthly convoy statistics
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
            {/* ================= MONTH FILTER ================= */}

            <div className="mb-6 border-b pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* MONTH SELECT */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Select Month
                  </label>

                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="
                      w-full
                      border border-gray-300
                      rounded-md
                      px-3 py-2
                      text-sm
                      bg-white
                      shadow-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      focus:border-blue-500
                    "
                  />
                </div>

                {/* GENERATE BUTTON */}
                <div className="flex items-end">
                  <Button
                    onClick={fetchVehicleReport}
                    disabled={loading}
                    className="
                      w-full sm:w-auto
                      bg-blue-700
                      hover:bg-blue-800
                      text-white
                      px-6
                    "
                  >
                    {loading ? "Loading..." : "Generate Report"}
                  </Button>
                </div>
              </div>
            </div>

            {/* ================= SUMMARY ================= */}

            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* TOTAL CONVOYS */}
              <div className="rounded-lg bg-blue-50 p-3 text-center shadow-sm">
                <p className="text-xs text-blue-700">Total Convoys</p>

                <p className="text-xl font-bold text-blue-900">
                  {convoysToShow.length}
                </p>
              </div>

              {/* TOTAL VEHICLES */}
              <div className="rounded-lg bg-green-50 p-3 text-center shadow-sm">
                <p className="text-xs text-green-700">Total Vehicles</p>

                <p className="text-xl font-bold text-green-900">
                  {totalVehicles}
                </p>
              </div>
            </div>

            {/* ================= TABLE ================= */}

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

export default MonthlyVehicleReport;
