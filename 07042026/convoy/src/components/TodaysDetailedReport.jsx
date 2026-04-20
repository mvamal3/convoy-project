import React from "react";

const TodaysDetailedReport = ({ convoysToShow, grandTotal }) => {
  //console.log("vehivcle static", grandTotal.vehicle);

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full border text-sm text-gray-800">
          <thead className="bg-blue-100 text-xs uppercase text-blue-900">
            <tr>
              <th className="border px-3 py-2 w-12">#</th>
              <th className="border px-3 py-2 w-56">Convoy</th>
              <th className="border px-3 py-2 text-center">Start Time</th>
              <th className="border px-3 py-2 text-center">Approve Trips</th>
              <th className="border px-3 py-2 text-center">Tourist Trips</th>
              <th className="border px-3 py-2">Passenger Statistics</th>
              <th className="border px-3 py-2 text-center">Total Foreigners</th>
              <th className="border px-3 py-2">Vehicle Statistics</th>
              <th className="border px-3 py-2">Rejected Trip</th>
              <th className="border px-3 py-2">Pending Trip</th>
            </tr>
          </thead>

          <tbody>
            {convoysToShow.map((c, idx) => (
              <tr key={c.convey_id} className="hover:bg-gray-50">
                <td className="border px-3 py-2 text-center font-semibold">
                  {idx + 1}
                </td>
                <td className="border px-3 py-2 font-semibold text-blue-700">
                  {c.convey_time} — {c.convey_name}
                </td>
                <td className="border px-3 py-2 text-center">
                  {c.start_time || c.end_time ? (
                    <div className="inline-flex items-center gap-2 text-xs font-medium">
                      <span className="text-green-700">
                        🟢 {c.start_time ?? "--:--"}
                      </span>
                      {/* <span className="text-gray-400">→</span>
                      <span className="text-red-700">
                        🔴 {c.end_time ?? "--:--"}
                      </span> */}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Not Started</span>
                  )}
                </td>
                <td className="border px-3 py-2 text-center">
                  <span className="inline-flex min-w-[28px] justify-center rounded-md bg-indigo-50 px-2 py-0.5 text-sm font-semibold text-indigo-700">
                    {c.approvedTripsCount}
                  </span>
                </td>
                <td className="border px-3 py-2 text-center">
                  <span className="inline-flex min-w-[28px] justify-center rounded-md bg-green-50 px-2 py-0.5 text-sm font-semibold text-green-700">
                    {c.touristTripsCount || 0}
                  </span>
                </td>

                <td className="border px-3 py-2">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="font-semibold">
                      Total: {c.totalPassengers}
                    </span>
                    <span>👨 Male {c.totalMale}</span>
                    <span>👩 Female {c.totalFemale}</span>
                    <span>🧒 Child {c.totalChild}</span>
                  </div>
                </td>
                <td className="border px-3 py-2 text-center">
                  <span className="inline-flex min-w-[28px] justify-center rounded-md bg-purple-50 px-2 py-0.5 text-sm font-semibold text-purple-700">
                    🌍 {c.totalForeigners || 0}
                  </span>
                </td>

                <span>🚗 LMV: {c.vehicleStats?.LMV || 0}</span>
                <span>🚐 LMV Cargo: {c.vehicleStats?.LMVCargo || 0}</span>
                <span>🚚 Truck: {c.vehicleStats?.Truck || 0}</span>

                <span>🚰 Water Tanker: {c.vehicleStats?.WaterTanker || 0}</span>
                <span>🛢️ Oil Tanker: {c.vehicleStats?.OilTanker || 0}</span>
                <span>🔥 LPG Truck: {c.vehicleStats?.LPGTruck || 0}</span>

                <span>🚌 Govt Bus: {c.vehicleStats?.BusGovernment || 0}</span>
                <span>
                  🚌 Commercial Bus: {c.vehicleStats?.BusCommercial || 0}
                </span>

                <span>🚑 Ambulance: {c.vehicleStats?.Ambulance || 0}</span>

                <span>🏛️ Govt: {c.vehicleStats?.Government || 0}</span>
                <span>🚖 Commercial: {c.vehicleStats?.Commercial || 0}</span>
                <span>🚗 Private: {c.vehicleStats?.Private || 0}</span>

                <td className="border px-3 py-2 text-center">
                  <span className="inline-flex min-w-[28px] justify-center rounded-md bg-red-50 text-red-700">
                    {c.rejectedTripsCount}
                  </span>
                </td>

                <td className="border px-3 py-2 text-center">
                  <span className="inline-flex min-w-[28px] justify-center rounded-md bg-amber-50 text-amber-700">
                    {c.verificationPendingCount}
                  </span>
                </td>
              </tr>
            ))}

            <tr className="bg-yellow-100 font-bold">
              <td className="border px-3 py-2 text-center" colSpan={2}>
                GRAND TOTAL
              </td>

              {/* Start–Close Time */}
              <td className="border px-3 py-2 text-center text-gray-500">—</td>

              {/* Approved Trips */}
              <td className="border px-3 py-2 text-center">
                {grandTotal.approvedTrips}
              </td>

              {/* Tourist Trips ✅ */}
              <td className="border px-3 py-2 text-center">
                {grandTotal.touristTrips || 0}
              </td>

              {/* Passenger Statistics */}
              <td className="border px-3 py-2">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span>Total: {grandTotal.totalPassengers}</span>
                  <span>👨 Male {grandTotal.totalMale}</span>
                  <span>👩 Female {grandTotal.totalFemale}</span>
                  <span>🧒 Child {grandTotal.totalChild}</span>
                  <span>🌍 Foreigners {grandTotal.totalForeigners}</span>
                </div>
              </td>
              {/* Total Foreigners */}
              <td className="border px-3 py-2 text-center">
                🌍 {grandTotal.totalForeigners}
              </td>

              {/* Vehicle Statistics */}
              <td className="border px-3 py-2">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span>🚗 LMV: {grandTotal.vehicle.LMV}</span>
                  <span>🚑 Ambulance: {grandTotal.vehicle.Ambulance}</span>
                  <span>🛻 Pickup: {grandTotal.vehicle.PickupTruck}</span>
                  <span>🛢️ Oil Tanker: {grandTotal.vehicle.OilTanker}</span>
                  <span>🔥 LPG Tanker: {grandTotal.vehicle.LPGTruck}</span>
                  <span>🏛️ Govt: {grandTotal.vehicle.Government}</span>
                  <span>🚖 Commercial: {grandTotal.vehicle.Commercial}</span>
                  <span>🚗 Private: {grandTotal.vehicle.Private}</span>
                </div>
              </td>

              {/* Rejected */}
              <td className="border px-3 py-2 text-center">
                {grandTotal.rejectedTrips}
              </td>

              {/* Pending */}
              <td className="border px-3 py-2 text-center">
                {grandTotal.verificationPending}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TodaysDetailedReport;
