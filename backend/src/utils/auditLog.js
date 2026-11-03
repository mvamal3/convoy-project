const db = require("../models");

// Audit trail of security-relevant actions. Writing a row never fails the
// request that triggered it. Never put passwords, OTPs or tokens in `details`.

const AUDIT_ACTIONS = Object.freeze({
  LOGIN: "LOGIN",
  LOGIN_LOCKED: "LOGIN_LOCKED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  LOGOUT: "LOGOUT",
  REGISTER: "REGISTER",
  OTP_RESEND: "OTP_RESEND",
  OTP_VERIFY: "OTP_VERIFY",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PASSWORD_RESET_REQUEST: "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET: "PASSWORD_RESET",
  POLICE_REGISTER: "POLICE_REGISTER",
  POLICE_UPDATE: "POLICE_UPDATE",
  POLICE_PASSWORD_SET: "POLICE_PASSWORD_SET",
  POLICE_FREEZE: "POLICE_FREEZE",
  POLICE_UNFREEZE: "POLICE_UNFREEZE",
  POLICE_DELETE: "POLICE_DELETE",
  CITIZEN_FREEZE: "CITIZEN_FREEZE",
  CITIZEN_UNFREEZE: "CITIZEN_UNFREEZE",
  ACCOUNT_UNLOCK: "ACCOUNT_UNLOCK",
  TRIP_APPROVAL: "TRIP_APPROVAL",
  TRIP_VERIFY: "TRIP_VERIFY",
});

const clip = (value, max) =>
  value === undefined || value === null ? null : String(value).slice(0, max);

// The signed-in account making the request, if any.
const actorFrom = (req) =>
  req.user
    ? {
        actorType: req.accountType,
        actorId: req.user.id,
        actorName: req.user.email || req.user.userid,
      }
    : {};

const audit = async (req, entry) => {
  try {
    await db.AuditLog.create({
      actorType: clip(entry.actorType, 10),
      actorId: clip(entry.actorId, 64),
      actorName: clip(entry.actorName, 100),
      action: entry.action,
      status: entry.status || "success",
      targetType: clip(entry.targetType, 20),
      targetId: clip(entry.targetId, 64),
      ip: clip(req?.ip, 45),
      userAgent: clip(req?.get?.("user-agent"), 255),
      details: clip(entry.details, 500),
    });
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
};

/**
 * Route middleware that records `action` once the response is sent.
 * `describe(req)` returns extra fields (targetType, targetId, details).
 * The action counts as failed on an HTTP error or a `success: false` body.
 */
const auditRoute = (action, describe = () => ({})) => (req, res, next) => {
  let body;
  const json = res.json.bind(res);
  res.json = (payload) => {
    body = payload;
    return json(payload);
  };

  res.on("finish", () => {
    const ok = res.statusCode < 400 && body?.success !== false;
    let extra = {};
    try {
      extra = describe(req) || {};
    } catch {
      extra = {};
    }

    audit(req, {
      ...actorFrom(req),
      action,
      status: ok ? "success" : "failure",
      ...extra,
      details: ok ? extra.details : clip(body?.message, 200),
    });
  });

  next();
};

module.exports = { AUDIT_ACTIONS, audit, actorFrom, auditRoute };
