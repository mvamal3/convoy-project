class GetTripDetailsByDateRequestDTO {
  constructor(data) {
    //  Default value
    this.locationid = null;

    //  Validation
    if (data.locationid !== undefined && data.locationid !== null) {
      const locationid = Number(data.locationid);

      //  Check valid number
      if (Number.isNaN(locationid)) {
        throw new Error("locationid must be a valid number");
      }

      this.locationid = locationid;
    }
  }
}

module.exports = GetTripDetailsByDateRequestDTO;
