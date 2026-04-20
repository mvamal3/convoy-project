class PoliceRegistrationDto {
  constructor(data) {
    // User fields
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;

    // Registration fields
    this.title = data.title || null;
    this.designation = data.designation || null;
    this.emp_id = data.emp_id || null;
    this.checkpost = data.checkpost || null;
    this.contact = data.contact;
    this.status = data.status ?? 1;

    // Flags
    this.isActive = data.isActive ?? true;
    this.role = data.role || "police";
  }

  validate() {
    const errors = [];

    const email = this.email?.trim();
    const password = this.password?.trim();
    const firstName = this.firstName?.trim();
    const lastName = this.lastName?.trim();
    const contact = this.contact?.trim();

    // Required checks
    if (!firstName) errors.push("First name is required");
    if (!lastName) errors.push("Last name is required");
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");
    if (!contact) errors.push("Contact number is required");

    // Format checks
    if (contact && !/^\d{10}$/.test(contact)) {
      errors.push("Contact number must be exactly 10 digits");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format");
    }

    if (password && password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = PoliceRegistrationDto;
