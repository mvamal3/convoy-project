const validator = require("validator");
const { checkPassword } = require("../../utils/passwordPolicy");

// Request DTOs for OTP resend, forgot/change password and the admin
// citizen and audit-log screens.

const cleanEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const emailErrors = (email) => {
  if (!email) return ["Email is required"];
  if (email.length > 100 || !validator.isEmail(email)) {
    return ["Invalid email format"];
  }
  return [];
};

const RESET_ACCOUNT_TYPES = ["user", "police"];

const result = (errors) => ({ isValid: errors.length === 0, errors });

class ResendOtpDTO {
  constructor(data = {}) {
    this.email = cleanEmail(data.email);
  }

  validate() {
    return result(emailErrors(this.email));
  }
}

class ForgotPasswordRequestDTO {
  constructor(data = {}) {
    this.accountType = String(data.accountType || "");
    this.email = cleanEmail(data.email);
  }

  validate() {
    const errors = emailErrors(this.email);
    if (!RESET_ACCOUNT_TYPES.includes(this.accountType)) {
      errors.push("Invalid account type");
    }
    return result(errors);
  }
}

class ResetPasswordDTO extends ForgotPasswordRequestDTO {
  constructor(data = {}) {
    super(data);
    this.otp = String(data.otp || "").trim();
    this.newPassword = typeof data.newPassword === "string" ? data.newPassword : "";
    this.confirmPassword =
      typeof data.confirmPassword === "string" ? data.confirmPassword : "";
  }

  validate() {
    const { errors } = super.validate();
    if (!/^\d{6}$/.test(this.otp)) errors.push("Enter the 6-digit OTP");

    const passwordError = checkPassword(this.newPassword);
    if (passwordError) errors.push(passwordError);
    if (this.newPassword !== this.confirmPassword) {
      errors.push("Passwords do not match");
    }
    return result(errors);
  }
}

class ChangePasswordDTO {
  constructor(data = {}) {
    this.oldPassword = typeof data.oldPassword === "string" ? data.oldPassword : "";
    this.newPassword = typeof data.newPassword === "string" ? data.newPassword : "";
    this.confirmPassword =
      typeof data.confirmPassword === "string" ? data.confirmPassword : "";
  }

  validate() {
    const errors = [];
    if (!this.oldPassword || this.oldPassword.length > 100) {
      errors.push("Current password is required");
    }

    const passwordError = checkPassword(this.newPassword);
    if (passwordError) errors.push(passwordError);
    if (this.newPassword !== this.confirmPassword) {
      errors.push("Passwords do not match");
    }
    if (this.oldPassword && this.newPassword === this.oldPassword) {
      errors.push("New password must be different from the current password");
    }
    return result(errors);
  }
}

// Page/limit/search shared by the admin list screens.
class AdminListDTO {
  constructor(data = {}) {
    this.page = Math.max(parseInt(data.page, 10) || 1, 1);
    this.limit = Math.min(Math.max(parseInt(data.limit, 10) || 10, 1), 100);
    this.search = String(data.search || "").trim();
  }

  validate() {
    const errors = [];
    if (this.search.length > 100) errors.push("Search text too long");
    return result(errors);
  }
}

const CITIZEN_STATUSES = ["all", "active", "pending", "frozen", "locked"];

class CitizenListDTO extends AdminListDTO {
  constructor(data = {}) {
    super(data);
    this.status = String(data.status || "all");
  }

  validate() {
    const { errors } = super.validate();
    if (!CITIZEN_STATUSES.includes(this.status)) errors.push("Invalid status");
    return result(errors);
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

class AuditLogListDTO extends AdminListDTO {
  constructor(data = {}) {
    super(data);
    this.limit = Math.min(Math.max(parseInt(data.limit, 10) || 20, 1), 100);
    this.action = String(data.action || "");
    this.actorType = String(data.actorType || "");
    this.status = String(data.status || "");
    this.from = String(data.from || "");
    this.to = String(data.to || "");
  }

  validate() {
    const { errors } = super.validate();
    if (this.action && !/^[A-Z_]{1,50}$/.test(this.action)) {
      errors.push("Invalid action");
    }
    if (this.actorType && !["user", "police", "admin"].includes(this.actorType)) {
      errors.push("Invalid account type");
    }
    if (this.status && !["success", "failure"].includes(this.status)) {
      errors.push("Invalid status");
    }
    if ((this.from && !DATE.test(this.from)) || (this.to && !DATE.test(this.to))) {
      errors.push("Dates must be YYYY-MM-DD");
    }
    return result(errors);
  }
}

class AccountRefDTO {
  constructor(data = {}, allowedTypes = ["user", "police"]) {
    this.accountType = String(data.accountType || "");
    this.id = String(data.id || "").trim();
    this.allowedTypes = allowedTypes;
  }

  validate() {
    const errors = [];
    if (!this.allowedTypes.includes(this.accountType)) {
      errors.push("Invalid account type");
    }
    if (!this.id || this.id.length > 64 || !/^[A-Za-z0-9-]+$/.test(this.id)) {
      errors.push("Invalid account ID");
    }
    return result(errors);
  }
}

module.exports = {
  ResendOtpDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  CitizenListDTO,
  AuditLogListDTO,
  AccountRefDTO,
};
