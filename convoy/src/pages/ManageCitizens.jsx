import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, KeyRound } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCitizensAPI,
  freezeCitizenAPI,
  unfreezeCitizenAPI,
  unlockAccountAPI,
} from "@/contexts/PostApi";

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  locked: "bg-orange-100 text-orange-700",
  frozen: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  active: "Active",
  pending: "OTP Pending",
  locked: "Locked",
  frozen: "Frozen",
};

const formatDate = (value) => (value ? String(value).slice(0, 16) : "-");

// Admin: view citizen accounts, freeze/unfreeze them and clear login lockouts.
const ManageCitizens = () => {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCitizens = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const res = await getCitizensAPI(accessToken, {
      page,
      limit: PAGE_SIZE,
      status,
      search,
    });
    setLoading(false);

    if (res?.success) {
      setRows(res.data.rows);
      setTotal(res.data.total);
    } else {
      toast.error(res?.message || "Unable to fetch citizens");
    }
  }, [accessToken, page, status, search]);

  useEffect(() => {
    fetchCitizens();
  }, [fetchCitizens]);

  const runAction = async (question, action, row) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: question,
      // `text` (not `html`) so user data is never rendered as markup
      text: `${row.name} (${row.email})`,
      showCancelButton: true,
      confirmButtonText: "Yes",
    });
    if (!confirm.isConfirmed) return;

    const res = await action();
    if (res?.success) {
      toast.success(res.message);
      fetchCitizens();
    } else {
      toast.error(res?.message || "Action failed");
    }
  };

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Citizens</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {total} citizen account(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="mb-4 flex flex-wrap gap-3 items-center"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setSearch(searchInput.trim());
              }}
            >
              <input
                type="text"
                value={searchInput}
                maxLength={100}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search Reg ID, name, email, mobile..."
                className="border px-3 py-2 rounded w-72 text-sm"
              />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="border px-3 py-2 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="pending">OTP Pending</option>
                <option value="locked">Locked</option>
                <option value="frozen">Frozen</option>
              </select>
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>

            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-sm border">
                <thead className="bg-gray-100 uppercase text-xs">
                  <tr>
                    <th className="border px-3 py-2">#</th>
                    <th className="border px-3 py-2">Reg ID</th>
                    <th className="border px-3 py-2">Name</th>
                    <th className="border px-3 py-2">Organisation</th>
                    <th className="border px-3 py-2">Mobile</th>
                    <th className="border px-3 py-2">Email</th>
                    <th className="border px-3 py-2">Registered</th>
                    <th className="border px-3 py-2">Last Login</th>
                    <th className="border px-3 py-2 text-center">Status</th>
                    <th className="border px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((row, i) => (
                      <tr key={row.userId} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="border px-3 py-2">{row.reg_id}</td>
                        <td className="border px-3 py-2 font-medium">{row.name}</td>
                        <td className="border px-3 py-2">{row.orgName || "-"}</td>
                        <td className="border px-3 py-2">{row.mobile}</td>
                        <td className="border px-3 py-2">{row.email}</td>
                        <td className="border px-3 py-2">{formatDate(row.registeredAt)}</td>
                        <td className="border px-3 py-2">{formatDate(row.lastLoginAt)}</td>
                        <td className="border px-3 py-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs ${STATUS_STYLES[row.status]}`}
                          >
                            {STATUS_LABELS[row.status]}
                          </span>
                        </td>
                        <td className="border px-3 py-2">
                          <div className="flex justify-center gap-2">
                            {row.status === "frozen" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Unfreeze"
                                onClick={() =>
                                  runAction(
                                    "Unfreeze this citizen account?",
                                    () => unfreezeCitizenAPI(accessToken, row.userId),
                                    row,
                                  )
                                }
                              >
                                <Unlock size={16} />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Freeze"
                                className="text-red-600"
                                onClick={() =>
                                  runAction(
                                    "Freeze this citizen account? They will be signed out and cannot login.",
                                    () => freezeCitizenAPI(accessToken, row.userId),
                                    row,
                                  )
                                }
                              >
                                <Lock size={16} />
                              </Button>
                            )}
                            {row.locked && (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Clear login lockout"
                                onClick={() =>
                                  runAction(
                                    "Clear the login lockout of this account?",
                                    () => unlockAccountAPI(accessToken, "user", row.userId),
                                    row,
                                  )
                                }
                              >
                                <KeyRound size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-4 text-gray-500">
                        {loading ? "Loading..." : "No citizens found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
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

export default ManageCitizens;
