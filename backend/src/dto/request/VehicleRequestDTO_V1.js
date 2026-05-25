const validator = require("validator");

class VehicleRequestDTO {
  constructor(data) {
    // ✅ Sanitize all string inputs

    this.vOwnName = validator.escape(String(data.vOwnName || "").trim());

    this.vNum = validator.escape(
      String(data.vNum || "")
        .trim()
        .toUpperCase(),
    );

    this.vCat = validator.escape(String(data.vCat || "").trim());

    this.otherCat =
      data.vCat === "Other"
        ? validator.escape(String(data.otherCat || "").trim())
        : null;

    this.ownershipType = validator.escape(
      String(data.ownershipType || "").trim(),
    );

    this.deptName =
      data.ownershipType === "Government"
        ? validator.escape(String(data.deptName || "").trim())
        : null;

    this.vPurpose = validator.escape(String(data.vPurpose || "").trim());

    this.otherPurpose =
      data.vPurpose === "Other"
        ? validator.escape(String(data.otherPurpose || "").trim())
        : null;

    // ✅ Seating validation

    let seatingValue = Number(data.vSeating) || 0;

    if (data.vCat === "Car" && seatingValue > 5) {
      seatingValue = 5;
    }

    if (data.vCat === "SUV" && seatingValue > 7) {
      seatingValue = 7;
    }

    if (!data.vCat) {
      seatingValue = 0;
    }

    this.vSeating = seatingValue;

    // ✅ Sanitize load capacity

    this.loadCapacity = validator.escape(
      String(data.loadCapacity || "").trim(),
    );

    this.regDate = data.regDate || null;
  }

  validate() {
    const errors = [];

    // ✅ Allowed enums

    const allowedCategories = [
      "Car",
      "SUV",
      "Bus",
      "LMV Cargo",
      "Van",
      "Pickup Truck",
      "Truck",
      "HMV",
      "Ambulance",
      "Mortuary Van",
      "Water Tanker",
      "Oil Tanker",
      "LPG Tanker",
      "Tanker",
      "Other",
    ];

    const allowedOwnershipTypes = ["Commercial", "Private", "Government"];

    // ⚠️ Match frontend values properly
    const allowedPurposes = ["Passenger", "Cargo", "Other", "cargo_passenger"];

    // ✅ Required validations

    if (!this.vOwnName) {
      errors.push("Owner name is required");
    }

    if (!this.vNum) {
      errors.push("Vehicle number is required");
    }

    if (!this.vCat) {
      errors.push("Vehicle category is required");
    }

    if (!this.ownershipType) {
      errors.push("Ownership type is required");
    }

    if (!this.vPurpose) {
      errors.push("Vehicle purpose is required");
    }

    if (!this.vSeating || this.vSeating <= 0) {
      errors.push("Vehicle seating capacity is required");
    }

    // ✅ Owner name validation

    if (this.vOwnName && !/^[A-Za-z\s.-]+$/.test(this.vOwnName)) {
      errors.push("Owner name contains invalid characters");
    }

    // ✅ Vehicle number validation

    if (this.vNum && !/^[A-Z0-9\s-]{3,20}$/.test(this.vNum)) {
      errors.push("Invalid vehicle number format");
    }

    // ✅ Enum validation

    if (this.vCat && !allowedCategories.includes(this.vCat)) {
      errors.push("Invalid vehicle category");
    }

    if (
      this.ownershipType &&
      !allowedOwnershipTypes.includes(this.ownershipType)
    ) {
      errors.push("Invalid ownership type");
    }

    if (this.vPurpose && !allowedPurposes.includes(this.vPurpose)) {
      errors.push("Invalid vehicle purpose");
    }

    // ✅ Conditional validations

    if (this.vCat === "Other" && !this.otherCat?.trim()) {
      errors.push("Other category description is required");
    }

    if (this.ownershipType === "Government" && !this.deptName?.trim()) {
      errors.push("Department name is required for government vehicles");
    }

    if (this.vPurpose === "Other" && !this.otherPurpose?.trim()) {
      errors.push("Other purpose description is required");
    }

    // ✅ Length validations

    if (this.vOwnName && this.vOwnName.length > 100) {
      errors.push("Owner name too long");
    }

    if (this.vNum && this.vNum.length > 20) {
      errors.push("Vehicle number too long");
    }

    if (this.otherCat && this.otherCat.length > 100) {
      errors.push("Other category too long");
    }

    if (this.deptName && this.deptName.length > 100) {
      errors.push("Department name too long");
    }

    if (this.otherPurpose && this.otherPurpose.length > 100) {
      errors.push("Other purpose too long");
    }

    if (this.loadCapacity && this.loadCapacity.length > 50) {
      errors.push("Load capacity too long");
    }

    // ✅ Seating must be integer

    if (!Number.isInteger(this.vSeating)) {
      errors.push("Vehicle seating must be a whole number");
    }

    // ✅ Seating min/max validation

    if (this.vSeating < 1 || this.vSeating > 100) {
      errors.push("Invalid seating capacity");
    }

    // ✅ Seating limit validation

    if (this.vCat === "Car" && this.vSeating > 5) {
      errors.push("Car seating capacity cannot exceed 5");
    }

    if (this.vCat === "SUV" && this.vSeating > 7) {
      errors.push("SUV seating capacity cannot exceed 7");
    }

    // ✅ Date validation

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
