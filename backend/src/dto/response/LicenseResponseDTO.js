// src/dtos/LicenseResponseDTO.js

class LicenseResponseDTO {
  static from(driver) {
    return {
      license_no: driver.license_no,
      name: driver.name,
      phone: driver.phone,
      status: driver.DriverStatus?.Status || 'Unknown',
      reg_id: driver.DriverStatus?.reg_id || null,
    };
  }
}

module.exports = LicenseResponseDTO;
