import React from "react";

const TodaysDetailedReport = ({
  convoysToShow,
  grandTotal,
  role,
  checkpostId,
}) => {
  const isSPView = role?.toLowerCase() === "sp" && !checkpostId;
  console.log("User Role:", role, "Checkpost ID:", checkpostId);

  // split convoys into two groups
  const jiratangConvoys = convoysToShow.slice(0, 4);
  const middleStraitConvoys = convoysToShow.slice(4);
  const renderRows = (rows, startIndex = 0) =>
    rows.map((c, idx) => (
      <tr key={c.convey_id} className="hover:bg-slate-50">
        <td className="px-4 py-3 text-center font-medium">
          {startIndex + idx + 1}
        </td>

        <td className="px-4 py-3 font-semibold text-slate-900">
          {c.convey_time} — {c.convey_name}
        </td>

        <td className="px-4 py-3 text-center">
          {c.start_time ? (
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
    <div className="w-full overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <table className="w-full text-sm text-slate-800">
        {/* HEADER */}
        <thead className="bg-gray-200 text-gray-700 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 text-center w-12">#</th>
            <th className="px-4 py-3 text-left">Convoy</th>
            <th className="px-4 py-3 text-center">Start Time</th>
            <th className="px-4 py-3 text-center">Tourist Trips</th>
            <th className="px-4 py-3 text-center">Passengers</th>
            <th className="px-4 py-3 text-center">Foreigners</th>
            <th className="px-4 py-3 text-center">Vehicles</th>
            <th className="px-4 py-3 text-center">Rejected</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200">
          {isSPView ? (
            <>
              {/* Section */}
              <tr>
                <td
                  colSpan="8"
                  className="bg-slate-100 text-slate-700 font-semibold text-center py-2"
                >
                  Jiratang Checkpost
                </td>
              </tr>
              {renderRows(jiratangConvoys)}

              <tr>
                <td
                  colSpan="8"
                  className="bg-slate-100 text-slate-700 font-semibold text-center py-2"
                >
                  Middle Strait Checkpost
                </td>
              </tr>
              {renderRows(middleStraitConvoys, 4)}
            </>
          ) : (
            renderRows(convoysToShow)
          )}

          {/* TOTAL ROW */}
          <tr className="bg-slate-100 font-semibold">
            <td colSpan={3} className="px-4 py-3 text-center text-slate-900">
              TOTAL
            </td>
            <td className="px-4 py-3 text-center">
              {grandTotal.touristTrips || 0}
            </td>
            <td className="px-4 py-3 text-center">
              {grandTotal.totalPassengers}
            </td>
            <td className="px-4 py-3 text-center">
              {grandTotal.totalForeigners || 0}
            </td>
            <td className="px-4 py-3 text-center">
              {grandTotal.approvedTrips}
            </td>
            <td className="px-4 py-3 text-center text-red-700">
              {grandTotal.rejectedTrips}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TodaysDetailedReport;
