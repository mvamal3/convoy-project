// src/dtos/LicenseRequestDTO.js

class LicenseRequestDTO {
  constructor(data) {
    this.license = data.license;
  }

  static validate(data) {
    const errors = [];

    if (!data.license || typeof data.license !== 'string' || data.license.trim() === '') {
      errors.push('License number is required and must be a valid string.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = LicenseRequestDTO;
