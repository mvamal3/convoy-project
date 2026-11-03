// Same rules as the backend utils/passwordPolicy.js.
// Frontend validation is for user feedback only; the server still enforces it.
export const PASSWORD_RULES =
  "Password must be 8-100 characters with upper and lower case letters, a number and a special character";

// Returns an error message, or null when the password is acceptable.
export const checkPassword = (password) => {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 100 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z0-9]/.test(password) ||
    /\s/.test(password)
  ) {
    return PASSWORD_RULES;
  }
  return null;
};
