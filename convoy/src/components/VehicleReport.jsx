import React from "react";

const COLS = [
  { key: "Car", label: "Car" },
  { key: "SUV", label: "SUV" },
  { key: "LMVCargo", label: "LMV Cargo" },
  { key: "Van", label: "Van" },
  { key: "PickupTruck", label: "Pickup" },
  { key: "Truck", label: "Truck" },
  { key: "HMV", label: "HMV" },
  { key: "Bus", label: "Bus" },
  { key: "Ambulance", label: "Ambulance" },
  { key: "MortuaryVan", label: "Mortuary Van" },
  { key: "WaterTanker", label: "Water Tanker" },
  { key: "OilTanker", label: "Oil Tanker" },
  { key: "LPGTanker", label: "LPG Tanker" },
  { key: "Other", label: "Other" },
];

/* ================= COMMON TABLE ================= */
const TableSection = ({ title, dataKey, convoys }) => {
  return (
    <div className="mb-8">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm text-center border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Time</th>
              {COLS.map((c) => (
                <th key={c.key} className="border px-3 py-2">
                  {c.label}
                </th>
              ))}
              <th className="border px-3 py-2 bg-yellow-200">Total</th>
            </tr>
          </thead>

          <tbody>
            {convoys.map((c, i) => {
              const stats = c[dataKey] || {};
              let rowTotal = 0;

              return (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="border px-3 py-2 font-semibold">
                    {c.convey_time}
                  </td>

                  {COLS.map((col) => {
                    const val = stats[col.key] || 0;
                    rowTotal += val;
                    return (
                      <td key={col.key} className="border">
                        {val}
                      </td>
                    );
                  })}

                  <td className="border font-bold bg-yellow-100">{rowTotal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
const VehicleReport = ({ convoysToShow, specialSummary }) => {
  const emergencyStats = specialSummary?.emergency?.vehicleStats || {};
  const vipStats = specialSummary?.vip?.vehicleStats || {};

  const getRowTotal = (stats) =>
    COLS.reduce((sum, col) => sum + (stats[col.key] || 0), 0);

  /* ================= TOTALS ================= */
  const govtTotal = convoysToShow.reduce(
    (sum, c) => sum + (c.govtVehicleStats?.Total || 0),
    0,
  );

  const privateTotal = convoysToShow.reduce(
    (sum, c) => sum + (c.privateVehicleStats?.Total || 0),
    0,
  );

  const categoryTotals = convoysToShow.reduce(
    (totals, c) => {
      const g = c.govtVehicleStats || {};
      const p = c.privateVehicleStats || {};

      COLS.forEach(({ key }) => {
        totals[key] += (g[key] || 0) + (p[key] || 0);
      });

      return totals;
    },
    Object.fromEntries(COLS.map((c) => [c.key, 0])),
  );

  const grandVehicleTotal = govtTotal + privateTotal;

  const totalPassengers = convoysToShow.reduce(
    (sum, c) => sum + (c.totalPassengers || 0),
    0,
  );

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* GOVT */}
      <TableSection
        title="A. Movement of Govt Vehicles"
        dataKey="govtVehicleStats"
        convoys={convoysToShow}
      />

      {/* PRIVATE */}
      <TableSection
        title="B. Movement of Private Vehicles"
        dataKey="privateVehicleStats"
        convoys={convoysToShow}
      />

      {/* 🔥 SPECIAL CONVOY */}
      {specialSummary && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-2">
            C. Special Convoy Vehicles
          </h2>

          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm text-center border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">Type</th>
                  {COLS.map((c) => (
                    <th key={c.key} className="border px-3 py-2">
                      {c.label}
                    </th>
                  ))}
                  <th className="border px-3 py-2 bg-yellow-200">Total</th>
                </tr>
              </thead>

              <tbody>
                {/* Emergency */}
                <tr className="bg-red-50">
                  <td className="border px-3 py-2 font-semibold">Emergency</td>
                  {COLS.map((col) => (
                    <td key={col.key} className="border">
                      {emergencyStats[col.key] || 0}
                    </td>
                  ))}
                  <td className="border font-bold bg-yellow-100">
                    {getRowTotal(emergencyStats)}
                  </td>
                </tr>

                {/* VIP */}
                <tr className="bg-purple-50">
                  <td className="border px-3 py-2 font-semibold">VIP</td>
                  {COLS.map((col) => (
                    <td key={col.key} className="border">
                      {vipStats[col.key] || 0}
                    </td>
                  ))}
                  <td className="border font-bold bg-yellow-100">
                    {getRowTotal(vipStats)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-center border">
          <thead className="bg-gray-200 font-semibold">
            <tr>
              <th className="border px-3 py-2">TOTAL VEHICLES (A+B)</th>
              {COLS.map((c) => (
                <th key={c.key} className="border px-3 py-2">
                  {c.label}
                </th>
              ))}
              <th className="border px-3 py-2 bg-yellow-300">TOTAL</th>
            </tr>
          </thead>

          <tbody>
            {/* Govt */}
            <tr className="bg-blue-50 font-medium">
              <td className="border px-3 py-2 text-left">Govt Vehicles</td>
              {COLS.map((col) => (
                <td key={col.key} className="border">
                  {convoysToShow.reduce(
                    (s, c) => s + (c.govtVehicleStats?.[col.key] || 0),
                    0,
                  )}
                </td>
              ))}
              <td className="border bg-yellow-100 font-bold">{govtTotal}</td>
            </tr>

            {/* Private */}
            <tr className="bg-green-50 font-medium">
              <td className="border px-3 py-2 text-left">Private Vehicles</td>
              {COLS.map((col) => (
                <td key={col.key} className="border">
                  {convoysToShow.reduce(
                    (s, c) => s + (c.privateVehicleStats?.[col.key] || 0),
                    0,
                  )}
                </td>
              ))}
              <td className="border bg-yellow-100 font-bold">{privateTotal}</td>
            </tr>

            {/* Grand */}
            <tr className="bg-gray-100 font-bold text-lg">
              <td className="border px-3 py-2 text-left">GRAND TOTAL</td>
              {COLS.map((col) => (
                <td key={col.key} className="border">
                  {categoryTotals[col.key]}
                </td>
              ))}
              <td className="border bg-yellow-300">{grandVehicleTotal}</td>
            </tr>
          </tbody>
        </table>

        <div className="p-3 text-sm bg-gray-50 border-t">
          <strong>Total Passengers:</strong> {totalPassengers}
        </div>
      </div>
    </div>
  );
};

export default VehicleReport;
