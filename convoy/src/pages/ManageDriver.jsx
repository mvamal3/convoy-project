import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDriverList } from "@/contexts/GetApi";
import { deleteDriver } from "@/contexts/PostApi";
import AddDriver from "@/components/AddDriver";
import { toast } from "react-hot-toast";

const ManageDriver = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true); // added loading state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const rowsPerPage = 10;

  const fetchDriverList = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getDriverList(accessToken);
      console.log("Driver List Data:", data);

      const driverList = Array.isArray(data?.data?.driver)
        ? data.data.driver.map((d) => ({
            d_id: d.dId,
            name: `${d.title} ${d.dFirstName} ${d.dLastName}`.trim(),
            license: d.licenseNo,
            reg_id: d.sts?.[0]?.reg_id || "",
            phone: d.sts?.[0]?.phNo || "",
          }))
        : [];

      driverList.sort((a, b) => Number(b.d_id) - Number(a.d_id));
      setDrivers(driverList);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }, [accessToken]);

  // 3-second delay with data fetch
  useEffect(() => {
    let timeoutId;
    setLoading(true);
    fetchDriverList();
    timeoutId = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1 second delay
    return () => clearTimeout(timeoutId);
  }, [fetchDriverList]);

  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredDrivers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredDrivers.length / rowsPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleDelete = async (driverId) => {
    try {
      console.log("Deleting driver with ID:", driverId);
      const res = await deleteDriver(accessToken, driverId);

      if (res.success) {
        toast.success("Driver deleted successfully");
        setDrivers((prev) => prev.filter((d) => d.d_id !== driverId));
      } else {
        toast.error(res.message || "Failed to delete driver");
      }
    } catch (error) {
      console.error("Error deleting driver:", error);
      toast.error("Error deleting driver");
    }
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleDriverAdded = async () => {
    await fetchDriverList();
    setCurrentPage(1);
    closeModal();
  };

  // Automatically open AddDriver form if no driver exists
  useEffect(() => {
    if (drivers.length === 0) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [drivers]);

  // Loading spinner UI
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 w-full items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-3"></div>
            <div className="text-lg text-gray-700">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Manage Drivers</h1>
          <Button onClick={openModal} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Drivers List</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredDrivers.length} driver(s)
              </p>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name..."
                className="w-full sm:w-64 border rounded px-3 py-1 text-sm focus:outline-none focus:ring focus:border-blue-400"
              />
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden space-y-4">
              {currentRows.length > 0 ? (
                currentRows.map((row, i) => (
                  <div
                    key={row.d_id}
                    className="border rounded-lg p-4 shadow-sm bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-800">
                      #{(currentPage - 1) * rowsPerPage + i + 1} - {row.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      License: {row.license}
                      <br />
                      Phone: {row.phone}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/drivers/edit/${row.d_id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(row.d_id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm">
                  {drivers.length > 0
                    ? `No data found for "${searchTerm}".`
                    : "No drivers found."}
                </p>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-700 border">
                  <thead className="bg-gray-100 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Name</th>
                      <th className="px-4 py-2 border">License</th>
                      <th className="px-4 py-2 border">Phone</th>
                      <th className="px-4 py-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.length > 0 ? (
                      currentRows.map((row, i) => (
                        <tr
                          key={row.d_id}
                          className="hover:bg-gray-50 border-b"
                        >
                          <td className="px-4 py-2 border">
                            {(currentPage - 1) * rowsPerPage + i + 1}
                          </td>
                          <td className="px-4 py-2 border">{row.name}</td>
                          <td className="px-4 py-2 border">{row.license}</td>
                          <td className="px-4 py-2 border">{row.phone}</td>
                          <td className="px-4 py-2 border">
                            <div className="flex gap-2">
                              {/* Uncomment if edit button needed */}
                              {/* <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(`/drivers/edit/${row.d_id}`)
                                }
                              >
                                Edit
                              </Button> */}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(row.d_id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-gray-500 py-4"
                        >
                          {drivers.length > 0
                            ? `No data found for "${searchTerm}".`
                            : "No drivers found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredDrivers.length > rowsPerPage && (
              <div className="flex justify-between mt-4 text-sm items-center">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <AddDriver
          isOpen={showModal}
          onClose={closeModal}
          onSuccessAdd={handleDriverAdded}
        />
      )}
    </DashboardLayout>
  );
};

export default ManageDriver;
