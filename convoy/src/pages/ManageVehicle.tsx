import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { getVehicleList } from "@/contexts/GetApi";
import AddVehicle from "@/components/Addvehicle";
import { deleteVehicle } from "@/contexts/PostApi";
import toast from "react-hot-toast";

const ManageVehicle = () => {
  const { accessToken } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Search states
  const [searchInput, setSearchInput] = useState("");
  const [backendSearchTerm, setBackendSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [chunkPage, setChunkPage] = useState(1);

  const [totalRecords, setTotalRecords] = useState(0);

  const rowsPerPage = 10;
  const chunkSize = 100;

  // Search Trigger
  const handleSearchTrigger = () => {
    setCurrentPage(1);
    setChunkPage(1);
    setBackendSearchTerm(searchInput);
  };

  // Enter Key Search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchTrigger();
    }
  };

  // Fetch Vehicle List
  const fetchVehicleList = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);

      const data = await getVehicleList(
        accessToken,
        chunkPage,
        chunkSize,
        backendSearchTerm,
      );

      setTotalRecords(data?.data?.totalRecords || 0);

      const vehicleList = Array.isArray(data?.data?.vehicle)
        ? data.data.vehicle.map((v) => ({
            v_id: v.vId?.toString(),
            v_owner_name: v.vOwnName || "",
            v_number: v.vNum || "",
            v_category: v.vCat || "",
            v_type: v.vCat === "Other" ? "Other" : v.vCat,
            v_type_other: v.otherCat || "",
            commercial_type: v.ownershipType || "",
            department_name: v.deptName || "",
            cargo_passenger: v.vPurpose || "",
            cargo_passenger_other: v.otherPurpose || "",
            v_capacity: "",
            v_loadCapacity: "",
            registration_date: v.sts?.[0]?.reg_id || "",
            vSeating: v.vSeating || "",
          }))
        : [];

      vehicleList.sort((a, b) => Number(b.v_id) - Number(a.v_id));

      setVehicles(vehicleList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);

      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, [accessToken, chunkPage, backendSearchTerm]);

  // Fetch data
  useEffect(() => {
    fetchVehicleList();
  }, [chunkPage, backendSearchTerm, accessToken]);

  // Delete Logic
  useEffect(() => {
    if (!deleteId) return;

    const performDelete = async () => {
      try {
        const res = await deleteVehicle(accessToken, deleteId);

        if (res?.success) {
          setVehicles((prev) => prev.filter((v) => v.v_id !== deleteId));

          setTotalRecords((prev) => Math.max(0, prev - 1));

          toast.success("Vehicle deleted successfully!");
        } else {
          toast.error(
            "Failed to delete vehicle: " + (res?.message || "Unknown error"),
          );
        }
      } catch (error) {
        console.error("Delete API error:", error);

        toast.error("Error deleting vehicle");
      } finally {
        setDeleteId(null);
      }
    };

    performDelete();
  }, [deleteId, accessToken]);

  // Delete confirmation
  const handleDelete = (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      setDeleteId(vehicleId);
    }
  };

  // Add Vehicle Success
  const handleSuccessAdd = async () => {
    setCurrentPage(1);
    setChunkPage(1);

    await fetchVehicleList();

    closeModal();
  };

  // Modal
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  // Total pages
  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  // Slice current rows from chunk
  const relativeIndexStart = ((currentPage - 1) * rowsPerPage) % chunkSize;

  const currentRows = vehicles.slice(
    relativeIndexStart,
    relativeIndexStart + rowsPerPage,
  );

  // Chunk switching
  useEffect(() => {
    const requiredChunk =
      Math.floor(((currentPage - 1) * rowsPerPage) / chunkSize) + 1;

    if (requiredChunk !== chunkPage) {
      setChunkPage(requiredChunk);
    }
  }, [currentPage]);

  // Pagination buttons
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Auto open modal if empty DB
  useEffect(() => {
    if (!loading && totalRecords === 0 && backendSearchTerm === "") {
      setShowModal(true);
    }
  }, [loading, totalRecords, backendSearchTerm]);

  // Loading UI
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Manage Vehicles</h1>

          <Button onClick={openModal} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Vehicle List</CardTitle>
          </CardHeader>

          <CardContent>
            {/* Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {currentRows.length} of {totalRecords} vehicle(s)
              </p>

              <div className="flex w-full sm:w-auto gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by vehicle number..."
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

            {/* Desktop Table */}
            <div className="hidden md:block">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-700 border">
                  <thead className="bg-gray-100 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Vehicle Number</th>
                      <th className="px-4 py-2 border">Owner Name</th>
                      <th className="px-4 py-2 border">Category</th>
                      <th className="px-4 py-2 border">Ownership</th>
                      <th className="px-4 py-2 border">Capacity</th>
                      <th className="px-4 py-2 border">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentRows.length > 0 ? (
                      currentRows.map((row, i) => (
                        <tr
                          key={row.v_id}
                          className="hover:bg-gray-50 border-b"
                        >
                          <td className="px-4 py-2 border">
                            {(currentPage - 1) * rowsPerPage + i + 1}
                          </td>

                          <td className="px-4 py-2 border">{row.v_number}</td>

                          <td className="px-4 py-2 border">
                            {row.v_owner_name}
                          </td>

                          <td className="px-4 py-2 border">{row.v_category}</td>

                          <td className="px-4 py-2 border">
                            {row.commercial_type}
                            {row.department_name
                              ? ` (${row.department_name})`
                              : ""}
                          </td>

                          <td className="px-4 py-2 border">
                            {row.vSeating} Person
                          </td>

                          <td className="px-4 py-2 border">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(row.v_id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-4 text-gray-500"
                        >
                          No vehicles found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {currentRows.length > 0 ? (
                currentRows.map((row, i) => (
                  <div
                    key={row.v_id}
                    className="border rounded-lg p-3 shadow-sm bg-white"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-800">
                        {row.v_number}
                      </span>

                      <span className="text-xs text-gray-500">
                        #{(currentPage - 1) * rowsPerPage + i + 1}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <strong>Owner:</strong> {row.v_owner_name}
                      </p>

                      <p>
                        <strong>Category:</strong> {row.v_category}
                      </p>

                      <p>
                        <strong>Ownership:</strong> {row.commercial_type}
                        {row.department_name ? ` (${row.department_name})` : ""}
                      </p>

                      <p>
                        <strong>Capacity:</strong> {row.vSeating} Person
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      className="mt-3 w-full"
                      onClick={() => handleDelete(row.v_id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No vehicles found
                </div>
              )}
            </div>

            {/* Pagination */}
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
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      {showModal && (
        <AddVehicle
          isOpen={showModal}
          onClose={closeModal}
          onSuccessAdd={handleSuccessAdd}
        />
      )}
    </DashboardLayout>
  );
};

export default ManageVehicle;
