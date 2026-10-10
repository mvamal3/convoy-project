// Same rules as the backend PoliceRegistrationDto.
// Frontend validation is for user feedback only; the server still enforces everything.

// ---------- Sanitizers ----------
export const cleanText = (value) => {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[\p{Cc}\p{Cf}]/gu, "") // control + invisible characters
    .trim();
};

const cleanEmail = (value) => cleanText(value).toLowerCase();
const cleanContact = (value) => cleanText(value).replace(/[\s-]/g, "");

// ---------- Rules ----------
export const MAX = {
  email: 254,
  password: 72, // bcrypt limit (bytes)
  name: 50,
  title: 10,
  designation: 100,
  emp_id: 30,
  contact: 10,
};

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const TITLE_RE = /^[\p{L}\p{M}][\p{L}\p{M} .]*$/u;
const TEXT_RE = /^[\p{L}\p{M}\p{N} .,'()/&-]+$/u;
const EMP_ID_RE = /^[A-Za-z0-9/_-]+$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
const CONTACT_RE = /^\d{10}$/;

// Returns { errors: { field: message }, values: cleaned payload }
export const validatePoliceForm = (form) => {
  const values = {
    title: cleanText(form.title),
    firstName: cleanText(form.firstName),
    lastName: cleanText(form.lastName),
    designation: cleanText(form.designation),
    emp_id: cleanText(form.emp_id),
    checkpost: cleanText(form.checkpost),
    contact: cleanContact(form.contact),
    email: cleanEmail(form.email),
    password: typeof form.password === "string" ? form.password : "", // never trimmed
  };

  const errors = {};

  // Required
  if (!values.firstName) errors.firstName = "First name is required";
  if (!values.lastName) errors.lastName = "Last name is required";
  if (!values.designation) errors.designation = "Designation is required";
  if (!values.emp_id) errors.emp_id = "Employee ID is required";
  if (!values.contact) errors.contact = "Contact number is required";
  if (!values.email) errors.email = "Email is required";
  if (!values.password) errors.password = "Password is required";

  // Names
  if (values.firstName && !errors.firstName &&
      (values.firstName.length > MAX.name || !NAME_RE.test(values.firstName)))
    errors.firstName = "First name contains invalid characters or is too long";
  if (values.lastName && !errors.lastName &&
      (values.lastName.length > MAX.name || !NAME_RE.test(values.lastName)))
    errors.lastName = "Last name contains invalid characters or is too long";

  // Email
  if (values.email && !errors.email &&
      (values.email.length > MAX.email || !EMAIL_RE.test(values.email)))
    errors.email = "Invalid email format";

  // Password
  if (values.password && !errors.password) {
    if (values.password.length < 6)
      errors.password = "Password must be at least 6 characters long";
    else if (new TextEncoder().encode(values.password).length > MAX.password)
      errors.password = `Password is too long (maximum ${MAX.password} bytes)`;
  }
  if (!errors.password && form.password !== form.confirmPassword)
    errors.confirmPassword = "Passwords do not match";

  // Contact
  if (values.contact && !errors.contact && !CONTACT_RE.test(values.contact))
    errors.contact = "Contact number must be exactly 10 digits";

  // Optional / selected fields
  if (values.title && (values.title.length > MAX.title || !TITLE_RE.test(values.title)))
    errors.title = "Invalid title";
  if (values.designation && !errors.designation &&
      (values.designation.length > MAX.designation || !TEXT_RE.test(values.designation)))
    errors.designation = "Invalid designation";
  if (values.emp_id && !errors.emp_id &&
      (values.emp_id.length > MAX.emp_id || !EMP_ID_RE.test(values.emp_id)))
    errors.emp_id = "Employee ID may contain only letters, numbers, / _ -";
  if (values.checkpost && !/^[1-9]\d*$/.test(values.checkpost))
    errors.checkpost = "Invalid checkpost";

  return { errors, values };
};