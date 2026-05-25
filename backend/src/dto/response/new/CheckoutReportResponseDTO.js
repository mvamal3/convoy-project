const CheckoutReportResponseDTO = (trip) => {
  return {
    id: trip.id,

    tId: trip.tId,

    checkoutdate: trip.checkoutdate,

    checkouttime: trip.checkouttime,

    status: trip.status,

    remarks: trip.remarks,

    vehicleDetails: trip.trip?.vehicle
      ? {
          vId: trip.trip.vehicle.vId,
          vNum: trip.trip.vehicle.vNum,
          vCat: trip.trip.vehicle.vCat,
        }
      : null,

    driverDetails: trip.trip?.driver
      ? {
          dId: trip.trip.driver.dId,
          dFirstName: trip.trip.driver.dFirstName,
          dLastName: trip.trip.driver.dLastName,
        }
      : null,

    checkpostDetails: trip.checkpostLocation
      ? {
          id: trip.checkpostLocation.id,
          location: trip.checkpostLocation.location,
        }
      : null,

    approveDetails: trip.approveTrip
      ? {
          id: trip.approveTrip.id,
          tId: trip.approveTrip.tId,
          arrdate: trip.approveTrip.arrdate,
          arrtime: trip.approveTrip.arrtime,
          remarks: trip.approveTrip.remarks,
          astatus: trip.approveTrip.astatus,
          convey: trip.approveTrip.convey || null,
        }
      : null,
  };
};

module.exports = CheckoutReportResponseDTO;
