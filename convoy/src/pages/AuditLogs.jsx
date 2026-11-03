import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getAuditLogsAPI } from "@/contexts/PostApi";

const PAGE_SIZE = 20;

const ACCOUNT_LABELS = { user: "Citizen", police: "Police", admin: "Admin" };

const EMPTY_FILTERS = {
  action: "",
  actorType: "",
  status: "",
  from: "",
  to: "",
  search: "",
};

// Admin: read-only view of the security audit trail.
const AuditLogs = () => {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [actions, setActions] = useState([]);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const res = await getAuditLogsAPI(accessToken, {
      ...filters,
      page,
      limit: PAGE_SIZE,
    });
    setLoading(false);

    if (res?.success) {
      setRows(res.data.rows);
      setTotal(res.data.total);
      setActions(res.data.actions || []);
    } else {
      toast.error(res?.message || "Unable to fetch audit log");
    }
  }, [accessToken, filters, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-muted-foreground">{total} record(s)</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form
              className="mb-4 flex flex-wrap gap-3 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setFilters({ ...form, search: form.search.trim() });
              }}
            >
              <label className="text-xs text-gray-600">
                From
                <input type="date" value={form.from} onChange={update("from")} className="block border px-2 py-2 rounded text-sm" />
              </label>
              <label className="text-xs text-gray-600">
                To
                <input type="date" value={form.to} onChange={update("to")} className="block border px-2 py-2 rounded text-sm" />
              </label>
              <label className="text-xs text-gray-600">
                Action
                <select value={form.action} onChange={update("action")} className="block border px-2 py-2 rounded text-sm">
                  <option value="">All</option>
                  {actions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-gray-600">
                Account
                <select value={form.actorType} onChange={update("actorType")} className="block border px-2 py-2 rounded text-sm">
                  <option value="">All</option>
                  <option value="user">Citizen</option>
                  <option value="police">Police</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="text-xs text-gray-600">
                Result
                <select value={form.status} onChange={update("status")} className="block border px-2 py-2 rounded text-sm">
                  <option value="">All</option>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                </select>
              </label>
              <label className="text-xs text-gray-600">
                Search
                <input
                  type="text"
                  maxLength={100}
                  value={form.search}
                  onChange={update("search")}
                  placeholder="User, ID or IP"
                  className="block border px-2 py-2 rounded text-sm w-48"
                />
              </label>
              <Button type="submit" size="sm">
                Apply
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setForm(EMPTY_FILTERS);
                  setFilters(EMPTY_FILTERS);
                  setPage(1);
                }}
              >
                Clear
              </Button>
            </form>

            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-sm border">
                <thead className="bg-gray-100 uppercase text-xs">
                  <tr>
                    <th className="border px-3 py-2">Date &amp; Time</th>
                    <th className="border px-3 py-2">Account</th>
                    <th className="border px-3 py-2">User</th>
                    <th className="border px-3 py-2">Action</th>
                    <th className="border px-3 py-2">Result</th>
                    <th className="border px-3 py-2">Target</th>
                    <th className="border px-3 py-2">IP Address</th>
                    <th className="border px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 align-top">
                        <td className="border px-3 py-2 whitespace-nowrap">{row.createdAt}</td>
                        <td className="border px-3 py-2">{ACCOUNT_LABELS[row.actorType] || "-"}</td>
                        <td className="border px-3 py-2 break-all">{row.actorName || "-"}</td>
                        <td className="border px-3 py-2 font-medium">{row.action}</td>
                        <td className="border px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              row.status === "success"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="border px-3 py-2 break-all">
                          {row.targetId ? `${row.targetType || ""} ${row.targetId}` : "-"}
                        </td>
                        <td className="border px-3 py-2">{row.ip || "-"}</td>
                        <td className="border px-3 py-2">{row.details || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-gray-500">
                        {loading ? "Loading..." : "No audit records found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
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

export default AuditLogs;
