class DriverStatusRequestDTO {
  constructor(data) {
    this.reg_id = data.reg_id;
    this.d_id = data.d_id;
    this.Phone_no = data.Phone_no;
    this.Status = data.Status ?? 'Active'; // default to 'Active'
  }

  /**
   * Basic synchronous validation.
   * Returns { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    const reg_id = this.reg_id?.toString().trim();
    const d_id = this.d_id?.toString().trim();
    const Phone_no = this.Phone_no?.toString().trim();
    const Status = this.Status?.trim();

    // Required fields
    if (!reg_id) errors.push('Registration ID (reg_id) is required');
    if (!d_id) errors.push('Driver ID (d_id) is required');
    if (!Phone_no) errors.push('Phone number is required');

    // Phone number validation
    if (Phone_no && !/^\d{10}$/.test(Phone_no)) {
      errors.push('Phone number must be exactly 10 digits');
    }

    // Status enum validation
    const validStatuses = ['Active', 'Inactive'];
    if (Status && !validStatuses.includes(Status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = DriverStatusRequestDTO;