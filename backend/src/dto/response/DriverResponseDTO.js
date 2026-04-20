class DriverResponseDTO {
  constructor(driver) {
    this.d_id = driver.d_id;
    this.license_no = driver.license_no;
    this.d_name = driver.d_name;
    this.v_owner_name = driver.v_owner_name;
    this.v_org_name = driver.v_org_name;
    this.v_org_id = driver.v_org_id;
    this.d_status = driver.d_status;

    // Optional nested registration details (if joined in query)
    if (driver.registration) {
      this.registration = {
        reg_id: driver.registration.reg_id,
        v_owner_name: driver.registration.v_owner_name,
        v_owner_contact: driver.registration.v_owner_contact,
        v_owner_address: driver.registration.v_owner_address,
        is_org: driver.registration.is_org,
        status: driver.registration.status
      };
    }
  }
}

module.exports = DriverResponseDTO;
