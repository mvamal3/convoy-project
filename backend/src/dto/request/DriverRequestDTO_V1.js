const validator = require("validator");

class DriverRequestDTO {
  constructor(data = {}) {

    // ---------- Helper functions ----------

    const cleanText = (value) => {
      if (typeof value !== "string") return "";

      return validator
        .stripLow(value.trim())
        .replace(/\s+/g, " ");
    };

    const escapeText = (value) => {
      return validator.escape(cleanText(value));
    };

    const cleanName = (value) => {
      if (typeof value !== "string") return "";

      return cleanText(value)
        .replace(/[^A-Za-z\s.'-]/g, "");
    };

    const cleanPhone = (value) => {
      if (typeof value !== "string" && typeof value !== "number") {
        return "";
      }

      return String(value).replace(/\D/g, "").slice(0, 10);
    };

    const cleanLicense = (value) => {
      if (typeof value !== "string") return "";

      return cleanText(value)
        .toUpperCase()
        .replace(/[^A-Z0-9/-]/g, "")
        .slice(0, 20);
    };


    // ---------- Input sanitization ----------

    this.licenseNo = cleanLicense(data.licenseNo);

    this.title = escapeText(data.title);

    this.dFirstName = escapeText(cleanName(data.dFirstName));

    this.dLastName = escapeText(cleanName(data.dLastName));

    this.gender = escapeText(data.gender);

    this.son_of = escapeText(cleanName(data.son_of));

    this.residence_of = escapeText(data.residence_of);

    this.phNo = cleanPhone(data.phNo);


    // ---------- Backend controlled values ----------

    this.dStatus = "active";
    this.status = "active";
  }

  validate() {
    const errors = [];

    // ---------- Values ----------

    const licenseNo = this.licenseNo.trim();
    const title = this.title.trim();
    const dFirstName = this.dFirstName.trim();
    const dLastName = this.dLastName.trim();
    const gender = this.gender.trim();
    const son_of = this.son_of.trim();
    const residence_of = this.residence_of.trim();
    const phNo = this.phNo.trim();

    // ---------- Required validations ----------

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


    // ---------- Name validation ----------

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


    // ---------- License validation ----------

    const licensePattern = /^[A-Z0-9/-]{5,20}$/;

    if (licenseNo && !licensePattern.test(licenseNo)) {
      errors.push("Invalid license number format");
    }


    // ---------- Phone validation ----------

    if (phNo && !/^[0-9]{10}$/.test(phNo)) {
      errors.push("Invalid phone number");
    }


    // ---------- Enum validation ----------

    const validTitles = ["Mr", "Ms", "Mrs"];

    if (title && !validTitles.includes(title)) {
      errors.push("Invalid title");
    }

    const validGenders = ["Male", "Female", "Other"];

    if (gender && !validGenders.includes(gender)) {
      errors.push(
        `Gender must be one of: ${validGenders.join(", ")}`
      );
    }


    // ---------- Length validation ----------

    if (dFirstName.length > 50) {
      errors.push("Driver first name too long");
    }

    if (dLastName.length > 50) {
      errors.push("Driver last name too long");
    }

    if (son_of.length > 100) {
      errors.push("S/O name too long");
    }

    if (residence_of.length > 300) {
      errors.push("Residence address too long");
    }

    if (licenseNo.length > 20) {
      errors.push("License number too long");
    }


    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = DriverRequestDTO;