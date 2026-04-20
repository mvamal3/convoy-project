import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getFreezpolice, getOriginDestinations } from "@/contexts/GetApi";
import { UnfreezePoliceUser } from "@/contexts/PostApi";
import { toast } from "@/hooks/use-toast";
import { Lock, Unlock, Trash2 } from "lucide-react";

const FreezPolice = () => {
  const { accessToken } = useAuth();
  const [police, setPolice] = useState([]);
  const [checkposts, setCheckposts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const navigate = useNavigate();

  /* ---------------- Fetch Frozen Police ---------------- */
  const fetchPolice = useCallback(async () => {
    if (!accessToken) return;

    try {
      const res = await getFreezpolice(accessToken);
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
        status: "Frozen",
      }));

      setPolice(list);
    } catch (err) {
      console.error("Frozen police fetch error:", err);
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
  const filteredPolice = police.filter((p) =>
    `${p.reg_id} ${p.name} ${p.emp_id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPolice.length / rowsPerPage);
  const currentRows = filteredPolice.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 px-2 sm:px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Freeze Police Officers
          </h1>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/RegisteredPolice")}
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              🟢 Active Police Officers
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader />
          <CardContent>
            {/* Search */}
            <div className="mb-4 flex justify-between items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Reg ID, Name, or Employee ID..."
                className="border px-3 py-2 rounded w-64 text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Showing {filteredPolice.length} frozen officer(s)
              </p>
            </div>

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
                          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                            Frozen
                          </span>
                        </td>
                        <td className="border px-3 py-2 text-center flex justify-center gap-2">
                          {/* Unfreeze */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await UnfreezePoliceUser(
                                accessToken,
                                row.userId
                              );
                              if (res.success) {
                                toast({
                                  title: "Officer reactivated",
                                  variant: "success",
                                });
                                fetchPolice();
                              }
                            }}
                          >
                            <Unlock size={16} />
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
                        No frozen police found
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
      </div>
    </DashboardLayout>
  );
};

export default FreezPolice;
