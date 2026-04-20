import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";

const SearchTrip = () => {
  const [tripId, setTripId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!tripId.trim()) {
      alert("Please enter Trip ID");
      return;
    }

    navigate(`/ManageTrip/PoliceViewTrip/${tripId.trim()}`);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-center items-center min-h-[75vh] px-4">
        <Card className="w-full max-w-md border shadow-lg rounded-xl bg-white">
          {/* Header */}
          <CardHeader className="text-center border-b bg-gray-50 rounded-t-xl">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center justify-center gap-2">
              🔍 View Trip Details
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Enter a valid Trip ID to view complete trip information
            </p>
          </CardHeader>

          {/* Content */}
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip ID
                </label>
                <input
                  type="text"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  placeholder="Example: TRIP12345"
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2.5
                    text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:border-blue-500
                    transition
                  "
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold tracking-wide
                    bg-blue-600  hover:bg-indigo-700 text-white"
              >
                View Trip
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SearchTrip;
