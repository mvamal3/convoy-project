class PoliceLoginRequestDTO {
  constructor(data) {
    this.email = data.email?.toLowerCase().trim();
    this.password = data.password;
  }

  validate() {
    const errors = [];

    // Email validation
    if (!this.email) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push("Invalid email format");
    }

    // Password validation
    if (!this.password) {
      errors.push("Password is required");
    } else if (this.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = PoliceLoginRequestDTO;
