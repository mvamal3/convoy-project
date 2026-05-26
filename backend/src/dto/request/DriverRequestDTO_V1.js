const validator = require("validator");

class DriverRequestDTO {
  constructor(data) {
    // ✅ Sanitize and normalize inputs

    this.licenseNo = validator.escape(
      String(data.licenseNo || "")
        .trim()
        .toUpperCase(),
    );

    this.title = validator.escape(String(data.title || "").trim());

    this.dFirstName = validator.escape(String(data.dFirstName || "").trim());

    this.dLastName = validator.escape(String(data.dLastName || "").trim());

    this.gender = validator.escape(String(data.gender || "").trim());

    this.son_of = validator.escape(String(data.son_of || "").trim());

    this.residence_of = validator.escape(
      String(data.residence_of || "").trim(),
    );

    this.phNo = String(data.phNo || "").trim();

    // ✅ Backend controlled status
    this.dStatus = "active";
    this.status = "active";
  }

  validate() {
    const errors = [];

    /* ---------- Trimmed values ---------- */

    const licenseNo = this.licenseNo?.trim();
    const title = this.title?.trim();
    const dFirstName = this.dFirstName?.trim();
    const dLastName = this.dLastName?.trim();
    const gender = this.gender?.trim();
    const dStatus = this.dStatus?.trim();
    const son_of = this.son_of?.trim();
    const residence_of = this.residence_of?.trim();
    const phNo = this.phNo?.trim();

    /* ---------- Required validations ---------- */

    if (!licenseNo) {
      errors.push("License number is required");
    }

    if (!title) {
      errors.push("Title is required");
    }

    if (!dFirstName) {
      errors.push("Driver first name is required");
    }

    if (!dLastName) {
      errors.push("Driver last name is required");
    }

    if (!son_of) {
      errors.push("S/O (Father or Guardian name) is required");
    }

    if (!residence_of) {
      errors.push("Residence of driver is required");
    }

    if (!gender) {
      errors.push("Gender is required");
    }

    if (!phNo) {
      errors.push("Phone number is required");
    }

    /* ---------- Regex validations ---------- */

    const namePattern = /^[A-Za-z\s.'-]+$/;

    if (dFirstName && !namePattern.test(dFirstName)) {
      errors.push("Driver first name contains invalid characters");
    }

    if (dLastName && !namePattern.test(dLastName)) {
      errors.push("Driver last name contains invalid characters");
    }

    if (son_of && !namePattern.test(son_of)) {
      errors.push("S/O name contains invalid characters");
    }

    /* ---------- License validation ---------- */

    const licensePattern = /^[A-Z0-9/-]{5,20}$/;

    if (licenseNo && !licensePattern.test(licenseNo)) {
      errors.push("Invalid license number format");
    }

    /* ---------- Phone validation ---------- */

    if (phNo && !/^[0-9]{10}$/.test(phNo)) {
      errors.push("Invalid phone number");
    }

    /* ---------- Enum validations ---------- */

    const validTitles = ["Mr", "Ms", "Mrs"];

    if (title && !validTitles.includes(title)) {
      errors.push("Invalid title");
    }

    const validStatuses = ["active", "inactive", "blocked"];

    if (dStatus && !validStatuses.includes(dStatus)) {
      errors.push(`d_status must be one of: ${validStatuses.join(", ")}`);
    }

    const validGenders = ["Male", "Female", "Other"];

    if (gender && !validGenders.includes(gender)) {
      errors.push(`Gender must be one of: ${validGenders.join(", ")}`);
    }

    /* ---------- Length validations ---------- */

    if (dFirstName && dFirstName.length > 50) {
      errors.push("Driver first name too long");
    }

    if (dLastName && dLastName.length > 50) {
      errors.push("Driver last name too long");
    }

    if (son_of && son_of.length > 100) {
      errors.push("S/O name too long");
    }

    if (residence_of && residence_of.length > 300) {
      errors.push("Residence address too long");
    }

    if (licenseNo && licenseNo.length > 20) {
      errors.push("License number too long");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = DriverRequestDTO;
