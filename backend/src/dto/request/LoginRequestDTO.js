const validator = require("validator");

class LoginRequestDTO {
  constructor(data) {
    this.email = validator.normalizeEmail(
      (data.email || "").trim().toLowerCase(),
    );

    this.password = String(data.password || "").trim();
  }

  validate() {
    const errors = [];

    if (!this.email) {
      errors.push("Email is required");
    }

    if (this.email && !validator.isEmail(this.email)) {
      errors.push("Invalid email format");
    }

    if (!this.password) {
      errors.push("Password is required");
    }

    if (this.email && this.email.length > 100) {
      errors.push("Email too long");
    }

    if (this.password && this.password.length > 100) {
      errors.push("Password too long");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = LoginRequestDTO;
