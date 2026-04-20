import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { QRCodeCanvas } from "qrcode.react";
import { CardHeader, CardTitle } from "@/components/ui/card";

import {
  Truck,
  Hash,
  Car,
  UserCircle,
  Phone,
  IdCard,
  Users,
  AlertCircle,
  Clipboard as ClipboardIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between px-4 py-2 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="text-gray-900 font-semibold text-right">{value}</span>
  </div>
);

const TripOverviewCard = ({ tripDetails }) => {
  const { user } = useAuth();

  if (!tripDetails) return null;

  const status = Number(tripDetails.status);
  const verifyStatus = Number(tripDetails.verifiystatus);
  //console.log("verifyStatus:", verifyStatus);
  console.log("Trip Details in Overview Card:", tripDetails);
  const userType = user?.usertype;

  // ✅ Dynamic message based on user type
  let qrMessage =
    "Please Show this QR code at the checkpost.You may either show the application directly on your device or provide a printed copy at the checkpost";
  if (userType === "0") {
    qrMessage =
      "Citizen: Please Show this QR code at the checkpost.You may either show the application directly on your device or provide a printed copy at the checkpost";
  } else if (userType === "1") {
    qrMessage =
      "Department: Please Show this QR code at the checkpost.You may either show the application directly on your device or provide a printed copy at the checkpost";
  } else if (userType === "2") {
    qrMessage =
      "Please Show this QR code at the checkpost.You may either show the application directly on your device or provide a printed copy at the checkpost";
  } else if (userType === "police") {
    qrMessage = "Scan this QR to approve and Verified the trip.";
  }
  const finalStatus =
    status === 2
      ? 2
      : status === 3 || verifyStatus === 3
      ? 3
      : status === 1
      ? 1
      : 0;

  // 🔹 UI CONFIG (LABEL + COLOR ALWAYS MATCH)
  const statusUI = {
    1: { label: "Pending", class: "bg-yellow-100 text-yellow-700" },
    2: { label: "Approved", class: "bg-green-100 text-green-700" },
    3: { label: "Rejected", class: "bg-red-100 text-red-700" },
    0: { label: "Unknown", class: "bg-gray-100 text-gray-700" },
  }[finalStatus];

  return (
    <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-white">
      <CardContent className="p-4 sm:p-6 bg-white rounded-b-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-sm">
          {/* Left Column */}
          <div className="md:col-span-4 space-y-2">
            <InfoRow
              label={<span className="text-lg font-semibold">TRIP ID</span>}
              value={
                <span className="text-xl font-extrabold px-3 py-1 rounded bg-blue-100 text-blue-900 shadow-sm border border-blue-200 tracking-wider">
                  {tripDetails.tId}
                </span>
              }
            />

            <InfoRow
              label="Origin"
              value={tripDetails.originLocation?.location || "N/A"}
            />
            <InfoRow
              label="Total Passengers"
              value={tripDetails.passengers?.length || 0}
            />

            {/* Driver Section */}
            <div className="border rounded-lg p-3 bg-gray-50 shadow-sm mt-3">
              <div className="flex items-center gap-2 mb-2">
                <UserCircle className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-800">Driver Details</h4>
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <p className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Name:</span>{" "}
                  {`${tripDetails.driver?.dFirstName || ""} ${
                    tripDetails.driver?.dLastName || ""
                  }`}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Phone:</span>{" "}
                  {tripDetails.driver?.sts?.[0]?.phNo || "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">License:</span>{" "}
                  {tripDetails.driver?.licenseNo || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="md:col-span-4 space-y-2">
            <InfoRow
              label="STATUS"
              value={
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${statusUI.class}`}
                >
                  {statusUI.label}
                </span>
              }
            />

            <InfoRow
              label="Destination"
              value={tripDetails.destinationLocation?.location || "N/A"}
            />
            <InfoRow
              label="Date & Convoy Time"
              value={`${new Date(tripDetails.date).toLocaleDateString("en-IN", {
                dateStyle: "medium",
              })} / ${tripDetails.convey?.convey_time || "N/A"}`}
            />

            {/* Vehicle Section */}
            <div className="border rounded-lg p-3 bg-gray-50 shadow-sm mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-800">Vehicle Details</h4>
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <p className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Vehicle Number:</span>{" "}
                  {tripDetails.vehicle?.vNum || "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Category:</span>{" "}
                  {tripDetails.vehicle?.vCat || "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <ClipboardIcon className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Ownership Type:</span>{" "}
                  {tripDetails.vehicle?.ownershipType || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code */}
          <div className="md:col-span-4 flex items-center justify-center">
            <div className="p-4 bg-white border rounded-xl shadow-md text-center flex flex-col items-center justify-center">
              <h4 className="mb-2 font-semibold text-lg text-blue-800">
                TRIP ID
              </h4>
              <QRCodeCanvas value={tripDetails.tId} size={150} level="H" />
              <p className="mt-2 text-sm font-mono">{tripDetails.tId}</p>

              {/* Dynamic Message */}
              <p className="mt-4 text-base text-blue-700 font-semibold">
                {/* {qrMessage} */}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      {/* ✅ Passenger Details Card Header */}
      {tripDetails && (
        <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-t-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            {/* Left Title Section */}
            <CardTitle className="flex items-center gap-3 bg-purple-50 border border-purple-300 rounded-xl px-4 py-3 shadow-sm">
              <span className="text-2xl">📢</span>
              <span className="text-purple-900 font-semibold leading-snug">
                {qrMessage}
              </span>
            </CardTitle>

            {/* Right QR Message Section */}
          </div>
        </CardHeader>
      )}
    </Card>
  );
};

export default TripOverviewCard;
