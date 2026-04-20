class RegistrationDto {
  constructor(data) {
    // ✅ Registration fields
    this.title = data.title || null;
    //this.owner_name = data.owner_name;
    this.orgName = data.orgName || null;
    this.ownContact = data.ownContact;
    this.ownAddress = data.ownAddress;
    this.isOrg = data.isOrg ?? 0;
    this.status = data.status ?? 1;
    this.docId = data.docId || null;
    this.docIdtype = data.docIdtype || null;

    this.govtsubcategory = data.govtsubcat || null;
    this.govtDeptName = data.govtdeptName || null;

    // ✅ Location fields
    this.district_code = data.district_code || null;
    this.subdistrict_code = data.subdistrict_code || null;
    this.village_code = data.village_code || null;

    // ✅ User fields (skip user_id since it's foreign key derived from user)
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.OTP = data.OTP;

    this.role = data.role || "user";
    this.isActive = data.isActive ?? true;
  }

  validate() {
    const errors = [];

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
    const OTP = this.OTP;

    // Required fields check
    if (!title) errors.push("Title is required");
    if (!firstName) errors.push("First name is required");
    if (!lastName) errors.push("Last name is required");
    if (!ownContact) errors.push("Owner contact is required");
    if (!ownAddress) errors.push("Owner address is required");
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");
    //if (!OTP) errors.push('OTP is required');

    // Location hierarchy validation
    if (villageCode && !subdistrictCode) {
      errors.push("Subdistrict code is required when village code is provided");
    }
    if (subdistrictCode && !districtCode) {
      errors.push(
        "District code is required when subdistrict code is provided"
      );
    }
    if (villageCode && !districtCode) {
      errors.push("District code is required when village code is provided");
    }

    if (ownContact && !/^\d{10}$/.test(ownContact)) {
      errors.push("Mobile number must be exactly 10 digits");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format");
    }

    if (password && password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = RegistrationDto;
