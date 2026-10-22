const BaseResponseDTO = require("../dto/response/BaseResponseDTO");

// Passwords are hashed, never rendered, and may legitimately contain < or >.
const SKIPPED_KEYS = /password/i;

const hasUnsafeContent = (value) =>
  /<\s*\/?\s*[a-z][^>]*>/i.test(value) || // HTML tags
  /<\s*![\s\S]*?>/.test(value) || // comments / doctype
  /<\s*\?[\s\S]*?\?>/.test(value) || // processing instructions
  /\bon[a-z]+\s*=/i.test(value) || // inline event handlers
  /javascript\s*:/i.test(value) ||
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value); // control chars

// Return the path of the first unsafe string inside a request payload.
const findUnsafePath = (value, path, depth = 0) => {
  if (depth > 20) return path;

  if (typeof value === "string") {
    return hasUnsafeContent(value) ? path : null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const result = findUnsafePath(value[i], `${path}[${i}]`, depth + 1);
      if (result) return result;
    }
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (SKIPPED_KEYS.test(key)) continue;
      if (hasUnsafeContent(key)) return `${path}.${key}`;

      const result = findUnsafePath(child, `${path}.${key}`, depth + 1);
      if (result) return result;
    }
  }

  return null;
};

/**
 * Reject any request whose body or query contains markup, script or
 * control characters. Applied to every API route as a baseline; the
 * per-endpoint DTOs still validate format and length.
 */
const rejectUnsafeInput = (req, res, next) => {
  const unsafePath =
    findUnsafePath(req.body, "body") || findUnsafePath(req.query, "query");

  if (unsafePath) {
    return res
      .status(400)
      .json(
        BaseResponseDTO.error("Invalid input", [
          `${unsafePath} contains characters that are not allowed`,
        ]),
      );
  }

  next();
};

module.exports = rejectUnsafeInput;
