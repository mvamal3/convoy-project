class ApproveTripResponseDTO {
  static response(trips) {
    return trips.map((trip) => ({
      tId: trip.tId,
      origin: trip.origin,
      destination: trip.destination,
      date: trip.date,
      convoyTime: trip.convoyTime,

      originLocation: trip.originLocation,
      destinationLocation: trip.destinationLocation,

      vehicle: trip.vehicle,
      driver: trip.driver,

      passengers: trip.passengers || [],

      approveDetails: trip.approveDetails,
      verifiedDetails: trip.verifiedDetails,
    }));
  }
}

module.exports = ApproveTripResponseDTO;
