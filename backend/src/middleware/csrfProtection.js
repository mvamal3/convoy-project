
const crypto = require("crypto");

function csrfProtection(req, res, next) {
  const sessionToken = req.session?.csrfToken;
  const requestToken = req.get("X-CSRF-Token");

  if (
    typeof sessionToken !== "string" ||
    typeof requestToken !== "string"
  ) {
    return res.status(403).json({
      success: false,
      message: "CSRF token missing",
    });
  }

  const sessionBuffer = Buffer.from(sessionToken);
  const requestBuffer = Buffer.from(requestToken);

  if (
    sessionBuffer.length !== requestBuffer.length ||
    !crypto.timingSafeEqual(sessionBuffer, requestBuffer)
  ) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token",
    });
  }

  next();
}

module.exports = csrfProtection;
