import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const TripTableWithPagination = ({ tripList, serverTime }) => {
  const itemsPerPage = 2;
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Helper to normalize dates (to YYYY-MM-DD, Kolkata timezone)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
  };

  const todayDate = normalizeDate(serverTime);

  // ✅ Sort trips by date ascending
  const sortedTrips = useMemo(() => {
    return [...tripList].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [tripList]);

  // ✅ Split into today & upcoming
  const todayTrips = sortedTrips.filter(
    (trip) => normalizeDate(trip.date) === todayDate
  );
  const upcomingTrips = sortedTrips.filter(
    (trip) => normalizeDate(trip.date) > todayDate
  );

  // ✅ Combine both lists (today first, then upcoming)
  const allTrips = [...todayTrips, ...upcomingTrips];

  // ✅ Pagination logic
  const totalPages = Math.ceil(allTrips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTrips = allTrips.slice(startIndex, startIndex + itemsPerPage);

  // ✅ Label logic based on first trip on current page
  let label = "Upcoming Trips";
  if (currentTrips.some((trip) => normalizeDate(trip.date) === todayDate)) {
    label = "Today Trips";
  }

  return (
    <>
      <table className="min-w-full table-auto border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100 sticky top-0">
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              SNO
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              Date
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              Trip ID
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              View
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {currentTrips.length > 0 ? (
            currentTrips.map((trip, index) => (
              <tr
                key={trip.tId || index}
                className={`hover:bg-gray-50 transition-colors duration-150 ${
                  normalizeDate(trip.date) === todayDate ? "bg-green-50" : ""
                }`}
              >
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  {normalizeDate(trip.date)}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm truncate max-w-xs">
                  {trip.tId || "N/A"}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  <button
                    className="text-blue-600 underline hover:text-blue-800"
                    onClick={() => navigate(`/ManageTrip/ViewTrip/${trip.tId}`)}
                  >
                    View Application
                  </button>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => navigate(`/CitizenEditTrip/${trip.tId}`)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center p-4 text-gray-500">
                No {label.toLowerCase()} available.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ✅ Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-3 space-x-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default TripTableWithPagination;
