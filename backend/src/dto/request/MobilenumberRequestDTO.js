class MobilenumberRequestDTO {
  constructor(data) {
    this.mobileNumber = data.mobileNumber;
  }

  static validate(data) {
    const errors = [];

    if (!data.mobileNumber) {
      errors.push("Mobile number is required");
    } else if (!/^\d{10}$/.test(data.mobileNumber)) {
      errors.push("Mobile number must be exactly 10 digits");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = MobilenumberRequestDTO;
