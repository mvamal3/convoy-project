class AdminLoginRequestDTO {
  constructor({ userid, password }) {
    this.userid = userid; // frontend sends userid
    this.password = password;
  }

  validate() {
    const errors = [];

    if (!this.userid) errors.push("User ID is required");
    if (!this.password) errors.push("Password is required");

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = AdminLoginRequestDTO;
