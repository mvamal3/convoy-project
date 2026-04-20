
class DriverRequestDTO {
  constructor(data) {
    // ✅ driver_tbl fields
    this.d_id = data.d_id;                        // primary key (supply if not auto-inc)
    this.license_no = data.license_no;
    this.d_name = data.d_name;
    this.v_owner_name = data.v_owner_name;
    this.v_org_name = data.v_org_name || null;
    this.v_org_id = data.v_org_id || null;
    this.d_status = data.d_status ?? 'active';    // sensible default
    this.phone_no =  data.phone_no || null; // optional, can be null

    // ✅ driver_status_tbl link fields
    this.status = data.status ?? this.d_status;   // fall back to d_status
    // this.reg_id = data.reg_id;                    // FK to registration_tbl
  }

  /**
   * Basic synchronous validation.
   * Returns { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    /* ---------- Trimmed versions for checks ---------- */
    const d_id         = this.d_id?.toString().trim();
    const license_no   = this.license_no?.trim();
    const d_name       = this.d_name?.trim();
    const v_owner_name = this.v_owner_name?.trim();
    // const reg_id       = this.reg_id?.trim();
    const d_status     = this.d_status?.trim();

    /* ---------- Required-field checks ---------- */
    if (!d_id)         errors.push('Driver ID (d_id) is required');
    if (!license_no)   errors.push('License number is required');
    if (!d_name)       errors.push('Driver name is required');
    if (!v_owner_name) errors.push('Vehicle owner name is required');
    // if (!reg_id)       errors.push('Registration ID (reg_id) is required');

    /* ---------- Format validations ---------- */
    // • Indian driving-licence number pattern (simple heuristic)
    //   e.g. "MH1420230123456"  (state + RTO + year + number)
    // if (
    //   license_no &&
    //   !/^[A-Z]{2}\d{2}(19|20)\d{2}\d{7}$/.test(license_no)
    // ) {
    //   errors.push('Invalid licence number format');
    // }

    // • Alphabetic (plus spaces) for names
    const namePattern = /^[A-Za-z\s.'-]+$/;
    if (d_name && !namePattern.test(d_name)) {
      errors.push('Driver name may contain only letters and standard punctuation');
    }
    if (v_owner_name && !namePattern.test(v_owner_name)) {
      errors.push('Owner name may contain only letters and standard punctuation');
    }

    // • Enumerated status check
    const validStatuses = ['active', 'inactive', 'blocked'];
    if (d_status && !validStatuses.includes(d_status)) {
      errors.push(`d_status must be one of: ${validStatuses.join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = DriverRequestDTO;
