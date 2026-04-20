import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCheckoutReport } from "@/contexts/GetApi";
import { useReactToPrint } from "react-to-print";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { sha256 } from "js-sha256";
import { formatDateDDMMYY } from "@/utils/dateUtils";

/* ---------- Stable stringify (for hash) ---------- */
function stableStringify(value) {
  const seen = new WeakSet();
  const replacer = (v) => {
    if (v === null) return null;
    if (
      typeof v === "number" ||
      typeof v === "string" ||
      typeof v === "boolean"
    )
      return v;
    if (Array.isArray(v)) return v.map(replacer);
    if (typeof v === "object") {
      if (seen.has(v)) return;
      seen.add(v);
      const keys = Object.keys(v).sort();
      const obj = {};
      keys.forEach((k) => (obj[k] = replacer(v[k])));
      return obj;
    }
    return undefined;
  };
  return JSON.stringify(replacer(value));
}

const GenerateCheckoutReport = () => {
  const { conveyId, checkpostId } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const contentRef = useRef();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hashValue, setHashValue] = useState("");

  // 🔢 Summary states
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [totalMale, setTotalMale] = useState(0);
  const [totalFemale, setTotalFemale] = useState(0);
  const [totalChild, setTotalChild] = useState(0);
  const [vehicleCounts, setVehicleCounts] = useState({
    Government: 0,
    Commercial: 0,
    Private: 0,
    Ambulance: 0,
  });

  // 🕒 Time states
  const [reportGeneratedOn, setReportGeneratedOn] = useState("");
  const [checkoutStart, setCheckoutStart] = useState("");
  const [checkoutClose, setCheckoutClose] = useState("");

  /* ================= FETCH REPORT ================= */
  useEffect(() => {
    const fetchReport = async () => {
      if (!accessToken) return;

      try {
        const res = await getCheckoutReport(
          accessToken,
          Number(conveyId),
          Number(checkpostId),
        );
        console.log("reposnce", res);

        if (!res?.success) throw new Error("Failed to fetch checkout report");

        const rowsData = res.data?.rows || [];
        const summary = res.data?.summary || {};

        setRows(rowsData);

        // Summary
        setTotalPassengers(summary.totalPassengers || 0);
        setTotalMale(summary.totalMale || 0);
        setTotalFemale(summary.totalFemale || 0);
        setTotalChild(summary.totalChild || 0);
        setVehicleCounts(summary.vehicleCounts || {});

        // Hash
        setHashValue(sha256(stableStringify(rowsData)));

        // Report generated time
        setReportGeneratedOn(res.data?.reportGeneratedAt || "");

        // Checkout start & close
        const firstRow = rowsData[0];
        setCheckoutStart(
          firstRow?.approveTrip?.arrdate && firstRow?.approveTrip?.arrtime
            ? `${firstRow.approveTrip.arrdate} ${firstRow.approveTrip.arrtime}`
            : "NA",
        );

        setCheckoutClose(
          firstRow?.checkoutdate && firstRow?.checkouttime
            ? `${firstRow.checkoutdate} ${firstRow.checkouttime}`
            : "NA",
        );
      } catch (err) {
        console.error("Checkout report error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [accessToken, conveyId, checkpostId]);

  /* ================= PRINT ================= */
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Checkout Report",
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      body { -webkit-print-color-adjust: exact !important; }
      table, th, td { border: 1px solid #000 !important; border-collapse: collapse; }
      th { background-color: #2563eb !important; color: #fff !important; }
      .no-print { display: none !important; }
    `,
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-600">Generating report...</div>
      </DashboardLayout>
    );
  }

  if (!rows.length) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-600">No checkout data found.</div>
      </DashboardLayout>
    );
  }

  const first = rows[0];

  return (
    <DashboardLayout>
      <div className="p-4">
        {/* ===== ACTION BAR ===== */}
        <div className="no-print flex justify-end gap-3 mb-4">
          <Button onClick={handlePrint} className="bg-blue-600 text-white">
            🖨️ Print Report
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            ⬅ Back
          </Button>
        </div>

        {/* ===== PRINTABLE ===== */}
        <div ref={contentRef} className="bg-white p-6 border border-gray-300">
          {/* ===== HEADER ===== */}
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-2xl font-extrabold text-blue-800 uppercase">
              Convoy Management System
            </h1>
            <h2 className="text-lg font-semibold">Checkout Report Summary</h2>

            <p className="text-sm italic">
              <b>Checkpost:</b> {first.checkpostLocation?.location}
            </p>

            <p className="text-sm">
              <b>Date:</b> {first.checkoutdate} | <b>Convoy:</b>{" "}
              {first.convey?.convey_name} ({first.convey?.convey_time})
            </p>

            <p className="text-sm mt-1">
              <b>Checkout Start:</b> {checkoutStart} | <b>Checkout Close:</b>{" "}
              {checkoutClose}
            </p>

            <p className="text-xs text-gray-600">
              <b>Report Generated On:</b> {reportGeneratedOn}
            </p>
          </div>

          {/* ===== SUMMARY CARDS ===== */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-sm font-medium">
            {/* Vehicles */}
            <div className="bg-blue-50 border border-blue-200 p-3 text-center">
              <div className="font-semibold text-blue-900">🚗 Vehicles</div>
              <div className="text-2xl font-bold text-blue-700">
                {(vehicleCounts.Government || 0) +
                  (vehicleCounts.Commercial || 0) +
                  (vehicleCounts.Private || 0) +
                  (vehicleCounts.Ambulance || 0)}
              </div>
              <div className="text-xs mt-1">
                GOVT: {vehicleCounts.Government} | COMM:{" "}
                {vehicleCounts.Commercial} | PVT: {vehicleCounts.Private}|
                Ambulance: {vehicleCounts.Ambulance || 0}
              </div>
            </div>

            {/* Passengers */}
            <div className="bg-yellow-50 border border-yellow-200 p-3 text-center">
              <div className="font-semibold text-yellow-900">🧍 Passengers</div>
              <div className="text-2xl font-bold text-yellow-700">
                {totalPassengers}
              </div>
              <div className="text-xs mt-1">
                Male👨 {totalMale} | Female👩 {totalFemale} | Child 🧒{" "}
                {totalChild}
              </div>
            </div>

            {/* Trips */}
            <div className="bg-purple-50 border border-purple-200 p-3 text-center">
              <div className="font-semibold text-purple-900">📦 Trips</div>
              <div className="text-2xl font-bold text-purple-700">
                {rows.length}
              </div>
            </div>
          </div>

          {/* ===== TABLE ===== */}
          <table className="w-full border border-black border-collapse text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border border-black px-2 py-1">#</th>
                <th className="border border-black px-2 py-1">Trip ID</th>
                <th className="border border-black px-2 py-1">Route</th>
                <th className="border border-black px-2 py-1">Vehicle</th>
                <th className="border border-black px-2 py-1">Driver</th>
                <th className="border border-black px-2 py-1">
                  Approve details
                </th>
                <th className="border border-black px-2 py-1">
                  Arrival details
                </th>
                <th className="border border-black px-2 py-1">Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-100">
                  <td className="border border-black px-2 py-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-black px-2 py-1">{r.tId}</td>
                  <td className="border border-black px-2 py-1">
                    {r.trip?.originLocation?.location} →{" "}
                    {r.trip?.destinationLocation?.location}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {r.trip?.vehicle?.vNum} ({r.trip?.vehicle?.vCat})
                  </td>
                  <td className="border border-black px-2 py-1">
                    {r.trip?.driver?.dFirstName} {r.trip?.driver?.dLastName}
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    {formatDateDDMMYY(r.approveTrip?.arrdate)} <br />
                    <b>{r.approveTrip?.arrtime}</b>
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    {formatDateDDMMYY(r.checkoutdate)} <br />
                    <b>{r.checkouttime}</b>
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    {r.status === 1 ? "Checked OK" : "Issue"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* HASH */}
          <div className="text-xs mt-4">
            <b>Hash:</b> {hashValue}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GenerateCheckoutReport;
