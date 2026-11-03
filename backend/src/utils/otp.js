const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const db = require("../models");
const config = require("../config/environment");
const httpError = require("./httpError");

// One-time passwords for registration and password reset.
// Codes are random, stored only as a bcrypt hash, expire after
// OTP_TTL_MINUTES, allow OTP_MAX_ATTEMPTS guesses, and are single-use.
// Requesting a new code invalidates the previous one.

const OTP_PURPOSES = Object.freeze({
  REGISTER: "register",
  RESET: "reset",
});

const ttlMs = () => config.OTP_TTL_MINUTES * 60 * 1000;

const newCode = () =>
  config.OTP_FIXED || String(crypto.randomInt(0, 1000000)).padStart(6, "0");

/**
 * Create a new OTP for an account and return the plain code (to deliver).
 * Enforces the resend cooldown and the hourly limit per account.
 */
const createOtp = async (accountType, accountId, purpose) => {
  const now = Date.now();
  const where = { accountType, accountId: String(accountId), purpose };

  // expiresAt - TTL is the time a code was issued
  const issuedLastHour = await db.AuthOtp.findAll({
    where: { ...where, expiresAt: { [Op.gte]: now - 60 * 60 * 1000 + ttlMs() } },
    order: [["id", "DESC"]],
  });

  if (issuedLastHour.length >= config.OTP_MAX_PER_HOUR) {
    throw httpError("Too many OTP requests. Please try again after an hour.", 429);
  }

  const latest = issuedLastHour[0];
  if (latest) {
    const issuedAt = Number(latest.expiresAt) - ttlMs();
    const waitSeconds = Math.ceil(
      (issuedAt + config.OTP_RESEND_SECONDS * 1000 - now) / 1000,
    );
    if (waitSeconds > 0) {
      throw httpError(
        `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        429,
      );
    }
  }

  await db.AuthOtp.update({ used: true }, { where: { ...where, used: false } });

  const code = newCode();
  await db.AuthOtp.create({
    ...where,
    otpHash: await bcrypt.hash(code, 10),
    expiresAt: now + ttlMs(),
  });

  return code;
};

/**
 * Check a code against the account's latest unused OTP. Returns true and
 * consumes the OTP when it matches; otherwise counts the attempt.
 */
const verifyOtp = async (accountType, accountId, purpose, code) => {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) return false;

  const record = await db.AuthOtp.findOne({
    where: { accountType, accountId: String(accountId), purpose, used: false },
    order: [["id", "DESC"]],
  });

  if (!record || Number(record.expiresAt) < Date.now()) {
    return false;
  }

  // Reserve an attempt in SQL before comparing, so parallel guesses cannot
  // exceed OTP_MAX_ATTEMPTS in total.
  const [reserved] = await db.AuthOtp.update(
    { attempts: db.sequelize.literal("attempts + 1") },
    {
      where: {
        id: record.id,
        used: false,
        attempts: { [Op.lt]: config.OTP_MAX_ATTEMPTS },
      },
    },
  );
  if (!reserved) return false;

  if (!(await bcrypt.compare(code, record.otpHash))) {
    await db.AuthOtp.update(
      { used: true },
      { where: { id: record.id, attempts: { [Op.gte]: config.OTP_MAX_ATTEMPTS } } },
    );
    return false;
  }

  // Single use: only one request can flip `used`
  const [consumed] = await db.AuthOtp.update(
    { used: true },
    { where: { id: record.id, used: false } },
  );
  return consumed === 1;
};

/**
 * Deliver an OTP to the account holder's registered mobile/email.
 * TODO: connect the SMS / email gateway here (e.g. NIC SMS service).
 * Until then codes can only be read from the dev console or OTP_FIXED.
 */
const deliverOtp = async ({ mobile, email }, code, purpose) => {
  if (config.NODE_ENV === "development" && !config.OTP_FIXED) {
    console.log(`[dev only] ${purpose} OTP for ${email || mobile}: ${code}`);
  }
};

module.exports = { OTP_PURPOSES, createOtp, verifyOtp, deliverOtp };
