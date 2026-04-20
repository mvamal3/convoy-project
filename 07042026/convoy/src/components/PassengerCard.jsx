import React from "react";
import { Users, Phone, IdCard } from "lucide-react";

const PassengerCard = ({ passengers }) => {
  if (!Array.isArray(passengers) || passengers.length === 0) {
    return <p className="text-gray-600">No passengers found.</p>;
  }

  // If more than 3 passengers, display table
  if (passengers.length > 3) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-purple-200 rounded-lg shadow">
          <thead className="bg-purple-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-purple-700 border-b">
                S.No
              </th>
              <th className="px-4 py-2 text-left font-semibold text-purple-700 border-b">
                Name
              </th>
              <th className="px-4 py-2 text-left font-semibold text-purple-700 border-b">
                Phone
              </th>
              <th className="px-4 py-2 text-left font-semibold text-purple-700 border-b">
                Gender
              </th>
              <th className="px-4 py-2 text-left font-semibold text-purple-700 border-b">
                Document Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-purple-700 border-b">
                Document ID
              </th>
            </tr>
          </thead>
          <tbody>
            {passengers.map((p, idx) => (
              <tr key={idx} className="hover:bg-purple-50 transition">
                <td className="px-4 py-2 border-b text-gray-700">{idx + 1}</td>
                <td className="px-4 py-2 border-b text-gray-800">
                  {p.passengerName}
                </td>
                <td className="px-4 py-2 border-b text-gray-800">
                  {p.phoneNo}
                </td>
                <td className="px-4 py-2 border-b text-gray-800">{p.gender}</td>
                <td className="px-4 py-2 border-b text-gray-800">
                  {p.docType}
                </td>
                <td className="px-4 py-2 border-b text-gray-800">{p.docId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ≤3 passengers: show as small cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {passengers.map((p, idx) => (
        <div
          key={idx}
          className="border rounded-xl p-4 bg-gray-50 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-purple-700">{idx + 1}.</span>
            <Users className="w-6 h-6 text-gray-600" />
            <p className="font-semibold text-gray-800">{p.passengerName}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
            <Phone className="w-4 h-4" />
            <span>{p.phoneNo}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <IdCard className="w-4 h-4" />
            <span>
              {p.docType} / {p.docId}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PassengerCard;
