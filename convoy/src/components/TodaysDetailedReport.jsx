import React from "react";

const TodaysDetailedReport = ({
  convoysToShow,
  grandTotal,
  specialSummary,
}) => {
  //console.log("vehivcle static", grandTotal.vehicle);
  console.log("SPECIAL SUMMARY:", specialSummary);

  const data = (convoysToShow || []).map((c) => {
    const id = Number(c.convey_id);

    // 🚨 Emergency
    if (id >= 100 && id < 200 && specialSummary?.emergency) {
      return {
        ...c,
        touristTripsCount: specialSummary.emergency.touristTrips,
        totalPassengers: specialSummary.emergency.totalPassengers,
        totalForeigners: specialSummary.emergency.totalForeigners,

        // ✅ ADD THIS
        totalMale: specialSummary.emergency.totalMale || 0,
        totalFemale: specialSummary.emergency.totalFemale || 0,
        totalChild: specialSummary.emergency.totalChild || 0,

        vehicleStats: specialSummary.emergency.vehicleStats || {},

        isSpecial: true,
      };
    }

    // ⭐ VIP
    if (id >= 200 && specialSummary?.vip) {
      return {
        ...c,
        touristTripsCount: specialSummary.vip.touristTrips,
        totalPassengers: specialSummary.vip.totalPassengers,
        totalForeigners: specialSummary.vip.totalForeigners,

        // ✅ ADD THIS
        totalMale: specialSummary.vip.totalMale || 0,
        totalFemale: specialSummary.vip.totalFemale || 0,
        totalChild: specialSummary.vip.totalChild || 0,

        vehicleStats: specialSummary.vip.vehicleStats || {},

        isSpecial: true,
      };
    }

    return { ...c, isSpecial: false };
  });

  const normalConvoys = data.filter((c) => !c.isSpecial);

  const totals = {
    touristTrips: 0,
    totalPassengers: 0,
    totalForeigners: 0,
    approvedTrips: 0,
    rejectedTrips: 0,

    // ✅ ADD THIS (prevents crash)
    totalMale: 0,
    totalFemale: 0,
    totalChild: 0,

    vehicle: {
      LMV: 0,
      LMVCargo: 0,
      Truck: 0,
      WaterTanker: 0,
      OilTanker: 0,
      LPGTruck: 0,
      BusGovernment: 0,
      BusCommercial: 0,
      Ambulance: 0,
      PickupTruck: 0,
      Government: 0,
      Commercial: 0,
      Private: 0,
    },
  };

  // 👉 NORMAL ONLY
  normalConvoys.forEach((c) => {
    totals.touristTrips += c.touristTripsCount || 0;
    totals.totalPassengers += c.totalPassengers || 0;
    totals.totalForeigners += c.totalForeigners || 0;
    totals.approvedTrips += c.approvedTripsCount || 0;
    totals.rejectedTrips += c.rejectedTripsCount || 0;

    // ✅ ADD THIS
    totals.totalMale += c.totalMale || 0;
    totals.totalFemale += c.totalFemale || 0;
    totals.totalChild += c.totalChild || 0;

    // ✅ ADD VEHICLE TOTALS
    const v = c.vehicleStats || {};
    Object.keys(totals.vehicle).forEach((key) => {
      totals.vehicle[key] += v[key] || 0;
    });
  });

  // 👉 ADD SPECIAL (FROM SUMMARY ONLY)
  if (specialSummary?.emergency) {
    totals.touristTrips += specialSummary.emergency.touristTrips;
    totals.totalPassengers += specialSummary.emergency.totalPassengers;
    totals.totalForeigners += specialSummary.emergency.totalForeigners;
    totals.approvedTrips += specialSummary.emergency.totalTrips;

    totals.totalMale += specialSummary.emergency.totalMale || 0;
    totals.totalFemale += specialSummary.emergency.totalFemale || 0;
    totals.totalChild += specialSummary.emergency.totalChild || 0;

    // ✅ ADD EMERGENCY VEHICLE TOTALS
    if (specialSummary.emergency.vehicleStats) {
      Object.keys(totals.vehicle).forEach((key) => {
        totals.vehicle[key] += specialSummary.emergency.vehicleStats[key] || 0;
      });
    }
  }

  if (specialSummary?.vip) {
    totals.touristTrips += specialSummary.vip.touristTrips;
    totals.totalPassengers += specialSummary.vip.totalPassengers;
    totals.totalForeigners += specialSummary.vip.totalForeigners;
    totals.approvedTrips += specialSummary.vip.totalTrips;

    totals.totalMale += specialSummary.vip.totalMale || 0;
    totals.totalFemale += specialSummary.vip.totalFemale || 0;
    totals.totalChild += specialSummary.vip.totalChild || 0;

    // ✅ ADD VIP VEHICLE TOTALS
    if (specialSummary.vip.vehicleStats) {
      Object.keys(totals.vehicle).forEach((key) => {
        totals.vehicle[key] += specialSummary.vip.vehicleStats[key] || 0;
      });
    }
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full border text-sm text-gray-800">
          <thead className="bg-blue-100 text-xs uppercase text-blue-900">
            <tr>
              <th className="border px-3 py-2 w-12">#</th>
              <th className="border px-3 py-2 w-56">Convoy</th>
              <th className="border px-3 py-2 text-center">Start Time</th>
              <th className="border px-3 py-2 text-center">Tourist Trips</th>
              <th className="border px-3 py-2">Passenger Statistics</th>
              <th className="border px-3 py-2 text-center">Total Foreigners</th>
              <th className="border px-3 py-2">Vehicle Statistics</th>
              <th className="border px-3 py-2">Rejected Trip</th>
            </tr>
          </thead>

          <tbody>
            {data.map((c, idx) => (
              <tr key={c.convey_id} className="hover:bg-gray-50">
                <td className="border px-3 py-2 text-center font-semibold">
                  {idx + 1}
                </td>
                <td className="border px-3 py-2 font-semibold text-blue-700">
                  {c.convey_time} — {c.convey_name}
                </td>
                <td className="border px-3 py-2 text-center">
                  {c.isSpecial ? (
                    <span className="text-blue-600 text-xs font-semibold">
                      Special Convoy
                    </span>
                  ) : c.start_time || c.end_time ? (
                    <div className="inline-flex items-center gap-2 text-xs font-medium">
                      <span className="text-green-700">
                        🟢 {c.start_time ?? "--:--"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Not Started</span>
                  )}
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
                    <span>👨 Male {c.totalMale || 0}</span>
                    <span>👩 Female {c.totalFemale || 0}</span>
                    <span>🧒 Child {c.totalChild || 0}</span>
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
              </tr>
            ))}

            <tr className="bg-yellow-100 font-bold">
              <td className="border px-3 py-2 text-center" colSpan={2}>
                GRAND TOTAL
              </td>

              {/* Start–Close Time */}
              <td className="border px-3 py-2 text-center text-gray-500">—</td>

              {/* Approved Trips */}

              {/* Tourist Trips ✅ */}
              <td className="border px-3 py-2 text-center">
                {totals.touristTrips || 0}
              </td>

              {/* Passenger Statistics */}
              <td className="border px-3 py-2">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span>Total: {totals.totalPassengers}</span>
                  <span>👨 Male {totals.totalMale || 0}</span>
                  <span>👩 Female {totals.totalFemale || 0}</span>
                  <span>🧒 Child {totals.totalChild || 0}</span>
                  <span>🌍 Foreigners {totals.totalForeigners}</span>
                </div>
              </td>
              {/* Total Foreigners */}
              <td className="border px-3 py-2 text-center">
                🌍 {totals.totalForeigners}
              </td>

              {/* Vehicle Statistics */}
              <td className="border px-3 py-2">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span>🚗 LMV: {totals.vehicle.LMV}</span>
                  <span>🚑 Ambulance: {totals.vehicle.Ambulance}</span>
                  <span>🛻 Pickup: {totals.vehicle.PickupTruck}</span>
                  <span>🛢️ Oil Tanker: {totals.vehicle.OilTanker}</span>
                  <span>🔥 LPG Tanker: {totals.vehicle.LPGTruck}</span>
                  <span>🏛️ Govt: {totals.vehicle.Government}</span>
                  <span>🚖 Commercial: {totals.vehicle.Commercial}</span>
                  <span>🚗 Private: {totals.vehicle.Private}</span>
                </div>
              </td>

              {/* Rejected */}
              <td className="border px-3 py-2 text-center">
                {totals.rejectedTrips}
              </td>

              {/* Pending */}
              <td className="border px-3 py-2 text-center">
                {totals.verificationPending}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TodaysDetailedReport;
