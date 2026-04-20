import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, Shield, Settings, BarChart3 } from "lucide-react";
import { getRegisteredPolice, getFreezpolice } from "@/contexts/GetApi";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { accessToken, user } = useAuth();
  const [police, setPolice] = React.useState([]);
  const [activeusers, setActiveusers] = React.useState(0);
  const [frozenUsers, setFrozenUsers] = React.useState(0);
  const navigate = useNavigate();

  const fetchPolice = useCallback(async () => {
    if (!accessToken) return;

    try {
      const res = await getRegisteredPolice(accessToken);
      console.log("Police list:", res?.data.count);
      setActiveusers(res?.data.count || 0);
    } catch (err) {
      console.error("Police fetch error:", err);
    }
  }, [accessToken]);

  const fetchfrozenpolice = useCallback(async () => {
    if (!accessToken) return;

    try {
      const res = await getFreezpolice(accessToken);
      console.log("Police list:", res?.data.count);
      setFrozenUsers(res?.data.count || 0);
    } catch (err) {
      console.error("Police fetch error:", err);
    }
  }, [accessToken]);
  useEffect(() => {
    if (accessToken) {
      fetchPolice();
      fetchfrozenpolice();
    }
  }, [accessToken, fetchPolice]);

  return (
    <DashboardLayout>
      <div className="space-y-8 px-4 sm:px-8 lg:px-12 pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome, {user?.name || "Admin"}
          </h1>
          <p className="text-gray-600 mt-1">System Administration Dashboard</p>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <Card
            onClick={() => navigate("/RegisteredPolice")}
            className="border-4 border-indigo-600 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl hover:shadow-2xl transition-all duration-300 p-5 sm:p-6"
          >
            <CardHeader className="flex justify-between items-center mb-3 pb-2 border-b border-indigo-200">
              <CardTitle className="text-sm font-semibold tracking-wide text-indigo-700 flex items-center gap-2 uppercase">
                <Shield className="h-5 w-5 text-indigo-600" />
                Active Police Users
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-start justify-center gap-1">
              <div className="text-4xl font-extrabold text-indigo-900 tracking-tight">
                {activeusers}
              </div>

              <p className="text-sm font-medium text-indigo-600">
                Officers currently logged & operational
              </p>

              <p className="text-xs text-indigo-500 mt-1">
                Live data from police user registry
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/FreezPolice")}
            className="border-4 border-red-600 bg-gradient-to-br from-red-100 to-red-50 rounded-xl hover:shadow-2xl transition-all duration-300 p-5 sm:p-6"
          >
            <CardHeader className="flex justify-between items-center mb-3 pb-2 border-b border-red-200">
              <CardTitle className="text-sm font-semibold tracking-wide text-red-700 flex items-center gap-2 uppercase">
                <Users className="h-5 w-5 text-red-600" />
                Frozen Users
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-start justify-center gap-1">
              <div className="text-4xl font-extrabold text-red-800 tracking-tight">
                {frozenUsers}
              </div>

              <p className="text-sm font-medium text-red-600">
                Accounts currently blocked
              </p>

              <p className="text-xs text-red-500 mt-1">
                Temporarily restricted from system access
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-orange-600 bg-orange-100 rounded-lg hover:shadow-xl transition-shadow p-4 sm:p-6">
            <CardHeader className="flex justify-between items-center mb-3">
              <CardTitle className="text-sm font-bold text-orange-700 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-700">
                System Analytics
              </div>
              <p className="text-xs text-orange-600 mt-1">
                View logs and reports
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-blue-600 bg-blue-100 rounded-lg hover:shadow-xl transition-shadow p-4 sm:p-6">
            <CardHeader className="flex justify-between items-center mb-3">
              <CardTitle className="text-sm font-bold text-blue-700 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-700">
                Configuration
              </div>
              <p className="text-xs text-blue-600 mt-1">Application controls</p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder Section */}
        <div className="mt-10">
          <Card className="border border-gray-200 rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Admin Workspace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                This area will be used for managing users, police stations,
                convoy configurations, reports, and system settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
