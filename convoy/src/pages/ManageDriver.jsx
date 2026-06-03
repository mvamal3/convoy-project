import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react"; // Added Search Icon
import { getDriverList } from "@/contexts/GetApi";
import { deleteDriver } from "@/contexts/PostApi";
import AddDriver from "@/components/AddDriver";
import { toast } from "react-hot-toast";

const ManageDriver = () => {
  const { accessToken } = useAuth();

  // Driver states
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Search input states (Separated to avoid keystroke backend triggers)
  const [searchInput, setSearchInput] = useState(""); // Dynamic string typed by user
  const [backendSearchTerm, setBackendSearchTerm] = useState(""); // Only updates on button click/Enter

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [chunkPage, setChunkPage] = useState(1);

  const rowsPerPage = 10;
  const chunkSize = 100;

  // 1. Explicit Search Action Function
  const handleSearchTrigger = () => {
    setCurrentPage(1);
    setChunkPage(1);
    setBackendSearchTerm(searchInput);
  };

  // Allow pressing "Enter" key to submit search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchTrigger();
    }
  };

  // 2. Fetch Driver List from API
  const fetchDriverList = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await getDriverList(
        accessToken,
        chunkPage,
        chunkSize,
        backendSearchTerm, // Sent to backend only when updated via button
      );

      setTotalRecords(data?.data?.totalRecords || 0);

      const driverList = Array.isArray(data?.data?.driver)
        ? data.data.driver.map((d) => ({
            d_id: d.dId,
            name: `${d.dFirstName || ""} ${d.dLastName || ""}`.trim(),
            license: d.licenseNo,
            reg_id: d.sts?.[0]?.reg_id || "",
            phone: d.sts?.[0]?.phNo || "",
          }))
        : [];

      driverList.sort((a, b) => Number(b.d_id) - Number(a.d_id));
      setDrivers(driverList);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast.error("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when chunkPage changes or confirmed search term updates
  useEffect(() => {
    fetchDriverList();
  }, [chunkPage, backendSearchTerm, accessToken]);

  // Calculate sliding windows for pagination
  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  const relativeIndexStart = ((currentPage - 1) * rowsPerPage) % chunkSize;
  const currentRows = drivers.slice(
    relativeIndexStart,
    relativeIndexStart + rowsPerPage,
  );

  // Manage backend chunks dynamically based on active page
  useEffect(() => {
    const requiredChunk =
      Math.floor(((currentPage - 1) * rowsPerPage) / chunkSize) + 1;
    if (requiredChunk !== chunkPage) {
      setChunkPage(requiredChunk);
    }
  }, [currentPage]);

  // Navigation handlers
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleDelete = async (driverId) => {
    try {
      const res = await deleteDriver(accessToken, driverId);
      if (res.success) {
        toast.success("Driver deleted successfully");
        setDrivers((prev) => prev.filter((d) => d.d_id !== driverId));
        setTotalRecords((prev) => Math.max(0, prev - 1));
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
    setCurrentPage(1);
    setChunkPage(1);
    await fetchDriverList();
    closeModal();
  };

  // Auto open modal only if it's completely finished loading initial empty database
  useEffect(() => {
    if (!loading && totalRecords === 0 && backendSearchTerm === "") {
      setShowModal(true);
    }
  }, [loading, totalRecords, backendSearchTerm]);

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
                Showing {currentRows.length} of {totalRecords} driver(s)
              </p>

              {/* Wrapped Input and Button layout */}
              <div className="flex w-full sm:w-auto gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by name, ..."
                  className="w-full sm:w-64 border rounded px-3 py-1 text-sm focus:outline-none focus:ring focus:border-blue-400"
                />
                <Button
                  size="sm"
                  onClick={handleSearchTrigger}
                  disabled={loading}
                  className="px-4 bg-blue-700 hover:bg-blue-800 text-white"
                >
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 w-full items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                  <div className="text-sm text-gray-500">Updating list...</div>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block sm:hidden space-y-4">
                  {currentRows.length > 0 ? (
                    currentRows.map((row, i) => (
                      <div
                        key={row.d_id}
                        className="border rounded-lg p-4 shadow-sm bg-gray-50"
                      >
                        <div className="text-sm font-medium text-gray-800">
                          #{(currentPage - 1) * rowsPerPage + i + 1} -{" "}
                          {row.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          License: {row.license}
                          <br />
                          Phone: {row.phone}
                        </div>
                        <div className="flex gap-2 mt-3">
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
                      No drivers found.
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
                              <td className="px-4 py-2 border">
                                {row.license}
                              </td>
                              <td className="px-4 py-2 border">{row.phone}</td>
                              <td className="px-4 py-2 border">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(row.d_id)}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center text-gray-500 py-4"
                            >
                              No drivers found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between mt-4 text-sm items-center">
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
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
              </>
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
