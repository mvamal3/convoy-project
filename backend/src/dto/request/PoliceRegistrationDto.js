// ---------- Sanitizers ----------

// Plain text: normalise unicode, collapse whitespace, strip control/invisible
// characters. Characters outside each field's whitelist (e.g. < >) are
// rejected by the field rules below, not stripped. Does NOT truncate (length is validated, so
// data is rejected instead of silently altered).
const cleanText = (value) => {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[\p{Cc}\p{Cf}]/gu, "") // control + zero-width/invisible chars
    .trim();
};

const cleanEmail = (value) => cleanText(value).toLowerCase();

const cleanContact = (value) => cleanText(value).replace(/[\s-]/g, "");

// checkpost is a foreign key to origin_destination.id (integer).
// Returns null when empty, a number when valid digits, NaN otherwise.
const cleanCheckpost = (value) => {
  const text = cleanText(value);
  if (!text) return null;
  return /^\d+$/.test(text) ? Number(text) : NaN;
};

// Passwords are never trimmed or altered, only type-checked.
const cleanPassword = (value) => (typeof value === "string" ? value : "");

// ---------- Rules ----------

const MAX = {
  email: 254,
  password: 72, // bcrypt only uses the first 72 bytes
  name: 50,
  title: 10, // DB column is STRING(10)
  designation: 100,
  emp_id: 30,
};

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const TITLE_RE = /^[\p{L}\p{M}][\p{L}\p{M} .]*$/u;
const TEXT_RE = /^[\p{L}\p{M}\p{N} .,'()/&-]+$/u;
const EMP_ID_RE = /^[A-Za-z0-9/_-]+$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
const CONTACT_RE = /^\d{10}$/;

class PoliceRegistrationDto {
  constructor(data = {}) {
    // Only whitelisted fields are read from the request body.
    // role / isActive / status are NOT accepted from the client.
    this.email = cleanEmail(data.email);
    this.password = cleanPassword(data.password);
    this.firstName = cleanText(data.firstName);
    this.lastName = cleanText(data.lastName);

    this.title = cleanText(data.title) || null;
    this.designation = cleanText(data.designation) || null;
    this.emp_id = cleanText(data.emp_id) || null;
    this.checkpost = cleanCheckpost(data.checkpost);
    this.contact = cleanContact(data.contact);
  }

  validate() {
    const errors = [];

    // Required
    if (!this.firstName) errors.push("First name is required");
    if (!this.lastName) errors.push("Last name is required");
    if (!this.email) errors.push("Email is required");
    if (!this.password) errors.push("Password is required");
    if (!this.contact) errors.push("Contact number is required");

    // Names
    if (this.firstName && (this.firstName.length > MAX.name || !NAME_RE.test(this.firstName)))
      errors.push("First name contains invalid characters or is too long");
    if (this.lastName && (this.lastName.length > MAX.name || !NAME_RE.test(this.lastName)))
      errors.push("Last name contains invalid characters or is too long");

    // Email
    if (this.email && (this.email.length > MAX.email || !EMAIL_RE.test(this.email)))
      errors.push("Invalid email format");

    // Password
    if (this.password && this.password.length < 6)
      errors.push("Password must be at least 6 characters long");
    if (this.password && Buffer.byteLength(this.password, "utf8") > MAX.password)
      errors.push(`Password is too long (maximum ${MAX.password} bytes)`);

    // Contact
    if (this.contact && !CONTACT_RE.test(this.contact))
      errors.push("Contact number must be exactly 10 digits");

    // Optional fields (validated only when provided)
    if (this.title && (this.title.length > MAX.title || !TITLE_RE.test(this.title)))
      errors.push("Title contains invalid characters or is too long");
    if (this.designation && (this.designation.length > MAX.designation || !TEXT_RE.test(this.designation)))
      errors.push("Designation contains invalid characters or is too long");
    if (this.emp_id && (this.emp_id.length > MAX.emp_id || !EMP_ID_RE.test(this.emp_id)))
      errors.push("Employee ID may contain only letters, numbers, / _ -");
    if (this.checkpost !== null && (!Number.isSafeInteger(this.checkpost) || this.checkpost < 1))
      errors.push("Checkpost must be a valid checkpost ID");

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = PoliceRegistrationDto;