class GetAllApproveTripRequestDTO {
  constructor(data) {
    // ✅ Optional pagination
    this.page = null;
    this.limit = null;

    if (data.page !== undefined) {
      const page = Number(data.page);

      if (Number.isNaN(page) || page < 1) {
        throw new Error("page must be a valid number");
      }

      this.page = page;
    }

    if (data.limit !== undefined) {
      const limit = Number(data.limit);

      if (Number.isNaN(limit) || limit < 1) {
        throw new Error("limit must be a valid number");
      }

      this.limit = limit;
    }

    // ✅ Filters
    this.checkpostid = data.checkpostid || null;
    this.conveyid = data.conveyid || null;
    this.filteredDate = data.filteredDate || null;
    this.searchTerm = data.searchTerm || "";
  }
}

module.exports = GetAllApproveTripRequestDTO;
