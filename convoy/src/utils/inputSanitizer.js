
/**
 * True when a value contains markup or script-like content that no form
 * field should accept (tags, comments, event handlers, control characters).
 */
export const containsUnsafeMarkup = (value) =>
  typeof value === "string" &&
  (/[<>]/.test(value) ||
    /\bon[a-z]+\s*=/i.test(value) ||
    /javascript\s*:/i.test(value) ||
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value));

/**
 * Escape a value before placing it inside an HTML string
 * (for example a SweetAlert `html` option).
 */
export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Generic input sanitizer for frontend validation.
 * Backend validation is still required.
 */
export const sanitizeInput = (
  value,
  {
    maxLength = 300,
    trim = false,
    rejectHtml = true,
  } = {},
) => {
  if (typeof value !== "string") {
    return "";
  }

  let cleaned = value.normalize("NFKC");

  // Reject HTML-like tags instead of silently accepting them
  if (rejectHtml && /<[^>]*>/i.test(cleaned)) {
    return "";
  }

  // Remove control characters
  cleaned = cleaned.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    "",
  );

  // Apply configured length limit
  cleaned = cleaned.slice(0, maxLength);

  return trim ? cleaned.trim() : cleaned;
};
