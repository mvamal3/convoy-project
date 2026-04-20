class VehicleStatusRequestDTO {
  constructor(data) {
    this.v_id = data.v_id;
    this.reg_id = data.reg_id;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.status = data.status;
  }

  validate() {
    const errors = [];

    if (!this.v_id) errors.push('Vehicle ID (v_id) is required');
    if (!this.reg_id) errors.push('Registration ID (reg_id) is required');
    if (!this.start_date) errors.push('Start date is required');
    if (!this.status) errors.push('Status is required');

    // Optional: validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (this.start_date && !dateRegex.test(this.start_date)) {
      errors.push('Start date must be in YYYY-MM-DD format');
    }
    if (this.end_date && !dateRegex.test(this.end_date)) {
      errors.push('End date must be in YYYY-MM-DD format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = VehicleStatusRequestDTO;