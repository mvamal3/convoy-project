import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCheckoutReports } from "@/contexts/GetApi";
import { useLocation } from "react-router-dom";

const CheckoutPrint = () => {
  const { accessToken, user } = useAuth();
  const [trips, setTrips] = useState([]);
  const location = useLocation();

  // ✅ Receive filters from previous page
  const { filteredDate, filteredConvey } = location.state || {};

  // ✅ Fetch filtered data
  const fetchTripList = useCallback(async () => {
    if (accessToken) {
      const data = await getCheckoutReports(
        accessToken,
        user.checkpostid,
        1,
        filteredConvey || "",
      );

      const tripList = Array.isArray(data?.data?.data)
        ? data.data.data
            .filter((trip) =>
              filteredDate ? trip.checkoutdate === filteredDate : true,
            )
            .map((trip, index) => {
              const approveConvey = trip.approveDetails?.convey;
              return {
                tId: trip.tId || index,
                approveDate: trip.approveDetails?.arrdate || "N/A",
                approveTime: trip.approveDetails?.arrtime || "",
                approveConvey: approveConvey
                  ? `${approveConvey.convey_time} (${approveConvey.convey_name})`
                  : "N/A",
                approveCheckpost:
                  trip.approveDetails?.checkpostDetails?.location || "N/A",
                checkoutDate: trip.checkoutdate || "N/A",
                checkoutTime: trip.checkouttime || "",
                checkoutCheckpost: trip.checkpostDetails?.location || "N/A",
                checkoutRemarks: trip.remarks || "N/A",
              };
            })
        : [];

      setTrips(tripList);

      // ✅ Auto print once data loads
      setTimeout(() => window.print(), 800);
    }
  }, [accessToken, filteredConvey, filteredDate, user.checkpostid]);

  useEffect(() => {
    fetchTripList();
  }, [fetchTripList]);

  return (
    <DashboardLayout>
      <div id="printable-section" className="p-8 bg-white text-black">
        {/* Report Header */}
        <div className="text-center mb-6">
          {/* Optional logo area */}
          {/* <img src="/logo.png" alt="Logo" className="mx-auto mb-2 w-16 h-16" /> */}
          <h1 className="text-2xl font-bold uppercase">Checkout Trip Report</h1>
          <p className="text-sm text-gray-700 mt-1">
            Checkpost ID: <strong>{user?.checkpostid || "N/A"}</strong>
          </p>
          {filteredDate && (
            <p className="text-sm text-gray-700">
              Date: <strong>{filteredDate}</strong>
            </p>
          )}
          {filteredConvey && (
            <p className="text-sm text-gray-700">
              Convey ID: <strong>{filteredConvey}</strong>
            </p>
          )}
          <p className="text-sm text-gray-700 mt-1">
            Generated On: <strong>{new Date().toLocaleString("en-GB")}</strong>
          </p>
          <hr className="border-t border-gray-400 mt-3" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-500 text-sm text-center">
            <thead className="bg-gray-100 uppercase">
              <tr>
                <th className="px-3 py-2 border">S.No</th>
                <th className="px-3 py-2 border">Trip ID</th>
                <th className="px-3 py-2 border">Approve Date & Time</th>
                <th className="px-3 py-2 border">Approve Convey</th>
                <th className="px-3 py-2 border">Checkout Date & Time</th>
                <th className="px-3 py-2 border">Checkout Checkpost</th>
                <th className="px-3 py-2 border">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {trips.length > 0 ? (
                trips.map((row, i) => (
                  <tr key={row.tId} className="border">
                    <td className="border px-3 py-2">{i + 1}</td>
                    <td className="border px-3 py-2">{row.tId}</td>
                    <td className="border px-3 py-2">
                      {row.approveDate} {row.approveTime}
                    </td>
                    <td className="border px-3 py-2">{row.approveConvey}</td>
                    <td className="border px-3 py-2">
                      {row.checkoutDate} {row.checkoutTime}
                    </td>
                    <td className="border px-3 py-2">
                      {row.checkoutCheckpost}
                    </td>
                    <td className="border px-3 py-2">{row.checkoutRemarks}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-4 text-gray-500 border"
                  >
                    No trip data available for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Print CSS Styles */}
        <style>
          {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm;
            }

            body * {
              visibility: hidden;
            }

            #printable-section, #printable-section * {
              visibility: visible;
            }

            #printable-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: #fff !important;
            }

            /* ✅ Table borders */
            table {
              border-collapse: collapse !important;
              width: 100% !important;
              font-size: 12px !important;
            }

            th, td {
              border: 1px solid #000 !important;
              padding: 6px 8px !important;
              text-align: center !important;
              color: #000 !important;
            }

            th {
              background-color: #f0f0f0 !important;
              font-weight: bold !important;
            }

            tr {
              page-break-inside: avoid !important;
            }

            /* ✅ Hide dashboard UI elements */
            header, nav, aside, button {
              display: none !important;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          `}
        </style>
      </div>
    </DashboardLayout>
  );
};

export default CheckoutPrint;
