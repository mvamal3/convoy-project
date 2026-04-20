class DriverRequestDTO {
  constructor(data) {
    console.log(data);
    // ✅ driver_tbl fields
    this.licenseNo = data.licenseNo;
    this.title = data.title || null;
    this.dFirstName = data.dFirstName;
    this.dLastName = data.dLastName;
    // this.age = data.age;                         // Required
    this.gender = data.gender || null; // Optional
    this.son_of = data.son_of; // REQUIRED
    this.residence_of = data.residence_of;
    this.dStatus = data.dStatus ?? "active"; // Default: 'active'
    this.phNo = data.phNo || null;

    this.status = data.status ?? this.dStatus;
  }

  validate() {
    const errors = [];

    /* ---------- Trimmed versions for checks ---------- */
    const licenseNo = this.licenseNo?.trim();
    const title = this.title?.trim();
    const dFirstName = this.dFirstName?.trim();
    const dLastName = this.dLastName?.trim();
    // const age = this.age;                         // Age (number, no trimming)
    const dStatus = this.dStatus?.trim();
    const son_of = this.son_of?.trim();
    const residence_of = this.residence_of?.trim();

    /* ---------- Required-field checks ---------- */
    if (!licenseNo) errors.push("License number is required");
    if (!dFirstName) errors.push("Driver first name is required");
    if (!dLastName) errors.push("Driver last name is required");
    if (!son_of) errors.push("S/O (Father or Guardian name) is required");
    if (!residence_of) errors.push("Residence of driver is required");
    // if (age === undefined || age === null) errors.push('Age is required');
    // else if (typeof age !== 'number' || age < 18 || age > 100) {
    //   errors.push('Age must be a number between 18 and 100');
    // }

    /* ---------- Format validations ---------- */
    const namePattern = /^[A-Za-z\s.'-]+$/;
    if (dFirstName && !namePattern.test(dFirstName)) {
      errors.push(
        "Driver first name may contain only letters and standard punctuation",
      );
    }
    if (dLastName && !namePattern.test(dLastName)) {
      errors.push(
        "Driver last name may contain only letters and standard punctuation",
      );
    }
    if (son_of && !namePattern.test(son_of)) {
      errors.push("S/O name contains invalid characters");
    }

    // Enumerated checks
    const validStatuses = ["active", "inactive", "blocked"];
    if (dStatus && !validStatuses.includes(dStatus)) {
      errors.push(`d_status must be one of: ${validStatuses.join(", ")}`);
    }

    // Gender validation (optional but must match enum if provided)
    const validGenders = ["Male", "Female", "Other", "Prefer not to say"];
    if (this.gender && !validGenders.includes(this.gender)) {
      errors.push(`Gender must be one of: ${validGenders.join(", ")}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = DriverRequestDTO;
