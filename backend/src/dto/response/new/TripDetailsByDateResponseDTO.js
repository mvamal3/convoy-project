// dto/response/TripDetailsByDateResponseDTO.js

class TripDetailsByDateResponseDTO {
  static response(trips) {
    return trips.map((trip) => ({
      origin: trip.origin,
      destination: trip.destination,
      date: trip.date,
      convoyTime: trip.convoyTime,
      vId: trip.vId,
      tId: trip.tId,
      entrydatetime: trip.entrydatetime,
      verifiedtime: trip.verifiedtime,

      vehicle: trip.vehicle,

      convey: trip.convey,

      originLocation: trip.originLocation,

      destinationLocation: trip.destinationLocation,

      passengers: trip.passengers || [],
    }));
  }
}

module.exports = TripDetailsByDateResponseDTO;
