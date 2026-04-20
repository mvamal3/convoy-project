class RegisterRequestDTO {
  constructor(data) {
    this.email = data.email?.toLowerCase().trim();
    this.password = data.password;
    this.firstName = data.firstName?.trim();
    this.lastName = data.lastName?.trim();
  }

  validate() {
    const errors = [];

    if (!this.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('Invalid email format');
    }

    if (!this.password) {
      errors.push('Password is required');
    } else if (this.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!this.firstName) {
      errors.push('First name is required');
    } else if (this.firstName.length < 1 || this.firstName.length > 50) {
      errors.push('First name must be between 1 and 50 characters');
    }

    if (!this.lastName) {
      errors.push('Last name is required');
    } else if (this.lastName.length < 1 || this.lastName.length > 50) {
      errors.push('Last name must be between 1 and 50 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = RegisterRequestDTO;