class VehicleStatusResponseDTO {
  constructor(statusRecord) {
    this.v_id = statusRecord.v_id;
    this.reg_id = statusRecord.reg_id;
    this.start_date = statusRecord.start_date;
    this.end_date = statusRecord.end_date;
    this.status = statusRecord.status;
  }
}

module.exports = VehicleStatusResponseDTO;