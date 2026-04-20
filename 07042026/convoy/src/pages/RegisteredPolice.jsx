import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getRegisteredPolice, getOriginDestinations } from "@/contexts/GetApi";

import Swal from "sweetalert2";
import { Eye, EyeOff } from "lucide-react";
import {
  updatePoliceProfileAPI,
  freezePoliceUser,
  deletePoliceUser,
  changePolicePasswordAPI,
} from "@/contexts/PostApi";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Lock, Unlock } from "lucide-react";

const RegisteredPolice = () => {
  const { accessToken } = useAuth();
  const [police, setPolice] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPolice, setSelectedPolice] = useState(null);
  const [checkposts, setCheckposts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCheckpost, setSelectedCheckpost] = useState("");

  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [pwdUser, setPwdUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const rowsPerPage = 10;
  const navigate = useNavigate();

  /* ---------------- Fetch Police ---------------- */
  const fetchPolice = useCallback(async () => {
    if (!accessToken) return;

    try {
      const res = await getRegisteredPolice(accessToken);
      console.log("Police list:", res?.data.count);

      const apiData = res?.data?.data || [];

      const list = apiData.map((p) => ({
        reg_id: p.reg_id,
        userId: p.userid,
        name: p.name,
        designation: p.designation || "N/A",
        emp_id: p.emp_id || "N/A",
        contact: p.contact,
        email: p.email,
        checkpost: p.checkpost || "N/A",
        status: p.isActive ? "Active" : "Frozen",
        lastLoginAt: p.lastLoginAt,
        checkpostid: p.checkpostId,
      }));

      setPolice(list);
    } catch (err) {
      console.error("Police fetch error:", err);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPolice();
  }, [fetchPolice]);

  useEffect(() => {
    const fetchCheckposts = async () => {
      if (!accessToken) return;
      try {
        const res = await getOriginDestinations(accessToken);
        if (res) setCheckposts(res);
      } catch (err) {
        console.error("Error fetching checkposts:", err);
      }
    };

    fetchCheckposts();
  }, [accessToken]);

  /* ---------------- Search ---------------- */
  const filteredPolice = police.filter((p) => {
    const textMatch = `${p.reg_id} ${p.name} ${p.emp_id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const checkpostMatch =
      !selectedCheckpost || p.checkpostid == selectedCheckpost;

    return textMatch && checkpostMatch;
  });

  const totalPages = Math.ceil(filteredPolice.length / rowsPerPage);
  const currentRows = filteredPolice.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Registered Police Officers
          </h1>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/FreezPolice")}
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              🔒 Frozen Police Officers
            </Button>

            <Button onClick={() => navigate("/PoliceRegister")}>
              + Add Police
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader />
          <CardContent>
            {/* Search */}
            <div className="flex gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Name or Employee ID..."
                className="border px-3 py-2 rounded w-64 text-sm"
              />

              <select
                className="border px-3 py-2 rounded text-sm"
                value={selectedCheckpost}
                onChange={(e) => {
                  setSelectedCheckpost(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Checkposts</option>
                {checkposts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.location}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-muted-foreground">
              Showing {filteredPolice.length} officer(s)
            </p>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-sm border">
                <thead className="bg-gray-100 uppercase text-xs">
                  <tr>
                    <th className="border px-3 py-2">#</th>
                    <th className="border px-3 py-2">Officer Name</th>
                    <th className="border px-3 py-2">Designation</th>
                    <th className="border px-3 py-2">Employee ID</th>
                    <th className="border px-3 py-2">Contact</th>
                    <th className="border px-3 py-2">Email</th>
                    <th className="border px-3 py-2">Checkpost</th>
                    <th className="border px-3 py-2 text-center">Status</th>
                    <th className="border px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((row, i) => (
                      <tr key={row.reg_id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">
                          {(currentPage - 1) * rowsPerPage + i + 1}
                        </td>
                        <td className="border px-3 py-2 font-medium">
                          {row.name}
                        </td>
                        <td className="border px-3 py-2">{row.designation}</td>
                        <td className="border px-3 py-2">{row.emp_id}</td>
                        <td className="border px-3 py-2">{row.contact}</td>
                        <td className="border px-3 py-2">{row.email}</td>
                        <td className="border px-3 py-2">{row.checkpost}</td>
                        <td className="border px-3 py-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              row.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="border px-3 py-2 text-center flex justify-center gap-2">
                          {/* Edit */}
                          <Button
                            size="sm"
                            onClick={() => {
                              // Prefill and open inline edit modal
                              const [firstName, ...rest] = (
                                row.name || ""
                              ).split(" ");
                              const lastName = rest.join(" ") || "";
                              setSelectedPolice({
                                userid: row.userId,
                                title: "",
                                firstName,
                                lastName,
                                designation: row.designation || "",
                                emp_id: row.emp_id || "",
                                contact: row.contact || "",
                                checkpostId: row.checkpostid || "",
                              });
                              setIsEditOpen(true);
                            }}
                          >
                            <Pencil size={16} />
                          </Button>

                          {/* Freeze / Unfreeze */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await freezePoliceUser(
                                accessToken,
                                row.userId,
                              );

                              if (res.success) {
                                toast({
                                  title: "Status updated",
                                  variant: "success",
                                });
                                fetchPolice();
                              } else {
                                toast({
                                  title: "Error",
                                  description: res.message,
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            {row.status === "Active" ? (
                              <Lock size={16} />
                            ) : (
                              <Unlock size={16} />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPwdUser(row);
                              setNewPassword("");
                              setConfirmPassword("");
                              setIsPwdModalOpen(true);
                            }}
                          >
                            🔑
                          </Button>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (!confirm("Delete this officer?")) return;

                              const res = await deletePoliceUser(
                                accessToken,
                                row.userId,
                              );

                              if (res.success) {
                                toast({ title: "Deleted", variant: "success" });
                                fetchPolice();
                              } else {
                                toast({
                                  title: "Delete failed",
                                  description: res.message,
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-4 text-gray-500"
                      >
                        No registered police found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        {isEditOpen && selectedPolice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
              <h2 className="text-xl font-semibold mb-4">Edit Police</h2>

              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                onClick={() => setIsEditOpen(false)}
              >
                ✖
              </button>

              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!accessToken || !selectedPolice) return;

                  const payload = {
                    firstName: selectedPolice.firstName || "",
                    lastName: selectedPolice.lastName || "",
                    designation: selectedPolice.designation || "",
                    emp_id: selectedPolice.emp_id || "",
                    checkpostId: selectedPolice.checkpostId || "",
                    contact: selectedPolice.contact || "",
                    userid: selectedPolice.userid,
                  };

                  try {
                    const res = await updatePoliceProfileAPI(
                      accessToken,
                      payload,
                    );
                    if (res.status === 200 && res.data?.success) {
                      toast({
                        title: "Updated",
                        description: res.data.message || "Officer updated",
                        variant: "success",
                      });
                      setIsEditOpen(false);
                      fetchPolice();
                    } else {
                      toast({
                        title: "Update Failed",
                        description: res.data?.message || "Please try again.",
                        variant: "destructive",
                      });
                    }
                  } catch (err) {
                    console.error("Update error:", err);
                    toast({
                      title: "Error",
                      description: "An error occurred while updating.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-1">
                      First Name
                    </label>
                    <input
                      value={selectedPolice.firstName}
                      onChange={(e) =>
                        setSelectedPolice({
                          ...selectedPolice,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full border px-3 py-2 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">
                      Last Name
                    </label>
                    <input
                      value={selectedPolice.lastName}
                      onChange={(e) =>
                        setSelectedPolice({
                          ...selectedPolice,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full border px-3 py-2 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">
                      Designation
                    </label>
                    <input
                      value={selectedPolice.designation}
                      onChange={(e) =>
                        setSelectedPolice({
                          ...selectedPolice,
                          designation: e.target.value,
                        })
                      }
                      className="w-full border px-3 py-2 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">
                      Employee ID
                    </label>
                    <input
                      value={selectedPolice.emp_id}
                      onChange={(e) =>
                        setSelectedPolice({
                          ...selectedPolice,
                          emp_id: e.target.value,
                        })
                      }
                      className="w-full border px-3 py-2 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Contact</label>
                    <input
                      value={selectedPolice.contact}
                      onChange={(e) =>
                        setSelectedPolice({
                          ...selectedPolice,
                          contact: e.target.value,
                        })
                      }
                      className="w-full border px-3 py-2 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">
                      Checkpost
                    </label>
                    <select
                      value={selectedPolice.checkpostId}
                      onChange={(e) =>
                        setSelectedPolice({
                          ...selectedPolice,
                          checkpostId: e.target.value,
                        })
                      }
                      className="w-full border px-3 py-2 rounded-lg"
                    >
                      <option value="">Select</option>
                      {checkposts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isPwdModalOpen && pwdUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
              <h2 className="text-xl font-semibold mb-4">
                Change Password – {pwdUser.name}
              </h2>

              <button
                className="absolute top-3 right-3 text-gray-500"
                onClick={() => setIsPwdModalOpen(false)}
              >
                ✖
              </button>

              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();

                  if (newPassword !== confirmPassword) {
                    Swal.fire({
                      icon: "error",
                      title: "Password Mismatch",
                      text: "New password and confirm password do not match",
                    });
                    return;
                  }

                  try {
                    const res = await changePolicePasswordAPI(accessToken, {
                      userid: pwdUser.userId,
                      password: newPassword,
                    });

                    if (res.success) {
                      await Swal.fire({
                        icon: "success",
                        title: "Password Updated",
                        text: "Police user password has been updated successfully",
                        confirmButtonColor: "#2563eb",
                      });

                      // ✅ CLEANUP
                      setNewPassword("");
                      setConfirmPassword("");
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                      setPwdUser(null);
                      setIsPwdModalOpen(false);
                    } else {
                      Swal.fire({
                        icon: "error",
                        title: "Failed",
                        text: res.message || "Password update failed",
                      });
                    }
                  } catch (err) {
                    console.error(err);
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "Something went wrong while updating the password",
                    });
                  }
                }}
              >
                {/* New Password */}
                <div className="relative">
                  <label className="block text-gray-600 mb-1">
                    New Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg pr-10"
                    required
                  />
                  <span
                    className="absolute right-3 top-9 cursor-pointer text-gray-500"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <label className="block text-gray-600 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg pr-10"
                    required
                  />
                  <span
                    className="absolute right-3 top-9 cursor-pointer text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </span>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPwdModalOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button type="submit">Update Password</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RegisteredPolice;
