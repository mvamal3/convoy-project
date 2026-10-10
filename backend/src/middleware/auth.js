const JWTConfig = require("../config/jwt");
const db = require("../models");
const BaseResponseDTO = require("../dto/response/BaseResponseDTO");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // Authorization header is required
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

    // Get current user from database
    const user = await db.User.findByPk(decoded.userId, {
      attributes: {
        exclude: ["password", "refreshToken"],
      },
    });

    // User must exist and be active
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json(BaseResponseDTO.error("Invalid or expired token"));
    }

    req.user = user;

    next();
  } catch (error) {
    // JWT expired
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

const authenticatePoliceToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // Authorization header is required
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

    // Only police tokens are allowed
    if (decoded.role !== "police") {
      return res
        .status(403)
        .json(BaseResponseDTO.error("Police access only"));
    }

    // Get current police user from database
    const user = await db.PoliceUser.findByPk(decoded.userId, {
      attributes: {
        exclude: ["password", "refreshToken"],
      },
      include: [
        {
          model: db.PoliceRegistration,
          as: "registration",
        },
      ],
    });

    // User must exist and be active
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json(BaseResponseDTO.error("Invalid or inactive police user"));
    }

    req.user = user;

    next();
  } catch (error) {
    // JWT expired
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

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    console.log("🔍 Authenticating admin with header:", authHeader);

    // Authorization header is required
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(BaseResponseDTO.error("Access token required00"));
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res
        .status(401)
        .json(BaseResponseDTO.error("Access token required0000"));
    }

    // Verify signature, issuer, audience and expiration
    const decoded = JWTConfig.verifyAccessToken(token);
    console.log("🔍 Decoded admin token:", decoded);

    // Token must have been issued for an admin (set in loginAdmin)
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json(BaseResponseDTO.error("Admin access required0000"));
    }

    // Get current admin from database (token payload uses userId = admin.id)
    const admin = await db.Admin.findOne({
      where: {
        id: decoded.userId,
        isActive: 1,
      },
      attributes: {
        exclude: ["password", "refreshToken"],
      },
    });

    // Admin must exist and be active (isActive = 1)
    if (!admin || Number(admin.isActive) !== 1) {
      return res
        .status(401)
        .json(BaseResponseDTO.error("Invalid or expired token"));
    }

    // Re-check admin privileges from DB (same rule as loginAdmin),
    // so a demoted admin can't keep using an old token
    if (admin.role !== "admin" && admin.isadmin !== 1) {
      return res
        .status(403)
        .json(BaseResponseDTO.error("Unauthorized admin access"));
    }

    req.admin = admin;
    req.user = admin; // optional: keeps code that reads req.user working

    next();
  } catch (error) {
    // JWT expired
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







module.exports = {
  authenticateToken,
  authorizeRoles,
  authenticatePoliceToken,
  authenticateAdmin
};