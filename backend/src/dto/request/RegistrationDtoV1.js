const validator = require("validator");

class RegistrationDto {
  constructor(data = {}) {
    // Convert unexpected values safely to strings
    const cleanString = (value) =>
      typeof value === "string" ? value.trim() : "";

    const escapeText = (value) =>
      validator.escape(cleanString(value));

    // Registration fields
    this.title = escapeText(data.title);
    this.orgName = escapeText(data.orgName);
    this.ownContact = cleanString(data.ownContact);
    this.ownAddress = escapeText(data.ownAddress);

    this.isOrg = data.isOrg ?? 0;
    this.status = data.status ?? 1;

    this.docId = escapeText(data.docId);
    this.docIdtype = escapeText(data.docIdtype);
    this.govtsubcategory = escapeText(data.govtsubcat);
    this.govtDeptName = escapeText(data.govtdeptName);

    // Location fields
    this.district_code = data.district_code || null;
    this.subdistrict_code = data.subdistrict_code || null;
    this.village_code = data.village_code || null;

    // User fields
    this.email = cleanString(data.email).toLowerCase();

    // IMPORTANT:
    // Never HTML-escape the password.
    this.password = typeof data.password === "string"
      ? data.password
      : "";

    this.firstName = escapeText(data.firstName);
    this.lastName = escapeText(data.lastName);

    // Server-controlled value
    this.role = "user";
  }

  validate() {
    const errors = [];

    const allowedTitles = ["Mr", "Mrs", "Miss"];
    const allowedOrgTypes = [0, 1, 2];

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,128}$/;

    const title = this.title;
    const firstName = this.firstName;
    const lastName = this.lastName;
    const ownContact = this.ownContact;
    const ownAddress = this.ownAddress;
    const email = this.email;
    const password = this.password;

    const districtCode = this.district_code;
    const subdistrictCode = this.subdistrict_code;
    const villageCode = this.village_code;

    // --------------------------------
    // Required fields
    // --------------------------------

    if (!title) errors.push("Title is required");
    if (!firstName) errors.push("First name is required");
    if (!lastName) errors.push("Last name is required");
    if (!ownContact) errors.push("Owner contact is required");
    if (!ownAddress) errors.push("Owner address is required");
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");

    // --------------------------------
    // Allowed values
    // --------------------------------

    if (title && !allowedTitles.includes(title)) {
      errors.push("Invalid title");
    }

    if (!allowedOrgTypes.includes(Number(this.isOrg))) {
      errors.push("Invalid organization type");
    }

    // --------------------------------
    // Name validation
    // --------------------------------

    if (firstName && !/^[A-Za-z\s'-]+$/.test(firstName)) {
      errors.push("First name contains invalid characters");
    }

    if (lastName && !/^[A-Za-z\s'-]+$/.test(lastName)) {
      errors.push("Last name contains invalid characters");
    }

    // --------------------------------
    // Length validation
    // --------------------------------

    if (title.length > 10) {
      errors.push("Title too long");
    }

    if (firstName.length > 30) {
      errors.push("First name too long");
    }

    if (lastName.length > 30) {
      errors.push("Last name too long");
    }

    if (this.orgName.length > 100) {
      errors.push("Organization name too long");
    }

    if (ownContact.length > 10) {
      errors.push("Mobile number too long");
    }

    if (ownAddress.length > 300) {
      errors.push("Address too long");
    }

    if (email.length > 100) {
      errors.push("Email too long");
    }

    if (this.docId.length > 50) {
      errors.push("Document ID too long");
    }

    if (this.docIdtype.length > 30) {
      errors.push("Document type too long");
    }

    if (this.govtDeptName.length > 100) {
      errors.push("Department name too long");
    }

    if (this.govtsubcategory.length > 50) {
      errors.push("Government subcategory too long");
    }

    // --------------------------------
    // Mobile validation
    // --------------------------------

    if (ownContact && !/^\d{10}$/.test(ownContact)) {
      errors.push("Mobile number must be exactly 10 digits");
    }

    // --------------------------------
    // Email validation
    // --------------------------------

    if (
      email &&
      !validator.isEmail(email, {
        allow_utf8_local_part: false,
      })
    ) {
      errors.push("Invalid email format");
    }

    // --------------------------------
    // Password validation
    // --------------------------------

    if (password && !strongPassword.test(password)) {
      errors.push(
        "Password must contain uppercase, lowercase, number and special character and be 8-128 characters long",
      );
    }

    // --------------------------------
    // Integer validation
    // --------------------------------

    if (
      districtCode !== null &&
      districtCode !== "" &&
      !Number.isInteger(Number(districtCode))
    ) {
      errors.push("Invalid district code");
    }

    if (
      subdistrictCode !== null &&
      subdistrictCode !== "" &&
      !Number.isInteger(Number(subdistrictCode))
    ) {
      errors.push("Invalid subdistrict code");
    }

    if (
      villageCode !== null &&
      villageCode !== "" &&
      !Number.isInteger(Number(villageCode))
    ) {
      errors.push("Invalid village code");
    }

    // --------------------------------
    // Location hierarchy validation
    // --------------------------------

    if (villageCode && !subdistrictCode) {
      errors.push(
        "Subdistrict code is required when village code is provided",
      );
    }

    if (subdistrictCode && !districtCode) {
      errors.push(
        "District code is required when subdistrict code is provided",
      );
    }

    if (villageCode && !districtCode) {
      errors.push(
        "District code is required when village code is provided",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = RegistrationDto;