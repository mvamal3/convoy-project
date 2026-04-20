import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Phone, MapPin, IdCard } from "lucide-react";

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between px-4 py-2 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="text-gray-900 font-semibold text-right">{value}</span>
  </div>
);

const ProfilePage = () => {
  const navigate = useNavigate();

  // Example data – replace with API/user context
  const profile = {
    registrationType: "Individual",
    title: "Mr.",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    contactNumber: "+91 9876543210",
    address: "123 Main Street, Near Market, Port Blair",
    district: "South Andaman",
    subdistrict: "Port Blair",
    village: "Phoenix Bay",
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8 px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            👤 User Profile
          </h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>

        {/* Profile Info */}
        <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="bg-blue-100/70 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg font-semibold">
              <User className="text-blue-700" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 bg-white rounded-b-xl space-y-4">
            <InfoRow
              label="Registration Type"
              value={profile.registrationType}
            />
            <InfoRow label="Title" value={profile.title} />
            <InfoRow
              label="Full Name"
              value={`${profile.firstName} ${profile.lastName}`}
            />
            <InfoRow label="Email Address" value={profile.email} />
            <InfoRow label="Contact Number" value={profile.contactNumber} />
            <InfoRow label="Full Address" value={profile.address} />
            <InfoRow label="District" value={profile.district} />
            <InfoRow label="Subdistrict" value={profile.subdistrict} />
            <InfoRow label="Village" value={profile.village} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
