import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { getPoliceProfile, getOriginDestinations } from "@/contexts/GetApi";
import { updatePoliceProfileAPI } from "@/contexts/PostApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-4 py-2 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="text-gray-900 font-semibold text-right">{value}</span>
  </div>
);

const PoliceProfile = () => {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [checkposts, setCheckposts] = useState<any[]>([]);

  // Separate state for each field
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [empId, setEmpId] = useState("");
  const [contact, setContact] = useState("");
  const [checkpostId, setCheckpostId] = useState<number | "">("");
  const [checkpostName, setCheckpostName] = useState("");

  // ✅ Define reusable fetch function
  const fetchProfileAndCheckposts = async () => {
    setLoading(true);
    try {
      // Fetch police profile
      const profileRes = await getPoliceProfile(accessToken, user.id);
      if (profileRes?.data?.data) {
        const p = profileRes.data.data;
        setProfile(p);

        // Populate fields
        setTitle(p.title || "");
        setFirstName(p.firstName || "");
        setLastName(p.lastName || "");
        setDesignation(p.designation || "");
        setEmpId(p.emp_id || "");
        setContact(p.contact || "");
        setCheckpostId(p.checkpostId || "");
        setCheckpostName(p.checkpost || "");
      }

      // Fetch checkposts
      const checkpostRes = await getOriginDestinations(accessToken);
      if (checkpostRes) setCheckposts(checkpostRes);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch profile or checkposts.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ useEffect calls it once on mount
  useEffect(() => {
    if (accessToken && user?.id) {
      fetchProfileAndCheckposts();
    }
  }, [accessToken, user?.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !user?.id) return;
    // console.log("userid", user.id);

    const payload = {
      title,
      firstName,
      lastName,
      designation,
      emp_id: empId,
      checkpostId,
      contact,
      userid: user.id,
    };

    try {
      const res = await updatePoliceProfileAPI(accessToken, payload);

      if (res.status === 200 && res.data?.success) {
        toast({
          title: "Profile Updated 🎉",
          description:
            res.data.message || "Your profile was updated successfully.",
          variant: "success",
        });

        // ✅ Close modal first
        setIsEditOpen(false);

        // ✅ Refetch latest profile from DB (no page reload)
        await fetchProfileAndCheckposts();
      } else {
        toast({
          title: "Update Failed",
          description: res.data?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({
        title: "Error",
        description: "An error occurred while updating profile.",
        variant: "destructive",
      });
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-gray-500">
          Loading profile...
        </div>
      </DashboardLayout>
    );

  if (error || !profile)
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-red-500">
          {error || "Profile not available"}
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-4 px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 text-center w-full justify-center">
            <Shield className="text-red-600" /> Police Profile
          </h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-5 w-5" /> Back
          </Button>
        </div>

        {/* Profile Info */}
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="bg-blue-100/70 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-blue-900 text-lg font-semibold">
                <Shield className="text-red-600" /> Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-white rounded-b-xl space-y-4">
              <InfoRow
                label="Name"
                value={`${profile.title} ${profile.firstName} ${profile.lastName}`}
              />
              <InfoRow label="Designation" value={profile.designation || "-"} />
              <InfoRow label="Employee ID" value={profile.emp_id || "-"} />
              <InfoRow label="Checkpost" value={profile.checkpostName || "-"} />
              <InfoRow label="Contact Number" value={profile.contact || "-"} />
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Edit Police Profile</h2>

            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditOpen(false)}
            >
              ✖
            </button>

            <form className="space-y-4" onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Title</label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                    required
                  />
                </div>
                <div>
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
                <label className="block text-gray-600 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Checkpost</label>
                <select
                  value={checkpostId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const selected = checkposts.find((cp) => cp.id === id);
                    setCheckpostId(id);
                    setCheckpostName(selected ? selected.location : "");
                  }}
                  className="w-full border px-3 py-2 rounded-lg"
                  required
                >
                  <option value="">-- Select Checkpost --</option>
                  {checkposts.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Contact</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PoliceProfile;
