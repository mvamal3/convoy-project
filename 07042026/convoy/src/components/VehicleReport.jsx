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

const TableSection = ({ title, dataKey, convoys }) => {
  let grandTotal = 0;

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
                    return <td className="border">{val}</td>;
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

const VehicleReport = ({ convoysToShow }) => {
  const govtTotal = convoysToShow.reduce(
    (sum, c) => sum + (c.govtVehicleStats?.Total || 0),
    0,
  );

  const privateTotal = convoysToShow.reduce(
    (sum, c) => sum + (c.privateVehicleStats?.Total || 0),
    0,
  );
  // ✅ Category totals (Govt + Private)
  const categoryTotals = convoysToShow.reduce(
    (totals, c) => {
      const g = c.govtVehicleStats || {};
      const p = c.privateVehicleStats || {};

      const add = (key) => (g[key] || 0) + (p[key] || 0);

      totals.Car += add("Car");
      totals.SUV += add("SUV");
      totals.LMVCargo += add("LMVCargo");
      totals.Van += add("Van");
      totals.PickupTruck += add("PickupTruck");
      totals.Truck += add("Truck");
      totals.HMV += add("HMV");
      totals.Bus += add("Bus");
      totals.Ambulance += add("Ambulance");
      totals.MortuaryVan += add("MortuaryVan");
      totals.WaterTanker += add("WaterTanker");
      totals.OilTanker += add("OilTanker");
      totals.LPGTanker += add("LPGTanker");
      totals.Other += add("Other");

      return totals;
    },
    {
      Car: 0,
      SUV: 0,
      LMVCargo: 0,
      Van: 0,
      PickupTruck: 0,
      Truck: 0,
      HMV: 0,
      Bus: 0,
      Ambulance: 0,
      MortuaryVan: 0,
      WaterTanker: 0,
      OilTanker: 0,
      LPGTanker: 0,
      Other: 0,
    },
  );
  const grandVehicleTotal = govtTotal + privateTotal;
  const totalPassengers = convoysToShow.reduce(
    (sum, c) => sum + (c.totalPassengers || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* GOVT SECTION */}
      <TableSection
        title="A. Movement of Govt Vehicles"
        dataKey="govtVehicleStats"
        convoys={convoysToShow}
      />

      {/* PRIVATE SECTION */}
      <TableSection
        title="B. Movement of Private Vehicles"
        dataKey="privateVehicleStats"
        convoys={convoysToShow}
      />

      {/* SUMMARY */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-center border">
          <thead className="bg-gray-200 font-semibold">
            <tr>
              <th className="border px-3 py-2">TOTAL VEHICLES (A+B)</th>
              <th className="border px-3 py-2">Car</th>
              <th className="border px-3 py-2">SUV</th>
              <th className="border px-3 py-2">LMV Cargo</th>
              <th className="border px-3 py-2">Van</th>
              <th className="border px-3 py-2">Pickup</th>
              <th className="border px-3 py-2">Truck</th>
              <th className="border px-3 py-2">HMV</th>
              <th className="border px-3 py-2">Bus</th>
              <th className="border px-3 py-2">Ambulance</th>
              <th className="border px-3 py-2">Mortuary</th>
              <th className="border px-3 py-2">Water Tanker</th>
              <th className="border px-3 py-2">Oil Tanker</th>
              <th className="border px-3 py-2">LPG Tanker</th>
              <th className="border px-3 py-2">Other</th>
              <th className="border px-3 py-2 bg-yellow-300">TOTAL</th>
            </tr>
          </thead>

          <tbody>
            {/* Govt */}
            <tr className="bg-blue-50 font-medium">
              <td className="border px-3 py-2 text-left">Govt Vehicles</td>

              {Object.keys(categoryTotals).map((k) => (
                <td key={k} className="border">
                  {convoysToShow.reduce(
                    (s, c) => s + (c.govtVehicleStats?.[k] || 0),
                    0,
                  )}
                </td>
              ))}
              <td className="border bg-yellow-100 font-bold">{govtTotal}</td>
            </tr>

            {/* Private */}
            <tr className="bg-green-50 font-medium">
              <td className="border px-3 py-2 text-left">Private Vehicles</td>
              {Object.keys(categoryTotals).map((k) => (
                <td className="border">
                  {convoysToShow.reduce(
                    (s, c) => s + (c.privateVehicleStats?.[k] || 0),
                    0,
                  )}
                </td>
              ))}
              <td className="border bg-yellow-100 font-bold">{privateTotal}</td>
            </tr>

            {/* Grand */}
            <tr className="bg-gray-100 font-bold text-lg">
              <td className="border px-3 py-2 text-left">GRAND TOTAL</td>
              {Object.entries(categoryTotals).map(([k, v]) => (
                <td key={k} className="border">
                  {v}
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
