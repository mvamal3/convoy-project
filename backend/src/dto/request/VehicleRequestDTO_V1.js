class VehicleRequestDTO {
  constructor(data) {
    this.vOwnName = data.vOwnName || null;
    this.vNum = data.vNum;
    this.vCat = data.vCat;
    this.otherCat = data.vCat === "Other" ? data.otherCat : null;
    this.ownershipType = data.ownershipType;
    this.deptName = data.ownershipType === "Government" ? data.deptName : null;
    this.vPurpose = data.vPurpose;
    this.otherPurpose = data.vPurpose === "Other" ? data.otherPurpose : null;

    // ✅ Convert seating safely to number
    let seatingValue = Number(data.vSeating) || 0;

    // ✅ Auto-limit based on category
    if (data.vCat === "Car" && seatingValue > 5) seatingValue = 5;
    if (data.vCat === "SUV" && seatingValue > 7) seatingValue = 7;

    // ✅ Reset to 0 if category changes (safety)
    if (!data.vCat) {
      seatingValue = 0;
    }

    this.vSeating = seatingValue;

    this.loadCapacity = data.loadCapacity || null;
    this.regDate = data.regDate || null;
    // this.status = data.status !== undefined ? data.status : 1;
  }

  validate() {
    const errors = [];

    // ✅ String field checks (use trim safely)
    if (!this.vNum || String(this.vNum).trim() === "")
      errors.push("Vehicle number is required");
    if (!this.vCat || String(this.vCat).trim() === "")
      errors.push("Vehicle category is required");
    if (!this.ownershipType || String(this.ownershipType).trim() === "")
      errors.push("Ownership type is required");
    if (!this.vPurpose || String(this.vPurpose).trim() === "")
      errors.push("Vehicle purpose is required");

    // ✅ Seating capacity must be > 0
    if (!this.vSeating || this.vSeating <= 0)
      errors.push("Vehicle seating capacity is required");

    // Optional “Other” validations
    if (this.vCat === "Other" && !this.otherCat?.trim()) {
      errors.push(
        "Other category description is required when 'Other' is selected",
      );
    }

    if (this.ownershipType === "Government" && !this.deptName?.trim()) {
      errors.push(
        "Government department name is required when 'Government' is selected",
      );
    }

    if (this.vPurpose === "Other" && !this.otherPurpose?.trim()) {
      errors.push(
        "Other purpose description is required when 'Other' is selected",
      );
    }

    // Optional date check
    if (this.regDate && isNaN(new Date(this.regDate).getTime())) {
      errors.push("Invalid registration date format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = VehicleRequestDTO;
