const jwt = require("jsonwebtoken");
const JWTConfig = require("../config/jwt");

// Account types. Each maps to its own table, so the type is carried in
// every token to stop an ID from one table being accepted for another.
const ACCOUNT_TYPES = Object.freeze({
  USER: "user",
  POLICE: "police",
  ADMIN: "admin",
});

const CAPTCHA_TTL_MS = 2 * 60 * 1000;
const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";

const saveSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });

/**
 * Validate the CAPTCHA answer against the one stored in the server session.
 * The stored CAPTCHA is consumed before comparison, so every attempt
 * (successful or not) requires a new CAPTCHA.
 */
const consumeCaptcha = async (req, captcha) => {
  if (!req.session) {
    throw new Error("CAPTCHA session missing. Please refresh CAPTCHA.");
  }

  const userCaptcha = typeof captcha === "string" ? captcha.trim() : "";
  const sessionCaptcha =
    typeof req.session.captcha === "string" ? req.session.captcha.trim() : "";
  const captchaTime = req.session.captchaTime;

  const now = Date.now();
  const validTimestamp =
    typeof captchaTime === "number" &&
    Number.isFinite(captchaTime) &&
    captchaTime > 0 &&
    now >= captchaTime &&
    now - captchaTime <= CAPTCHA_TTL_MS;

  delete req.session.captcha;
  delete req.session.captchaTime;
  await saveSession(req);

  const validCaptcha =
    /^\d{6}$/.test(userCaptcha) &&
    /^\d{6}$/.test(sessionCaptcha) &&
    validTimestamp &&
    userCaptcha === sessionCaptcha;

  if (!validCaptcha) {
    throw new Error("Invalid or expired CAPTCHA. Please refresh and try again.");
  }
};

/**
 * Issue an access/refresh token pair for an account record and store the
 * refresh token on it. `claims` is merged into the access token payload.
 */
const issueTokens = async (type, record, claims = {}) => {
  const tv = Number(record.tokenVersion) || 0;

  const accessToken = JWTConfig.generateAccessToken({
    ...claims,
    userId: record.id,
    typ: type,
    tv,
  });

  const refreshToken = JWTConfig.generateRefreshToken({
    userId: record.id,
    typ: type,
    tv,
  });

  record.refreshToken = refreshToken;
  await record.save();

  return { accessToken, refreshToken };
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: REFRESH_COOKIE_PATH,
});

const setRefreshCookie = (res, refreshToken) => {
  const { exp } = jwt.decode(refreshToken) || {};
  const maxAge = exp ? Math.max(exp * 1000 - Date.now(), 0) : undefined;

  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions(), maxAge });
};

const clearAuthCookies = (res) => {
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
  res.clearCookie("captcha-session", { path: "/" });
};

module.exports = {
  ACCOUNT_TYPES,
  REFRESH_COOKIE,
  consumeCaptcha,
  issueTokens,
  setRefreshCookie,
  clearAuthCookies,
};
