import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getConveyWiseReport } from "@/contexts/GetApi";
import { useNavigate } from "react-router-dom";

const ConveyWiseReport = () => {
  const { accessToken } = useAuth();
  const [reportData, setReportData] = useState({});
  const [filteredDate, setFilteredDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const convoyUp = [
    { id: 1, label: "06:00 First Convoy" },
    { id: 2, label: "09:00 Second Convoy" },
    { id: 3, label: "12:00 Third Convoy" },
    { id: 4, label: "14:30 Fourth Convoy" },
  ];

  const convoyDown = [
    { id: 5, label: "06:30 First Convoy" },
    { id: 6, label: "09:30 Second Convoy" },
    { id: 7, label: "12:30 Third Convoy" },
    { id: 8, label: "15:00 Fourth Convoy" },
  ];
  const fetchReport = useCallback(async () => {
    if (accessToken && filteredDate) {
      const res = await getConveyWiseReport(accessToken, filteredDate);
      console.log("resssssssss", res);
      const countData = res?.data?.vehicleCountByConvoyTime || {};
      setReportData(countData);
    }
  }, [accessToken, filteredDate]);

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const getTotalVehicleCount = () => {
    return Object.values(reportData).reduce((sum, count) => sum + count, 0);
  };

  const renderTable = (title, convoyList) => (
    <>
      <h2 className="text-sm text-muted-foreground mb-3 font-medium">
        {title}
      </h2>
      <div className="w-full overflow-x-auto">
        <table className="min-w-[800px] w-full text-sm text-left text-gray-700 border">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Convoy</th>
              <th className="px-4 py-2 border">No of Vehicle</th>
            </tr>
          </thead>
          <tbody>
            {convoyList.map((c, idx) => (
              <tr key={c.id} className="hover:bg-gray-50 border-b">
                <td className="px-4 py-2 border">{idx + 1}</td>

                <td className="px-4 py-2 border">
                  {filteredDate
                    ? new Date(filteredDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "-"}
                </td>
                <td className="px-4 py-2 border">{c.label}</td>
                <td className="px-4 py-2 border">{reportData[c.id] || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <Card className="overflow-x-auto">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center justify-between">
              {/* Page Title */}
              <h1 className="text-2xl font-bold text-gray-900">
                Convoy Wise Report
              </h1>

              {/* Back Button (RIGHT SIDE) */}
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm rounded-md border bg-white text-gray-700 hover:bg-gray-100 transition"
              >
                ← Back
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Filter by Date */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              {/* Left: Page Heading */}
              <div className="flex-1"></div>

              {/* Right: Filter & Button */}
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={filteredDate}
                    onChange={(e) => setFilteredDate(e.target.value)}
                    className="w-48 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
                  />
                </div>
                <button
                  onClick={() => fetchReport()}
                  className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  Search
                </button>
              </div>
            </div>

            {/* ✅ Total Vehicle Count */}
            <p className="text-sm text-gray-700 font-medium mb-4">
              Total Vehicles: {getTotalVehicleCount()}
            </p>

            {/* Tables */}
            <div className="space-y-8">
              {renderTable("From Jirkatang To Baratang", convoyUp)}
              {renderTable("From Baratang To Jirkatang", convoyDown)}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ConveyWiseReport;
