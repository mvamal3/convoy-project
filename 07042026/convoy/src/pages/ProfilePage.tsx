import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { getUserDetails } from "@/contexts/GetApi";
import { updateProfileAPI } from "@/contexts/PostApi";
import { useAuth } from "@/contexts/AuthContext";

import { useToast } from "@/components/ui/use-toast";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-4 py-2 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="text-gray-900 font-semibold text-right">{value}</span>
  </div>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();

  // Separate states for first name and last name
  const [title, setTitle] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await getUserDetails(accessToken, user.id);
        console.log("User Details Response:", response);
        if (response?.data?.data) {
          const data = response.data.data;
          setProfile(data);
          // Set firstName and lastName directly from response
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setContactNumber(data.ownContact || "");
          setAddress(data.ownAddress || "");
          setTitle(data.title);
          setError(null);
        } else {
          setError("No profile data found.");
        }
      } catch {
        setError("Failed to fetch profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken, user.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !user?.id) return;

    const payload = {
      title: title || "",
      firstName: firstName.trim() || "",
      lastName: lastName.trim() || "",
      ownContact: contactNumber,
      ownAddress: address,
      userid: user.id,
    };

    try {
      const res = await updateProfileAPI(accessToken, payload);

      if (res.status === 200 && res.data?.success) {
        // ✅ Show success toast message
        toast({
          title: "Profile Updated 🎉",
          description:
            res.data.message || "Your profile was updated successfully.",
          variant: "default",
        });

        // ✅ Update profile state
        setProfile((prev) => ({ ...prev, ...payload }));

        // ✅ Close edit modal
        setIsEditOpen(false);
      } else {
        toast({
          title: "Update Failed",
          description:
            res.data?.message || "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating profile.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-gray-500">
          Loading profile...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-red-500">
          {error || "Profile not available"}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-4 px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 text-center w-full justify-center">
            👤 User Profile
          </h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>

        {/* Profile Info */}
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="bg-blue-100/70 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-blue-900 text-lg font-semibold">
                <User className="text-blue-700" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-white rounded-b-xl space-y-4">
              <InfoRow
                label="Name"
                value={`${profile.title} ${profile.firstName} ${profile.lastName}`}
              />
              {profile.isOrg > 0 && profile.orgName && (
                <>
                  <InfoRow label="Organization Name" value={profile.orgName} />
                  <InfoRow
                    label="Document Details"
                    value={`ID: ${profile.docId || "-"}, Type: ${
                      profile.docIdtype || "-"
                    }`}
                  />
                </>
              )}
              <InfoRow label="Contact Number" value={profile.ownContact} />
              <InfoRow
                label="Full Address"
                value={`${profile.ownAddress}, ${profile.village}, ${profile.subdistrict}, ${profile.district}`}
              />
            </CardContent>
          </Card>

          {/* Edit Button */}
          <div className="flex justify-center mt-6">
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsEditOpen(true)}
            >
              ✏️ Edit Information
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-8 relative">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditOpen(false)}
              aria-label="Close edit profile"
            >
              ✖
            </button>
            {/* Edit Form */}
            <form className="space-y-4" onSubmit={handleUpdateProfile}>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-gray-600 mb-1">Title</label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                    required
                  >
                    <option value="" disabled>
                      Select title
                    </option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>

                    {/* Add more options if needed */}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Save Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProfilePage;
