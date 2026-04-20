const JWTConfig = require("../config/jwt");
const db = require("../models");
const BaseResponseDTO = require("../dto/response/BaseResponseDTO");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    //console.log("Auth Headersssssssssssssssssssss:", authHeader);
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    console.log("tokennnn", token);

    if (!token) {
      return res
        .status(401)
        .json(BaseResponseDTO.error("Access token required"));
    }

    const decoded = JWTConfig.verifyAccessToken(token);
    //console.log("Decoded token:", decoded);
    // Get user from database
    const user = await db.User.findByPk(decoded.userId, {
      attributes: { exclude: ["password", "refreshToken"] },
    });

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json(BaseResponseDTO.error("Invalid or expired token"));
    }

    req.user = user;
    next();
  } catch (error) {
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
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json(BaseResponseDTO.error("Access token required"));
    }

    const decoded = JWTConfig.verifyAccessToken(token);

    // 🚨 BLOCK NON-POLICE TOKENS
    if (decoded.role !== "police") {
      return res.status(403).json(BaseResponseDTO.error("Police access only"));
    }

    const user = await db.PoliceUser.findByPk(decoded.userId, {
      attributes: { exclude: ["password", "refreshToken"] },
      include: [
        {
          model: db.PoliceRegistration,
          as: "registration",
        },
      ],
    });

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json(BaseResponseDTO.error("Invalid or inactive police user"));
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json(BaseResponseDTO.error("Invalid or expired token"));
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authenticatePoliceToken,
};
