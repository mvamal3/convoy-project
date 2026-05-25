const validator = require("validator");

class PoliceLoginRequestDTO {
  constructor(data) {
    this.email =
      validator.normalizeEmail(
        validator.escape(
          String(data.email || "")
            .trim()
            .toLowerCase(),
        ),
      ) || "";

    this.password = validator.escape(String(data.password || "").trim());
  }

  validate() {
    const errors = [];

    // Email validation
    if (!this.email) {
      errors.push("Email is required");
    }

    if (this.email && !validator.isEmail(this.email)) {
      errors.push("Invalid email format");
    }

    // Password validation
    if (!this.password) {
      errors.push("Password is required");
    }

    // Max length validation
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

module.exports = PoliceLoginRequestDTO;
