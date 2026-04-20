import React from "react";
import { Card } from "@/components/ui/card";

interface TripStatusCardsProps {
  approveTrip: any;
  checkoutTrips: any[];
}

const TripStatusCards: React.FC<TripStatusCardsProps> = ({
  approveTrip,
  checkoutTrips,
}) => {
  const hasApproveData = approveTrip && !approveTrip?.message;
  const hasCheckoutData =
    Array.isArray(checkoutTrips) &&
    checkoutTrips.length > 0 &&
    !checkoutTrips[0]?.message;

  if (!hasApproveData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Approve Card */}
      <Card
        className={`shadow-sm border rounded-lg p-4 ${
          approveTrip.astatus === 1 || approveTrip.astatus === 2
            ? "bg-green-50"
            : "bg-red-50"
        }`}
      >
        <h2
          className={`font-semibold mb-2 text-lg ${
            approveTrip.astatus === 1 || approveTrip.astatus === 2
              ? "text-green-700"
              : "text-red-600"
          }`}
        >
          {approveTrip.astatus === 1
            ? "✅ Approved Details"
            : approveTrip.astatus === 2
            ? "✔️ Approved Details"
            : "❌ Rejected Trip"}
        </h2>

        <p>
          <span className="font-semibold">Convey:</span>{" "}
          {approveTrip.convey.convey_name}/
          {approveTrip.convey.convey_time || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Checkpoint:</span>{" "}
          {approveTrip.checkpost.location || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Action Date:</span>{" "}
          {approveTrip.arrdate
            ? new Date(approveTrip.arrdate).toLocaleDateString("en-IN")
            : "N/A"}
        </p>
        <p>
          <span className="font-semibold">Action Time:</span>{" "}
          {approveTrip.arrtime || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Remarks:</span>{" "}
          {approveTrip.remarks || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Status:</span>{" "}
          <span
            className={
              approveTrip.astatus === 1 || approveTrip.astatus === 2
                ? "text-green-600 font-semibold"
                : "text-red-600 font-semibold"
            }
          >
            {approveTrip.astatus === 1 || approveTrip.astatus === 2
              ? "Approved"
              : "Rejected"}
          </span>
        </p>
      </Card>

      {/* Checkout Card */}
      <Card className="shadow-sm border rounded-lg p-4 bg-white">
        <h2 className="text-blue-700 font-semibold mb-2 text-lg">
          🛂 Checkpoints
        </h2>
        {hasCheckoutData ? (
          checkoutTrips.map((chk: any, idx: number) => (
            <div
              key={idx}
              className={`border rounded-lg p-3 mb-2 ${
                chk.status === 1
                  ? "bg-green-50"
                  : chk.status === 2
                  ? "bg-orange-50"
                  : "bg-red-50"
              }`}
            >
              <p>
                <span className="font-semibold">Checkpoint:</span>{" "}
                {chk.checkpostLocation?.location || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Checkout Date:</span>{" "}
                {chk.checkoutdate
                  ? new Date(chk.checkoutdate).toLocaleDateString("en-IN")
                  : "N/A"}
              </p>
              <p>
                <span className="font-semibold">Checkout Time:</span>{" "}
                {chk.checkouttime || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Remarks:</span>{" "}
                {chk.remarks || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={
                    chk.status === 1
                      ? "text-green-600 font-semibold"
                      : chk.status === 2
                      ? "text-orange-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {chk.status === 1
                    ? "✅ Checked OK"
                    : chk.status === 2
                    ? "⚠️ Problem"
                    : "❌ Not Arrived"}
                </span>
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-600 font-medium">Yet to be checked out</p>
        )}
      </Card>
    </div>
  );
};

export default TripStatusCards;
