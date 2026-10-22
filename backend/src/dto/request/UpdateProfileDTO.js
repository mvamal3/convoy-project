class UpdateProfileDTO {
  static validate(profileData) {
    const errors = [];

    if (!profileData || typeof profileData !== "object" ||
        Array.isArray(profileData)) {
      return {
        isValid: false,
        errors: ["Invalid profile data"],
      };
    }

    const {
      userid,
      title,
      firstName,
      lastName,
      ownContact,
      ownAddress,
    } = profileData;

    // Check user ID
    if (typeof userid !== "string" || !userid.trim()) {
      errors.push("User ID is required");
    }

    // Validate HTML and script content
    const containsHtml = (value) =>
      typeof value === "string" &&
      /<\s*\/?\s*[a-z][^>]*>|<\s*![\s\S]*?--\s*>|<\s*\?[\s\S]*?\?>/i.test(value);

    const fields = {
      title,
      firstName,
      lastName,
      ownContact,
      ownAddress,
    };

    for (const [field, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null &&
          typeof value !== "string") {
        errors.push(`${field} must be a string`);
        continue;
      }

      if (containsHtml(value)) {
        errors.push(`HTML or script content is not allowed in ${field}`);
      }
    }

    // Required fields
    if (typeof firstName !== "string" || !firstName.trim()) {
      errors.push("First name is required");
    }

    if (typeof lastName !== "string" || !lastName.trim()) {
      errors.push("Last name is required");
    }

    if (typeof ownContact !== "string" ||
        !/^\d{10}$/.test(ownContact.trim())) {
      errors.push("Contact number must contain exactly 10 digits");
    }

    if (typeof ownAddress !== "string" || !ownAddress.trim()) {
      errors.push("Address is required");
    }

    // Length checks
    const maxLengths = {
      title: 10,
      firstName: 255,
      lastName: 255,
      ownContact: 20,
      ownAddress: 5000,
    };

    for (const [field, maxLength] of Object.entries(maxLengths)) {
      const value = fields[field];

      if (typeof value === "string" && value.length > maxLength) {
        errors.push(`${field} must not exceed ${maxLength} characters`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = UpdateProfileDTO;