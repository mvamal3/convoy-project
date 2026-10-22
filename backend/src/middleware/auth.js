const JWTConfig = require("../config/jwt");
const db = require("../models");
const BaseResponseDTO = require("../dto/response/BaseResponseDTO");
const { ACCOUNT_TYPES } = require("../utils/authSession");

const SAFE_ATTRIBUTES = { exclude: ["password", "refreshToken"] };

// Load the account a token belongs to and confirm it is still allowed in.
const accountLoaders = {
  [ACCOUNT_TYPES.USER]: async (id) => {
    const user = await db.User.findByPk(id, { attributes: SAFE_ATTRIBUTES });
    return user && user.isActive ? user : null;
  },

  [ACCOUNT_TYPES.POLICE]: async (id) => {
    const user = await db.PoliceUser.findByPk(id, {
      attributes: SAFE_ATTRIBUTES,
      include: [{ model: db.PoliceRegistration, as: "registration" }],
    });
    return user && user.isActive ? user : null;
  },

  [ACCOUNT_TYPES.ADMIN]: async (id) => {
    const admin = await db.Admin.findOne({
      where: { id, isActive: 1 },
      attributes: SAFE_ATTRIBUTES,
    });

    // Re-check admin privileges so a demoted admin can't keep an old token
    if (!admin || (admin.role !== "admin" && Number(admin.isadmin) !== 1)) {
      return null;
    }
    return admin;
  },
};

/**
 * Build a middleware that accepts a Bearer access token issued for one of
 * the given account types. The token's version must match the account's
 * current tokenVersion, so tokens issued before logout are rejected.
 * `isAllowed(account)` can further restrict which accounts get through.
 */
const authenticateWith = (allowedTypes, isAllowed = () => true) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json(BaseResponseDTO.error("Access token required"));
      }

      const token = authHeader.substring(7).trim();

      if (!token) {
        return res
          .status(401)
          .json(BaseResponseDTO.error("Access token required"));
      }

      // Verify signature, issuer, audience and expiration
      const decoded = JWTConfig.verifyAccessToken(token);

      if (!allowedTypes.includes(decoded.typ)) {
        return res
          .status(403)
          .json(BaseResponseDTO.error("Insufficient permissions"));
      }

      const account = await accountLoaders[decoded.typ](decoded.userId);

      if (!account || (Number(account.tokenVersion) || 0) !== decoded.tv) {
        return res
          .status(401)
          .json(BaseResponseDTO.error("Invalid or expired token"));
      }

      if (!isAllowed(account, decoded.typ)) {
        return res
          .status(403)
          .json(BaseResponseDTO.error("Insufficient permissions"));
      }

      req.user = account;
      req.accountType = decoded.typ;
      if (decoded.typ === ACCOUNT_TYPES.ADMIN) {
        req.admin = account;
      }

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json(BaseResponseDTO.error("Session expired. Please login again."));
      }

      // Invalid JWT / invalid signature / invalid issuer / invalid audience
      return res
        .status(401)
        .json(BaseResponseDTO.error("Invalid or expired token"));
    }
  };
};

const authenticate = (...allowedTypes) => authenticateWith(allowedTypes);

// Citizen endpoints. Special-convoy (scs) officers log in through the
// police login but also manage vehicles, drivers and special trips.
const authenticateToken = authenticateWith(
  [ACCOUNT_TYPES.USER, ACCOUNT_TYPES.POLICE],
  (account, type) => type === ACCOUNT_TYPES.USER || account.role === "scs",
);
const authenticatePoliceToken = authenticate(ACCOUNT_TYPES.POLICE);
const authenticateAdmin = authenticate(ACCOUNT_TYPES.ADMIN);
const authenticatePoliceOrAdmin = authenticate(
  ACCOUNT_TYPES.POLICE,
  ACCOUNT_TYPES.ADMIN,
);
const authenticateAny = authenticate(
  ACCOUNT_TYPES.USER,
  ACCOUNT_TYPES.POLICE,
  ACCOUNT_TYPES.ADMIN,
);

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json(BaseResponseDTO.error("Insufficient permissions"));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authenticateToken,
  authenticatePoliceToken,
  authenticateAdmin,
  authenticatePoliceOrAdmin,
  authenticateAny,
  authorizeRoles,
};
