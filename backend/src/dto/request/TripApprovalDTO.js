class TripApprovalDTO {
  constructor(data) {
    this.tId = data.tId;
    this.approval = data.approval;
    this.convoyNo = data.convoyNo;
  }

  validate() {
    const errors = [];

    // Required and type checks
    if (this.tId === undefined || typeof this.tId !== 'number') {
      errors.push("Trip ID (tId) must be a number");
    }

    if (this.approval !== 0 && this.approval !== 1) {
      errors.push("Approval must be either 0 (denied) or 1 (approved)");
    }

    if (typeof this.convoyNo !== 'number' || this.convoyNo < 1 || this.convoyNo > 4) {
      errors.push("Convoy number must be between 1 and 4");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = TripApprovalDTO;
