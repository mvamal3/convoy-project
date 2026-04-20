import { useState, useEffect, useCallback } from "react";

export const useServerPagination = (fetchFunction, options = {}) => {
  const rowsPerPage = options.rowsPerPage || 10;
  const batchSize = options.batchSize || 100;

  const [batchPage, setBatchPage] = useState(1);
  const [dataRows, setDataRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 🔹 FETCH DATA
  const fetchData = useCallback(async () => {
    if (searchTerm) return;

    setLoading(true);
    try {
      const res = await fetchFunction({
        page: batchPage,
        limit: batchSize,
      });

      setDataRows(res.trips || []);
      setTotalRecords(res.totalRecords || 0);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, batchPage, batchSize, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔹 SEARCH
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const res = await fetchFunction({
        page: 1,
        limit: batchSize,
        searchTerm,
      });

      setDataRows(res.trips || []);
      setTotalRecords(res.trips?.length || 0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setBatchPage(1);
    setCurrentPage(1);
  };

  // 🔹 PAGINATION
  const handleNext = () => {
    const nextPage = currentPage + 1;

    if (!searchTerm && nextPage > batchPage * (batchSize / rowsPerPage)) {
      setBatchPage((prev) => prev + 1);
    }

    setCurrentPage(nextPage);
  };

  const handlePrev = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));

  const totalPages = searchTerm
    ? 1
    : Math.ceil(totalRecords / rowsPerPage);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;

  const currentRows = dataRows.slice(indexOfFirst, indexOfLast);

  return {
    currentRows,
    loading,
    currentPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    handleSearch,
    clearSearch,
    handleNext,
    handlePrev,
    totalRecords,
  };
};
