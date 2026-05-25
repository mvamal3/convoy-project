const validator = require("validator");

class RegistrationDto {
  constructor(data) {
    // ✅ Registration fields
    this.title = validator.escape((data.title || "").trim());

    this.orgName = validator.escape((data.orgName || "").trim());

    this.ownContact = validator.escape((data.ownContact || "").trim());

    this.ownAddress = validator.escape((data.ownAddress || "").trim());

    this.isOrg = data.isOrg ?? 0;

    this.status = data.status ?? 1;

    this.docId = validator.escape((data.docId || "").trim());

    this.docIdtype = validator.escape((data.docIdtype || "").trim());

    this.govtsubcategory = validator.escape((data.govtsubcat || "").trim());

    this.govtDeptName = validator.escape((data.govtdeptName || "").trim());

    // ✅ Location fields
    this.district_code = data.district_code || null;
    this.subdistrict_code = data.subdistrict_code || null;
    this.village_code = data.village_code || null;

    // ✅ User fields
    this.email = (data.email || "").trim().toLowerCase();

    this.password = data.password || "";

    this.firstName = validator.escape((data.firstName || "").trim());

    this.lastName = validator.escape((data.lastName || "").trim());

    // ✅ Fixed secure values
    this.role = "user";
  }

  validate() {
    const errors = [];

    const allowedTitles = ["Mr", "Mrs", "Miss"];
    const allowedOrgTypes = [0, 1, 2];

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    const title = this.title?.trim();
    const firstName = this.firstName?.trim();
    const lastName = this.lastName?.trim();
    const ownContact = this.ownContact?.trim();
    const ownAddress = this.ownAddress?.trim();
    const email = this.email?.trim();
    const password = this.password?.trim();

    const districtCode = this.district_code;
    const subdistrictCode = this.subdistrict_code;
    const villageCode = this.village_code;

    // ✅ Required fields
    if (!title) errors.push("Title is required");

    if (!firstName) errors.push("First name is required");

    if (!lastName) errors.push("Last name is required");

    if (!ownContact) errors.push("Owner contact is required");

    if (!ownAddress) errors.push("Owner address is required");

    if (!email) errors.push("Email is required");

    if (!password) errors.push("Password is required");

    // ✅ Title validation
    if (title && !allowedTitles.includes(title)) {
      errors.push("Invalid title");
    }

    // ✅ Organization type validation
    if (!allowedOrgTypes.includes(Number(this.isOrg))) {
      errors.push("Invalid organization type");
    }

    // ✅ Name validation
    if (firstName && !/^[A-Za-z\s]+$/.test(firstName)) {
      errors.push("First name must contain only letters");
    }

    if (lastName && !/^[A-Za-z\s]+$/.test(lastName)) {
      errors.push("Last name must contain only letters");
    }

    // ✅ Length validation
    if (title && title.length > 10) {
      errors.push("Title too long");
    }

    if (firstName && firstName.length > 30) {
      errors.push("First name too long");
    }

    if (lastName && lastName.length > 30) {
      errors.push("Last name too long");
    }

    if (this.orgName && this.orgName.length > 100) {
      errors.push("Organization name too long");
    }

    if (ownAddress && ownAddress.length > 300) {
      errors.push("Address too long");
    }

    if (email && email.length > 100) {
      errors.push("Email too long");
    }

    if (this.docId && this.docId.length > 50) {
      errors.push("Document ID too long");
    }

    if (this.docIdtype && this.docIdtype.length > 30) {
      errors.push("Document type too long");
    }

    if (this.govtDeptName && this.govtDeptName.length > 100) {
      errors.push("Department name too long");
    }

    if (this.govtsubcategory && this.govtsubcategory.length > 50) {
      errors.push("Government subcategory too long");
    }

    // ✅ Integer validation
    if (districtCode && !Number.isInteger(Number(districtCode))) {
      errors.push("Invalid district code");
    }

    if (subdistrictCode && !Number.isInteger(Number(subdistrictCode))) {
      errors.push("Invalid subdistrict code");
    }

    if (villageCode && !Number.isInteger(Number(villageCode))) {
      errors.push("Invalid village code");
    }

    // ✅ Password validation
    if (password && !strongPassword.test(password)) {
      errors.push(
        "Password must contain uppercase, lowercase, number and special character",
      );
    }

    // ✅ Mobile validation
    if (ownContact && !/^\d{10}$/.test(ownContact)) {
      errors.push("Mobile number must be exactly 10 digits");
    }

    // ✅ Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format");
    }

    // ✅ Location hierarchy validation
    if (villageCode && !subdistrictCode) {
      errors.push("Subdistrict code is required when village code is provided");
    }

    if (subdistrictCode && !districtCode) {
      errors.push(
        "District code is required when subdistrict code is provided",
      );
    }

    if (villageCode && !districtCode) {
      errors.push("District code is required when village code is provided");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = RegistrationDto;
