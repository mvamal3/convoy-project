import React from "react";

const TodaysCountReport = ({
  convoysToShow,
  role,
  checkpostId,
  specialSummary,
}) => {
  console.log("User Role:", role, "Checkpost ID:", checkpostId);

  const rawData = Array.isArray(convoysToShow) ? convoysToShow : [];

  // ✅ FIX SPECIAL ROW DATA (OVERRIDE WITH SUMMARY)
  const data = rawData.map((c) => {
    const id = Number(c.convey_id);

    if (id >= 100 && id < 200 && specialSummary?.emergency) {
      return {
        ...c,
        approvedTripsCount: specialSummary.emergency.totalTrips,
        touristTripsCount: specialSummary.emergency.touristTrips,
        totalPassengers: specialSummary.emergency.totalPassengers,
        totalForeigners: specialSummary.emergency.totalForeigners,
      };
    }

    if (id >= 200 && specialSummary?.vip) {
      return {
        ...c,
        approvedTripsCount: specialSummary.vip.totalTrips,
        touristTripsCount: specialSummary.vip.touristTrips,
        totalPassengers: specialSummary.vip.totalPassengers,
        totalForeigners: specialSummary.vip.totalForeigners,
      };
    }

    return c;
  });

  // ✅ SPLIT
  const normalConvoys = data.filter((c) => Number(c.convey_id) < 100);
  const emergencyConvoys = data.filter(
    (c) => Number(c.convey_id) >= 100 && Number(c.convey_id) < 200,
  );
  const vipConvoys = data.filter((c) => Number(c.convey_id) >= 200);

  // ================= TOTALS =================

  // 🔵 NORMAL TOTAL
  const normalTotal = {
    touristTrips: 0,
    totalPassengers: 0,
    totalForeigners: 0,
    approvedTrips: 0,
    rejectedTrips: 0,
  };

  normalConvoys.forEach((c) => {
    normalTotal.touristTrips += c.touristTripsCount || 0;
    normalTotal.totalPassengers += c.totalPassengers || 0;
    normalTotal.totalForeigners += c.totalForeigners || 0;
    normalTotal.approvedTrips += c.approvedTripsCount || 0;
    normalTotal.rejectedTrips += c.rejectedTripsCount || 0;
  });

  // 🟣 SPECIAL TOTAL (Emergency + VIP)
  const specialTotal = {
    touristTrips:
      (specialSummary?.emergency?.touristTrips || 0) +
      (specialSummary?.vip?.touristTrips || 0),

    totalPassengers:
      (specialSummary?.emergency?.totalPassengers || 0) +
      (specialSummary?.vip?.totalPassengers || 0),

    totalForeigners:
      (specialSummary?.emergency?.totalForeigners || 0) +
      (specialSummary?.vip?.totalForeigners || 0),

    approvedTrips:
      (specialSummary?.emergency?.totalTrips || 0) +
      (specialSummary?.vip?.totalTrips || 0),

    rejectedTrips: 0,
  };

  // ================= RENDER =================

  const renderRows = (rows, startIndex = 0) =>
    rows.map((c, idx) => (
      <tr key={`${c.convey_id}-${idx}`} className="hover:bg-slate-50">
        <td className="px-4 py-3 text-center font-medium">
          {startIndex + idx + 1}
        </td>

        <td className="px-4 py-3 font-semibold text-slate-900">
          {c.convey_time} — {c.convey_name}
        </td>

        <td className="px-4 py-3 text-center">
          {Number(c.convey_id) >= 100 ? (
            <span className="text-xs font-semibold text-blue-600">
              Special Convoy
            </span>
          ) : c.start_time && c.start_time !== "00:00:00" ? (
            <span className="text-sm font-semibold text-green-700">
              {c.start_time}
            </span>
          ) : (
            <span className="text-xs text-slate-400">Not Started</span>
          )}
        </td>

        <td className="px-4 py-3 text-center">
          <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-100">
            {c.touristTripsCount || 0}
          </span>
        </td>

        <td className="px-4 py-3 text-center">
          <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-100">
            {c.totalPassengers || 0}
          </span>
        </td>

        <td className="px-4 py-3 text-center">
          <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-100">
            {c.totalForeigners || 0}
          </span>
        </td>

        <td className="px-4 py-3 text-center font-medium">
          {c.approvedTripsCount || 0}
        </td>

        <td className="px-4 py-3 text-center">
          <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">
            {c.rejectedTripsCount || 0}
          </span>
        </td>
      </tr>
    ));

  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-white shadow-sm">
      <table className="w-full text-sm text-slate-800">
        {/* HEADER */}
        <thead className="bg-slate-800 text-white text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-center">#</th>
            <th className="px-4 py-3 text-left">Convoy</th>
            <th className="px-4 py-3 text-center">Start</th>
            <th className="px-4 py-3 text-center">Tourist</th>
            <th className="px-4 py-3 text-center">Passengers</th>
            <th className="px-4 py-3 text-center">Foreigners</th>
            <th className="px-4 py-3 text-center">Vehicles</th>
            <th className="px-4 py-3 text-center">Rejected</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {/* NORMAL */}
          {normalConvoys.length > 0 && (
            <>
              <tr className="bg-slate-100 text-slate-700 font-semibold">
                <td colSpan="8" className="text-center py-2">
                  🚗 Normal Convoy
                </td>
              </tr>

              {renderRows(normalConvoys)}

              {/* NORMAL TOTAL */}
              <tr className="bg-blue-50 border-t-2 border-blue-400 font-semibold">
                <td colSpan="3" className="text-center text-blue-900">
                  Normal Total
                </td>
                <td className="text-center">{normalTotal.touristTrips}</td>
                <td className="text-center">{normalTotal.totalPassengers}</td>
                <td className="text-center">{normalTotal.totalForeigners}</td>
                <td className="text-center">{normalTotal.approvedTrips}</td>
                <td className="text-center text-red-600">
                  {normalTotal.rejectedTrips}
                </td>
              </tr>
            </>
          )}

          {/* EMERGENCY */}
          {emergencyConvoys.length > 0 && (
            <>
              <tr className="bg-amber-100 text-amber-800 font-semibold">
                <td colSpan="8" className="text-center py-2">
                  🚨 Emergency Convoy
                </td>
              </tr>

              {renderRows(emergencyConvoys, normalConvoys.length)}
            </>
          )}

          {/* VIP */}
          {vipConvoys.length > 0 && (
            <>
              <tr className="bg-indigo-100 text-indigo-800 font-semibold">
                <td colSpan="8" className="text-center py-2">
                  ⭐ VIP Convoy
                </td>
              </tr>

              {renderRows(
                vipConvoys,
                normalConvoys.length + emergencyConvoys.length,
              )}
            </>
          )}

          {/* SPECIAL TOTAL */}
          <tr className="bg-blue-100 border-t-4 border-blue-500 font-bold text-base">
            <td colSpan="3" className="text-center text-blue-900">
              ⭐ Special Total
            </td>

            <td className="text-center">{specialTotal.touristTrips}</td>
            <td className="text-center">{specialTotal.totalPassengers}</td>
            <td className="text-center">{specialTotal.totalForeigners}</td>
            <td className="text-center">{specialTotal.approvedTrips}</td>
            <td className="text-center text-red-700">
              {specialTotal.rejectedTrips}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TodaysCountReport;
