import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getConveyDetails } from "@/contexts/GetApi";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const GenerateReport = () => {
  const { user, accessToken } = useAuth();
  const [date, setDate] = useState("");
  const [conveyList, setConveyList] = useState([]);
  const [selectedConvey, setSelectedConvey] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch convoy dropdown list
  useEffect(() => {
    const fetchConveys = async () => {
      if (!accessToken) return;
      try {
        const res = await getConveyDetails(accessToken, user.checkpostid);
        setConveyList(res?.data?.data || []);
      } catch (error) {
        console.error("Error fetching conveys:", error);
      }
    };
    fetchConveys();
  }, [accessToken, user.checkpostid]);

  // ✅ Handle navigation to print report
  const handleGenerate = () => {
    if (!date) {
      Swal.fire({
        icon: "warning",
        title: "Date Required",
        text: "Please select a date before generating the report.",
        confirmButtonColor: "#2563eb", // blue
      });
      return;
    }

    if (!selectedConvey) {
      Swal.fire({
        icon: "warning",
        title: "Convoy Required",
        text: "Please select a convoy time before generating the report.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
    const queryParams = new URLSearchParams();
    if (date) queryParams.append("date", date);
    if (selectedConvey) queryParams.append("convey", selectedConvey);

    //console.log("Navigating with params:", queryParams.toString());

    navigate(`/trip-report?${queryParams.toString()}`);
  };

  // ✅ Handle Back navigation
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Generate Trip Report
          </h1>

          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            ← Back
          </Button>
        </div>

        {/* Form Card */}
        <div className="max-w-xl bg-white shadow-md rounded-lg p-6 border border-gray-200">
          {/* Date Field */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Select Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]} // 🔒 restricts to today
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>

          {/* Convoy Dropdown */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Select Convoy <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedConvey}
              onChange={(e) => setSelectedConvey(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
            >
              <option value="">Select Convoy</option>
              {conveyList.length > 0 ? (
                conveyList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.convey_name} ({c.convey_time})
                  </option>
                ))
              ) : (
                <option disabled>No conveys available</option>
              )}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md"
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GenerateReport;
