class DriverStatusResponseDTO {
  constructor(driverStatus) {
    this.reg_id = driverStatus.reg_id;
    this.d_id = driverStatus.d_id;
    this.Phone_no = driverStatus.Phone_no;
    this.Status = driverStatus.Status;

    // Optional joined driver details (if included in query)
    if (driverStatus.driver) {
      this.driver = {
        d_id: driverStatus.driver.d_id,
        license_no: driverStatus.driver.license_no,
        d_name: driverStatus.driver.d_name,
        v_owner_name: driverStatus.driver.v_owner_name,
        v_org_name: driverStatus.driver.v_org_name,
        v_org_id: driverStatus.driver.v_org_id,
        d_status: driverStatus.driver.d_status
      };
    }

    // Optional joined registration details (if included in query)
    if (driverStatus.registration) {
      this.registration = {
        reg_id: driverStatus.registration.reg_id,
        v_owner_name: driverStatus.registration.v_owner_name,
        v_owner_contact: driverStatus.registration.v_owner_contact,
        v_owner_address: driverStatus.registration.v_owner_address,
        is_org: driverStatus.registration.is_org,
        status: driverStatus.registration.status
      };
    }
  }
}

module.exports = DriverStatusResponseDTO;