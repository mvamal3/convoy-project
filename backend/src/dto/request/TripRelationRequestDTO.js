class TripPassengerRequestDTO {
  constructor(data) {
    this.tripId = data.tripId;
    this.passengerId = data.passengerId;
    this.Status = data.Status ?? 'Booked'; // Default status
  }

  /**
   * Basic synchronous validation.
   * Returns { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    const tripId = this.tripId?.toString().trim();
    const passengerId = this.passengerId?.toString().trim();
    const Status = this.Status?.trim();

    // Required fields
    if (!tripId) errors.push('Trip ID (tripId) is required');
    if (!passengerId) errors.push('Passenger ID (passengerId) is required');

    // Status enum validation
    const validStatuses = ['Booked', 'Cancelled'];
    if (Status && !validStatuses.includes(Status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = TripPassengerRequestDTO;
