const db = require("../models"); // make sure index.js in /models returns db with initialized models
const User = db.User;
const Registration = db.Registration;

const JWTConfig = require("../config/jwt");
const LoginRequestDTO = require("../dto/request/LoginRequestDTO");
const AuthResponseDTO = require("../dto/response/AuthResponseDTO");
const RegistrationDtoV1 = require("../dto/request/RegistrationDtoV1");
const VehicleDto = require("../dto/request/VehicleRequestDTO_V1");
const DriverRequestDTO_V1 = require("../dto/request/DriverRequestDTO_V1");
const TripRequestDTO = require("../dto/request/TripRequestDTO");
const LoginResponseDTO = require("../dto/response/LoginResponseDTO");
const VehicleRequestDTO = require("../dto/request/VehicleRequestDTO_V1");
const PoliceRegistrationDto = require("../dto/request/PoliceRegistrationDto");
const PoliceLoginRequestDTO = require("../dto/request/PoliceLoginRequestDTO");
const PoliceLoginResponseDTO = require("../dto/response/PoliceLoginResponseDTO");
const AdminLoginRequestDTO = require("../dto/request/AdminLoginRequestDTO");
const UpdateProfileDTO = require("../dto/request/UpdateProfileDTO");
const LoginUserResponseDto = require("../dto/response/LoginUserResponseDto");
const PoliceLoginUserResponseDto = require("../dto/response/PoliceLoginUserResponseDto");
const {
  ACCOUNT_TYPES,
  consumeCaptcha,
  isValidLoginNonce,
  issueTokens,
  isSessionExpired,
} = require("../utils/authSession");
const config = require("../config/environment");
const httpError = require("../utils/httpError");
const { checkPassword } = require("../utils/passwordPolicy");
const {
  isLocked,
  assertNotLocked,
  recordFailedLogin,
  clearFailedLogins,
  lockedMessage,
} = require("../utils/loginLockout");
const {
  OTP_PURPOSES,
  createOtp,
  verifyOtp,
  deliverOtp,
} = require("../utils/otp");
const { AUDIT_ACTIONS, audit } = require("../utils/auditLog");
const {
  ResendOtpDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  CitizenListDTO,
  AuditLogListDTO,
  AccountRefDTO,
} = require("../dto/request/AccountSecurityDTO");

//new dto

const TripDetailsByDateResponseDTO = require("../dto/response/new/TripDetailsByDateResponseDTO");

const CheckoutReportRequestDTO = require("../dto/request/new/CheckoutReportRequestDTO");
const CheckoutReportResponseDTO = require("../dto/response/new/CheckoutReportResponseDTO");

const Driver = db.Driver;
const crypto = require("crypto");
const DriverStatus = db.DriverStatus;
const Trip = db.Trip;
const tripRelation = db.tripRelation;
const Passenger = db.Passenger;
const OriginDestination = db.Origin_Destination;
const PoliceUser = db.PoliceUser;
const PoliceRegistration = db.PoliceRegistration;
const Otp = db.Otp;
const Admin = db.Admin; // Assuming you have an Admin model
const ConveyControl = db.ConveyControl; // Assuming you have a ConveyControl model
const ApproveTrip = db.Approve_trip;
const CheckoutTrip = db.CheckoutTrip;
const TDesignation = db.TDesignation;
const Nationality = db.Nationality;
const BaseResponseDTO = require("../dto/response/BaseResponseDTO");
const { Op, fn, col } = require("sequelize");
const { Sequelize } = require("sequelize");
const { where } = require("sequelize");
const { Console } = require("console");
const { json } = require("express/lib/response");
// const VehicleStatus = db.VehicleStatus;
// Assuming you have a DriverStatus model
class AuthService {



static async login(loginData, req) {
  await consumeCaptcha(req, loginData?.captcha);
  const loginNonce = AuthService.requireLoginNonce(loginData);

  const loginDTO = new LoginRequestDTO(loginData);
  const validation = loginDTO.validate();

  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }

  const user = await User.findOne({
    where: {
      email: loginDTO.email,
      isActive: 1,
      isFrozen: 0,
    },
    include: [
      {
        model: Registration,
        as: "registration",
        attributes: ["firstName", "lastName", "isOrg", "orgName"],
      },
    ],
  });

  await AuthService.checkLoginPassword(
    req,
    ACCOUNT_TYPES.USER,
    loginDTO.email,
    user,
    loginDTO.password,
  );

  user.lastLoginAt = new Date();

  const { accessToken, refreshToken } = await issueTokens(
    ACCOUNT_TYPES.USER,
    user,
    { email: user.email, role: user.role },
    { newSession: true, nonce: loginNonce },
  );

  return new LoginResponseDTO(user, accessToken, refreshToken);
}


  static async registerNew(registerData) {
    const registerDTO = new RegistrationDtoV1(registerData);

    const validation = registerDTO.validate();
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // Same reply whether or not the email is taken, so registration cannot
    // be used to find out which accounts exist.
    const reply = {
      message:
        "If this email can be registered, an OTP has been sent to it. Please verify to complete registration.",
    };

    if (await User.findOne({ where: { email: registerDTO.email }, attributes: ["id"] })) {
      return reply;
    }

    let user;
    try {
      // Both rows or neither: a half-created account would block the email
      user = await db.sequelize.transaction(async (transaction) => {
        const created = await User.create(
          {
            email: registerDTO.email,
            password: registerDTO.password,
            firstName: registerDTO.firstName,
            lastName: registerDTO.lastName,
            role: "user",
            isActive: 0,
          },
          { transaction },
        );

        await Registration.create(
          {
            reg_id: `REG_${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            userId: created.id,
            title: registerDTO.title,
            firstName: registerDTO.firstName,
            lastName: registerDTO.lastName,
            orgName: registerDTO.orgName,
            orgId: registerDTO.orgId,
            docId: registerDTO.docId,
            docIdtype: registerDTO.docIdtype,
            ownContact: registerDTO.ownContact,
            ownAddress: registerDTO.ownAddress,
            village_code: registerDTO.village_code,
            subdistrict_code: registerDTO.subdistrict_code,
            district_code: registerDTO.district_code,
            isOrg: registerDTO.isOrg,
            deptSubCat: registerDTO.govtsubcategory,
            deptName: registerDTO.govtDeptName,
            status: 0,
          },
          { transaction },
        );

        return created;
      });
    } catch (error) {
      // A parallel request registered the same email first
      if (error.name === "SequelizeUniqueConstraintError") return reply;
      throw error;
    }

    // Random single-use OTP (stored hashed), sent to the registered contacts.
    // The OTP itself is never returned to the browser.
    const otpCode = await createOtp(
      ACCOUNT_TYPES.USER,
      user.id,
      OTP_PURPOSES.REGISTER,
    );
    await deliverOtp(
      { mobile: registerDTO.ownContact, email: registerDTO.email },
      otpCode,
      OTP_PURPOSES.REGISTER,
    );

    return reply;
  }

  /**
   * Password check shared by the three logins. Applies the account lockout,
   * counts wrong passwords and writes the audit trail. `account` is null
   * when no active account matched `identifier`.
   */
  static async checkLoginPassword(req, type, identifier, account, password) {
    const entry = {
      actorType: type,
      actorId: account?.id,
      actorName: identifier,
      action: AUDIT_ACTIONS.LOGIN,
    };

    if (!account) {
      await audit(req, { ...entry, status: "failure", details: "Unknown or inactive account" });
      throw new Error("Invalid credentials");
    }

    if (isLocked(account)) {
      await audit(req, { ...entry, action: AUDIT_ACTIONS.LOGIN_LOCKED, status: "failure" });
      assertNotLocked(account);
    }

    if (!(await account.validatePassword(password))) {
      const locked = await recordFailedLogin(account);
      await audit(req, { ...entry, status: "failure", details: "Wrong password" });

      if (locked) {
        await audit(req, {
          ...entry,
          action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
          status: "success",
          details: `Locked for ${config.LOCKOUT_MINUTES} minutes after ${config.LOCKOUT_MAX_ATTEMPTS} failed logins`,
        });
        throw httpError(lockedMessage(Number(account.lockedUntil)), 423);
      }
      throw new Error("Invalid credentials");
    }

    // issueTokens() saves the record
    clearFailedLogins(account);
    await audit(req, { ...entry, status: "success" });
  }

  // Load an active account (with the data its login response needs)
  // for the given account type.
  static async findSessionAccount(type, id) {
    if (type === ACCOUNT_TYPES.USER) {
      return User.findOne({
        where: { id, isActive: 1, isFrozen: 0 },
        include: [
          {
            model: Registration,
            as: "registration",
            attributes: ["firstName", "lastName", "isOrg", "orgName"],
          },
        ],
      });
    }

    if (type === ACCOUNT_TYPES.POLICE) {
      return db.PoliceUser.findOne({
        where: { id, isActive: 1, status: 1 },
        include: [
          {
            model: db.PoliceRegistration,
            as: "registration",
            attributes: [
              "firstName",
              "lastName",
              "designation",
              "checkpost",
              "reg_id",
            ],
            include: [
              {
                model: db.OriginDestination,
                as: "originDestination",
                attributes: ["id", "location"],
              },
            ],
          },
        ],
      });
    }

    if (type === ACCOUNT_TYPES.ADMIN) {
      const admin = await db.Admin.findOne({ where: { id, isActive: 1 } });
      if (admin && (admin.role === "admin" || Number(admin.isadmin) === 1)) {
        return admin;
      }
    }

    return null;
  }

  // reg_id of the account `userId`, or null. Trips, drivers and vehicles
  // are owned through this reg_id.
  static async regIdOf(userId) {
    const registration = await Registration.findOne({
      where: { userId },
      attributes: ["reg_id"],
    });
    return registration?.reg_id || null;
  }

  // True when every trip ID belongs to the citizen account `userId`.
  static async userOwnsTrips(userId, tIds) {
    const ids = [...new Set(tIds.filter(Boolean).map(String))];
    if (ids.length === 0) return false;

    const reg_id = await AuthService.regIdOf(userId);
    if (!reg_id) return false;

    const count = await db.Trip.count({
      where: { tId: ids, reg_id },
    });
    return count === ids.length;
  }

  // The user object returned to the frontend, matching each login response.
  static sessionUser(type, account) {
    if (type === ACCOUNT_TYPES.USER) {
      return new LoginUserResponseDto(account);
    }

    if (type === ACCOUNT_TYPES.POLICE) {
      return new PoliceLoginUserResponseDto(account);
    }

    return {
      id: account.id,
      email: account.userid,
      role: "admin",
      usertype: "admin",
    };
  }

  static accessClaims(type, account) {
    if (type === ACCOUNT_TYPES.USER) {
      return { email: account.email, role: account.role };
    }

    if (type === ACCOUNT_TYPES.POLICE) {
      return { email: account.email, role: "police" };
    }

    return { userid: account.userid, role: "admin" };
  }

  // Every login request must carry the browser's one-time login nonce.
  // It is echoed in the access token so a replayed response is detectable.
  static requireLoginNonce(loginData) {
    const nonce = loginData?.loginNonce;
    if (!isValidLoginNonce(nonce)) {
      throw new Error("Invalid login request");
    }
    return nonce;
  }

  // Exchange a valid refresh token (from the httpOnly cookie) for a new
  // token pair. Works for user, police and admin accounts.
  static async refreshToken(token) {
    if (!token) {
      throw new Error("Refresh token required");
    }

    let decoded;
    try {
      decoded = JWTConfig.verifyRefreshToken(token);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token expired. Please login again.");
      }
      throw new Error("Invalid refresh token");
    }

    const account = await AuthService.findSessionAccount(
      decoded.typ,
      decoded.userId,
    );

    if (
      !account ||
      account.refreshToken !== token ||
      (Number(account.tokenVersion) || 0) !== decoded.tv
    ) {
      throw new Error("Invalid refresh token");
    }

    // Enforce the absolute session length (SESSION_MAX_HOURS)
    if (isSessionExpired(decoded.st)) {
      throw new Error("Session expired. Please login again.");
    }

    const { accessToken, refreshToken } = await issueTokens(
      decoded.typ,
      account,
      AuthService.accessClaims(decoded.typ, account),
      { startedAt: decoded.st },
    );

    return {
      accountType: decoded.typ,
      user: AuthService.sessionUser(decoded.typ, account),
      accessToken,
      refreshToken,
    };
  }

  // Revoke every token issued to the account: clear the stored refresh
  // token and bump tokenVersion so outstanding access tokens are rejected.
  static async logout(type, id) {
    const models = {
      [ACCOUNT_TYPES.USER]: db.User,
      [ACCOUNT_TYPES.POLICE]: db.PoliceUser,
      [ACCOUNT_TYPES.ADMIN]: db.Admin,
    };

    const model = models[type];
    if (!model) return;

    await model.update(
      {
        refreshToken: null,
        tokenVersion: db.sequelize.literal("tokenVersion + 1"),
      },
      { where: { id } },
    );
  }

  // =============driver_tbl new registration========================
  static async registerDriver(registerData, id) {
    const registerDTO = new DriverRequestDTO_V1(registerData);
    const validation = registerDTO.validate();

    // Validate input first — stop immediately if invalid
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // Normalize licenseNo for consistent checks
    const licenseNoTrimmed = registerDTO.licenseNo?.trim();

    // Check if driver already exists
    const existingDriver = await Driver.findOne({
      where: { licenseNo: licenseNoTrimmed },
    });

    if (existingDriver) {
      throw new Error("Driver already exists with this license number");
    }

    // Find reg_id for the user
    const regIdObj = await Registration.findOne({
      where: { userId: id },
      attributes: ["reg_id"],
    });

    if (!regIdObj) {
      throw new Error("Registration not found for user");
    }

    const reg_id = regIdObj.get("reg_id");

    // Use transaction to avoid partial inserts
    return await db.sequelize.transaction(async (transaction) => {
      // Create new driver
      const newDriver = await Driver.create(
        {
          licenseNo: licenseNoTrimmed,
          title: registerDTO.title,
          dFirstName: registerDTO.dFirstName,
          dLastName: registerDTO.dLastName,

          // ✅ NEW fields
          son_of: registerDTO.son_of,
          residence_of: registerDTO.residence_of,
          phone_no: registerDTO.phNo,

          gender: registerDTO.gender,
          dStatus: registerDTO.dStatus,
        },
        { transaction },
      );

      // Create driver status linked to new driver
      await DriverStatus.create(
        {
          dId: newDriver.dId,
          reg_id,
          Status: registerDTO.status,
          phNo: registerDTO.phNo,
        },
        { transaction },
      );

      return {
        message: "Driver registered successfully",
        driver: newDriver,
      };
    });
  }

  static async registerVehicle(registerData, userId) {
    // Find registration for user

    //console.log("Registering new vehicle with data:", registerData);
    const regIdObj = await Registration.findOne({
      where: { userId: userId },
      attributes: ["reg_id"],
    });

    if (!regIdObj) {
      throw new Error("Registration not found for user");
    }

    const reg_id = regIdObj.get("reg_id");

    const vehicleDTO = new VehicleRequestDTO(registerData);
    const validation = vehicleDTO.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }


    // Save vehicle info into DB
    const newVehicle = await db.Vehicle.create({
      vOwnName: vehicleDTO.vOwnName,
      vNum: vehicleDTO.vNum,
      vCat: vehicleDTO.vCat,
      otherCat: vehicleDTO.otherCat,
      ownershipType: vehicleDTO.ownershipType,
      deptName: vehicleDTO.deptName,
      vPurpose: vehicleDTO.vPurpose,
      otherPurpose: vehicleDTO.otherPurpose,
      vSeating: vehicleDTO.vSeating,
      loadCapacity: vehicleDTO.loadCapacity,
      regDate: vehicleDTO.regDate,
    });


    // Add vehicle status after vehicle creation
    const vehicleStatus = await db.VehicleStatus.create({
      vId: newVehicle.vId,
      reg_id: reg_id,
      start_date: new Date(), // Default to current date
      end_date: null, // Default to null
    });


    return {
      success: true,
      vehicle: newVehicle,
      status: vehicleStatus,
    };
  }

  // =============get_driver_list_by_regId========================
  static async getDriveListbyRegId(registerData, id) {
    try {
      const { Op } = require("sequelize");


      // ===============================
      // OPTIONAL PAGINATION
      // ===============================
      const usePagination =
        registerData.page !== undefined && registerData.limit !== undefined;
      const page = usePagination ? Number(registerData.page) : null;

      const limit = usePagination ? Number(registerData.limit) : null;

      const offset = usePagination ? (page - 1) * limit : null;
      // ===============================
      // GET REG ID
      // ===============================
      const regIdObj = await Registration.findOne({
        where: { userId: id },
        attributes: ["reg_id"],
      });

      const reg_id = regIdObj ? regIdObj.get("reg_id") : null;

      //console.log("REG ID:", reg_id);

      if (!reg_id) {
        throw new Error("Registration ID not found");
      }
      // ===============================
      // MAIN WHERE
      // ===============================
      const whereClause = {
        dStatus: "active",
      };
      // ===============================
      // SEARCH FILTER
      // ===============================
      if (registerData.searchTerm && registerData.searchTerm.trim() !== "") {
        const querySearch = registerData.searchTerm.trim();


        whereClause[Op.or] = [
          {
            dFirstName: {
              [Op.like]: `%${querySearch}%`,
            },
          },
          {
            dLastName: {
              [Op.like]: `%${querySearch}%`,
            },
          },
          {
            licenseNo: {
              [Op.like]: `%${querySearch}%`,
            },
          },
        ];
      }

      // ===============================
      // QUERY OPTIONS
      // ===============================
      const queryOptions = {
        where: whereClause,

        include: [
          {
            model: db.DriverStatus,
            as: "sts",

            required: true,

            attributes: ["reg_id", "phNo"],

            where: {
              reg_id,
            },
          },
        ],

        attributes: ["dId", "dFirstName", "dLastName", "licenseNo", "title"],

        order: [["dId", "DESC"]],
      };

      // ===============================
      // APPLY PAGINATION
      // ===============================
      if (usePagination) {
        queryOptions.limit = limit;

        queryOptions.offset = offset;

        queryOptions.distinct = true;

        queryOptions.col = "dId";
      }


      // ===============================
      // FETCH DATA
      // ===============================
      const result = usePagination
        ? await db.Driver.findAndCountAll(queryOptions)
        : await db.Driver.findAll(queryOptions);

      const drivers = usePagination ? result.rows : result;

      const totalRecords = usePagination ? result.count : drivers.length;
      // ===============================
      // RESPONSE
      // ===============================
      return {
        message: "Driver List Loaded successfully",

        ...(usePagination && {
          totalRecords,

          currentPage: page,

          chunkSize: limit,

          totalChunks: Math.ceil(totalRecords / limit),
        }),

        driver: drivers,
      };
    } catch (error) {
      console.error("ERROR:", error);

      throw error;
    }
  }

  static async getVehicleListbyRegId(registerData, id) {
    try {
      // =========================================
      // FETCH REGISTRATION ID
      // =========================================
      const { Op } = require("sequelize");
      const regIdObj = await Registration.findOne({
        where: { userId: id },
        attributes: ["reg_id"],
      });

      const reg_id = regIdObj ? regIdObj.get("reg_id") : null;


      if (!reg_id) {
        return {
          success: false,
          message: "No registration ID found for this user",
          vehicle: [],
        };
      }

      // =========================================
      // OPTIONAL PAGINATION
      // =========================================
      const usePagination =
        registerData.page !== undefined && registerData.limit !== undefined;

      const page = Number(registerData.page) || 1;
      const limit = Number(registerData.limit) || 100;

      const offset = (page - 1) * limit;

      // =========================================
      // COMMON QUERY
      // =========================================
      // =========================================
      // SEARCH FILTER
      // =========================================
      const whereClause = {
        status: 1,
      };

      if (registerData.searchTerm && registerData.searchTerm.trim() !== "") {
        const querySearch = registerData.searchTerm.trim();


        whereClause.vNum = {
          [Op.like]: `%${querySearch}%`,
        };
      }

      // =========================================
      // COMMON QUERY
      // =========================================
      const queryOptions = {
        distinct: true,

        include: [
          {
            model: db.VehicleStatus,
            as: "sts",
            attributes: ["reg_id"],
            where: { reg_id },
          },
        ],

        where: whereClause,

        attributes: [
          "vId",
          "vNum",
          "vOwnName",
          "vCat",
          "otherCat",
          "ownershipType",
          "deptName",
          "vPurpose",
          "otherPurpose",
          "vSeating",
        ],

        order: [["vId", "DESC"]],
      };

      // =========================================
      // APPLY PAGINATION IF REQUIRED
      // =========================================
      if (usePagination) {
        queryOptions.limit = limit;
        queryOptions.offset = offset;
      }

      // =========================================
      // FETCH DATA
      // =========================================
      const vehicles = usePagination
        ? await db.Vehicle.findAndCountAll(queryOptions)
        : await db.Vehicle.findAll(queryOptions);

      // =========================================
      // PAGINATION RESPONSE
      // =========================================
      if (usePagination) {
        return {
          success: true,
          message: "Vehicle list loaded successfully",

          vehicle: vehicles.rows,

          totalRecords: vehicles.count,

          pagination: {
            currentPage: page,
            limit: limit,
            totalPages: Math.ceil(vehicles.count / limit),
          },
        };
      }

      // =========================================
      // NORMAL RESPONSE (OLD FLOW)
      // =========================================
      return {
        success: true,
        message: "Vehicle list loaded successfully",
        vehicle: vehicles,
      };
    } catch (error) {
      console.error("Error fetching vehicle list by regId:", error);

      return {
        success: false,
        message: "Error loading vehicle list",
        error: error.message,
      };
    }
  }

  //-----------------------------

  // =============get District========================
  static async getDistrict() {
    try {
      // Fetch all districts from the database
      const districts = await db.District.findAll({
        attributes: ["district_code", "district_name"], // Only return these fields
        order: [["district_name", "ASC"]], // Sort alphabetically by name
      });

      // If no districts found, return empty array
      if (!districts || districts.length === 0) {
        return {
          success: true,
          message: "No districts found",
          districts: [],
        };
      }

      // Return successful response with districts data
      return {
        success: true,
        message: "Districts loaded successfully",
        districts: districts.map((district) => ({
          code: district.district_code,
          name: district.district_name,
        })),
      };
    } catch (error) {
      console.error("Error in getDistrict service:", error);
      return {
        success: false,
        message: "Failed to fetch districts",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  //--------------------------------

  //------------------Get SubDistrict-----------

  static async getSubDistrict(districtCode) {
    try {
      // Validate input
      if (!districtCode) {
        return {
          success: false,
          message: "District code is required",
          timestamp: new Date().toISOString(),
        };
      }

      // Fetch subdistricts for the specified district
      const subdistricts = await db.Subdistrict.findAll({
        where: { district_code: districtCode },
        attributes: ["subdistrict_code", "subdistrict_name"],
        order: [["subdistrict_name", "ASC"]],
      });
      //throw new error ('randomfsd');

      // Return empty array if no subdistricts found
      if (!subdistricts || subdistricts.length === 0) {
        return {
          success: true,
          message: `No subdistricts found for district code: ${districtCode}`,
          subdistricts: [],
        };
      }

      // Return successful response
      return {
        success: true,
        message: "Subdistricts loaded successfully",
        district_code: districtCode,
        subdistricts: subdistricts.map((sub) => ({
          code: sub.subdistrict_code,
          name: sub.subdistrict_name,
        })),
      };
    } catch (error) {
      console.error("Error fetching subdistricts:", error);
      return {
        success: false,
        message: "Failed to fetch subdistricts",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  //-----------------------------------------------

  //-------------------Get Villages--------------
  // ============= Get Villages by Subdistrict Code ====================
  static async getVillage(subdistrictCode) {
    try {
      // Validate input
      if (!subdistrictCode) {
        return {
          success: false,
          message: "Subdistrict code is required",
          timestamp: new Date().toISOString(),
        };
      }

      // Fetch villages for the specified subdistrict
      const villages = await db.Village.findAll({
        where: { subdistrict_code: subdistrictCode },
        attributes: ["village_code", "village_name"],
        order: [["village_name", "ASC"]],
      });

      // Return empty array if no villages found
      if (!villages || villages.length === 0) {
        return {
          success: true,
          message: `No villages found for subdistrict code: ${subdistrictCode}`,
          villages: [],
        };
      }

      // Return successful response
      return {
        success: true,
        message: "Villages loaded successfully",
        subdistrict_code: subdistrictCode,
        villages: villages.map((village) => ({
          code: village.village_code,
          name: village.village_name,
        })),
      };
    } catch (error) {
      console.error("Error fetching villages:", error);
      return {
        success: false,
        message: "Failed to fetch villages",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  //-----------------------------

  static async generateUniqueTripId() {
    let tId;
    let exists = true;
    //console.log("test function");

    while (exists) {
      // ===== Generate Trip ID =====
      const today = new Date();

      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();

      const dateString = `${day}${month}${year}`;

      const randomNum = String(Math.floor(Math.random() * 1000000)).padStart(
        6,
        "0",
      );

      const combined = dateString + randomNum;

      tId = BigInt(combined).toString(36).toUpperCase();

      // ===== Check Existing =====
      exists = await db.Trip.findOne({
        where: { tId },
        attributes: ["tId"],
      });
    }

    return tId;
  }
  //------------------------------
  // =============create_new_trip========================
  static async newtrip(tripData, id) {
    let createdPassengers;
    let tripWithConvey;
    let returnTrip = null;
    let createdReturnTrip = null;

    // 🔐 Declaration enforcement
    if (tripData.declarationAccepted !== true) {
      throw new Error("Declaration not accepted. Trip submission denied.");
    }

    const tripDTO = new TripRequestDTO(tripData);
    const validation = tripDTO.validate();

    // console.log("Trip DTO validation result:", tripDTO.remarks);

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // ===== Get registration ID =====
    let regIdObj = await Registration.findOne({
      where: { userId: id },
      attributes: ["reg_id"],
    });
    let reg_id = regIdObj ? regIdObj.get("reg_id") : null;

    const tId = await this.generateUniqueTripId();

    // ===== Create forward trip =====
    const newTrip = await db.Trip.create({
      tId,
      reg_id,
      vId: tripDTO.vId,
      dId: tripDTO.dId,
      origin: tripDTO.origin,
      destination: tripDTO.destination,
      date: tripDTO.date,
      convoyTime: tripDTO.convoyTime,
      isTourist: tripDTO.isTourist,
      status: "1",
      verifiystatus: 0,
      remarks: tripDTO.remarks,
    });

    // ===== Add forward passengers =====
    const passengersToCreate = tripDTO.Passengers.map((p) => ({
      passengerName: p.PassengerName,
      fatherName: p.FatherName || null,
      isForeigner: p.isForeigner === 1 ? 1 : 0,
      phoneNo: p.PhoneNo,
      age: p.Age,
      gender: p.Gender,
      docType: p.docType,
      docId: p.docId,
      nationality: p.isForeigner ? p.Nationality : null,
      visaNumber: p.isForeigner ? p.VisaNo : null,
      residence: p.Residence || null,
      lastStayInAndaman: p.LastStayInAndaman || null,
      isIslander: p.isForeigner === 1 ? 0 : p.isIslander,
    }));

    createdPassengers = await Passenger.bulkCreate(passengersToCreate);

    // ===== Create forward trip relation =====
    const tripPassengersToCreate = createdPassengers.map((p) => ({
      tId: newTrip.tId,
      pId: p.pId,
      status: 1,
    }));

    await tripRelation.bulkCreate(tripPassengersToCreate);

    // ===== Fetch forward trip with convey =====
    tripWithConvey = await db.Trip.findOne({
      where: { tId: newTrip.tId },
      include: [
        {
          model: db.TConvey,
          as: "convey",
          attributes: ["id", "convey_time", "convey_name"],
        },
      ],
    });

    // ================= RETURN TRIP LOGIC =================
    if (tripData.isReturn) {
      const returnTId = await this.generateUniqueTripId();

      let passengersForReturn;

      // ✅ SAME passengers
      if (!tripDTO.returnType || tripDTO.returnType === "same") {
        passengersForReturn = createdPassengers;
      } else {
        // 🔁 DIFFERENT passengers
        const returnPassengersSource = tripDTO.returnPassengers;

        passengersForReturn = await Passenger.bulkCreate(
          returnPassengersSource.map((p) => ({
            passengerName: p.PassengerName,
            fatherName: p.FatherName || null,
            isForeigner: p.isForeigner === 1 ? 1 : 0,
            phoneNo: p.PhoneNo,
            age: p.Age,
            gender: p.Gender,
            docType: p.docType,
            docId: p.docId,
            nationality: p.isForeigner ? p.Nationality : null,
            visaNumber: p.isForeigner ? p.VisaNo : null,
            residence: p.Residence || null,
            lastStayInAndaman: p.LastStayInAndaman || null,
            isIslander: p.isForeigner === 1 ? 0 : p.isIslander,
          })),
        );
      }

      // 🔁 Create return trip
      createdReturnTrip = await db.Trip.create({
        tId: returnTId,
        reg_id,
        vId: tripDTO.returnTripData?.vId || tripDTO.vId,
        dId: tripDTO.returnTripData?.dId || tripDTO.dId,
        origin: tripDTO.returnTripData?.origin || tripDTO.destination,
        destination: tripDTO.returnTripData?.destination || tripDTO.origin,
        date: tripDTO.returnTripData?.date || tripDTO.returnDate,
        convoyTime:
          tripDTO.returnTripData?.convoyTime || tripDTO.returnConvoyTime,
        isTourist: tripDTO.isTourist,
        status: "1",
        verifiystatus: 0,
      });

      // 🔗 Create return relation
      const returnRelations = passengersForReturn.map((p) => ({
        tId: returnTId,
        pId: p.pId,
        status: 1,
      }));

      await tripRelation.bulkCreate(returnRelations);
      returnTrip = await db.Trip.findOne({
        where: { tId: createdReturnTrip.tId },
        include: [
          {
            model: db.TConvey,
            as: "convey",
            attributes: ["id", "convey_time", "convey_name"],
          },
        ],
      });
    }

    // ===== FINAL RESPONSE =====
    return {
      message: "Trip registered successfully",
      trip: {
        ...tripWithConvey.toJSON(),
        conveyTimeName: tripWithConvey.convey?.convey_name || null,
        conveyTimeValue: tripWithConvey.convey?.convey_time || null,
      },
      returnTrip: returnTrip
        ? {
            ...returnTrip.toJSON(),
            conveyTimeName: returnTrip.convey?.convey_name || null,
            conveyTimeValue: returnTrip.convey?.convey_time || null,
          }
        : null,
    };
  }
  // -------------------

  //--------------special convoy trip----------------

  static async splnewtrip(tripData, id) {

    const { Op, fn, col, where } = require("sequelize");

    // ===== DTO VALIDATION =====
    const tripDTO = new TripRequestDTO(tripData);
    const validation = tripDTO.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // ===== GET reg_id =====
    let regIdObj = await Registration.findOne({
      where: { userId: id },
      attributes: ["reg_id"],
    });
    let reg_id = regIdObj ? regIdObj.get("reg_id") : null;

    // ===== SET RANGE =====
    let baseStart = 0;
    let baseEnd = null;

    if (Number(tripDTO.specialType) === 100) {
      baseStart = 100;
      baseEnd = 199;
    } else if (Number(tripDTO.specialType) === 200) {
      baseStart = 200;
      baseEnd = null;
    } else {
      throw new Error("Invalid specialType");
    }

    // ===== FIND LAST conveyid =====
    const lastConvey = await db.ConveyControl.findOne({
      where: {
        checkpostid: Number(tripDTO.origin),
        [Op.and]: [
          where(fn("DATE", col("date")), tripDTO.date),
          baseEnd
            ? { conveyid: { [Op.between]: [baseStart, baseEnd] } }
            : { conveyid: { [Op.gte]: baseStart } },
        ],
      },
      order: [["conveyid", "DESC"]],
    });

    // ===== GENERATE conveyid =====
    let newConveyId = lastConvey ? lastConvey.conveyid + 1 : baseStart;


    // ===== INSERT INTO ConveyControl =====
    await db.ConveyControl.create({
      conveyid: newConveyId,
      checkpostid: Number(tripDTO.origin),
      date: tripDTO.date,
      starttime: tripDTO.convoyTime,
      closetime: tripDTO.convoyTime,
      status: 0,
    });

    const tId = await this.generateUniqueTripId();

    // ===== INSERT INTO TRIP =====
    const newTrip = await db.Trip.create({
      tId,
      reg_id,
      vId: tripDTO.vId,
      dId: tripDTO.dId,
      origin: tripDTO.origin,
      destination: tripDTO.destination,
      date: tripDTO.date,
      remarks: tripDTO.remarks,

      // 🔥 IMPORTANT: store conveyid
      convoyTime: newConveyId,

      isTourist: tripDTO.isTourist,
      status: "2",
      verifiystatus: 2,
    });


    // ===== ADD PASSENGERS (SPECIAL CONVOY) =====
    if (tripDTO.Passengers && tripDTO.Passengers.length > 0) {
      const passengersToCreate = tripDTO.Passengers.map((p) => ({
        passengerName: p.PassengerName,
        fatherName: p.FatherName || null,
        isForeigner: p.isForeigner === 1 ? 1 : 0,
        phoneNo: p.PhoneNo,
        age: p.Age,
        gender: p.Gender,
        docType: p.docType,
        docId: p.docId,
        nationality: p.isForeigner ? p.Nationality : null,
        visaNumber: p.isForeigner ? p.VisaNo : null,
        residence: p.Residence || null,
        lastStayInAndaman: p.LastStayInAndaman || null,
      }));

      const createdPassengers =
        await db.Passenger.bulkCreate(passengersToCreate);

      const tripPassengersToCreate = createdPassengers.map((p) => ({
        tId: newTrip.tId,
        pId: p.pId,
        status: 1,
      }));

      await db.tripRelation.bulkCreate(tripPassengersToCreate);
    }

    // ===== AUTO APPROVAL (Special Convoy) =====
    await db.ApproveTrip.create({
      tId: newTrip.tId,
      convey_id: newConveyId,
      checkpost_id: Number(tripDTO.origin),
      remarks: "Auto-approved (Special Convoy)",
      astatus: 1, // approved
      arrdate: tripDTO.date,
      arrtime: tripDTO.convoyTime,
      approveby: reg_id,
    });

    // ===== UPDATE TRIP STATUS =====
    await newTrip.update({
      status: 2, // approved
      verifiystatus: 2, // verified
    });

    // ===== AUTO VERIFIED ENTRY =====
    await db.VerifiedTrip.create({
      tripId: newTrip.tId,
      verifiedby: reg_id,
      remarks: "Auto-verified (Special Convoy)",
      status: 1,
    });

    return {
      message: "Special Trip created successfully",
      trip: newTrip,
    };
  }

  //------------------------------

  //---------get_trip_details_by_reg_id--------------

  static async getTripDetailsbyRegId(tripData, id) {


    // =========================================
    // GET REGISTRATION ID
    // =========================================
    let regIdObj = await Registration.findOne({
      where: { userId: id },
      attributes: ["reg_id"],
    });

    let reg_id = regIdObj ? regIdObj.get("reg_id") : null;


    if (!reg_id) {
      throw new Error("No registration ID found for the given user.");
    }

    // =========================================
    // FETCH TRIPS
    // =========================================
    const trips = await db.Trip.findAll({
      where: {
        reg_id: reg_id,
      },

      include: [
        {
          model: db.Driver,
          as: "driver",
          attributes: ["dFirstName", "dLastName", "licenseNo"],
        },

        {
          model: db.Vehicle,
          as: "vehicle",
          attributes: ["vId", "vNum"],
        },

        {
          model: db.Passenger,
          as: "passengers",
          attributes: ["passengerName", "phoneNo", "docId"],
        },

        {
          model: db.OriginDestination,
          as: "originLocation",
          attributes: ["id", "location"],
        },

        {
          model: db.OriginDestination,
          as: "destinationLocation",
          attributes: ["id", "location"],
        },

        {
          model: db.TConvey,
          as: "convey",
          attributes: ["id", "convey_time", "convey_name"],
        },
      ],

      attributes: [
        "tId",
        "origin",
        "destination",
        "date",
        "vId",
        "dId",
        "convoyTime",
        "status",
        "entrydatetime",
        "verifiystatus",
      ],

      order: [["entrydatetime", "DESC"]],
    });

    const { Op, fn, col, where } = require("sequelize");

    // =========================================
    // LOOP ALL TRIPS
    // =========================================
    for (let trip of trips) {
      if (trip.convoyTime !== null) {
        const convoyVal = Number(trip.convoyTime);

        // =========================================
        // FIX TCONVEY
        // =========================================
        if (convoyVal >= 100 && convoyVal <= 199) {
          const convey = await db.TConvey.findOne({
            where: { id: 100 },

            attributes: ["id", "convey_time", "convey_name"],
          });

          trip.dataValues.convey = convey;
        } else if (convoyVal >= 200) {
          const convey = await db.TConvey.findOne({
            where: { id: 200 },

            attributes: ["id", "convey_time", "convey_name"],
          });

          trip.dataValues.convey = convey;
        }

        // =========================================
        // GET START TIME
        // =========================================
        if (convoyVal >= 100) {
          const conveyControl = await db.ConveyControl.findOne({
            where: {
              conveyid: convoyVal,

              checkpostid: Number(trip.origin),

              [Op.and]: [where(fn("DATE", col("date")), trip.date)],
            },

            attributes: ["starttime", "closetime"],
          });

          if (conveyControl && trip.dataValues.convey) {
            trip.dataValues.convey.dataValues = {
              ...trip.dataValues.convey.dataValues,

              actual_start_time: conveyControl.starttime,
            };
          }
        }
      }
    }

    // =========================================
    // TOTAL TRIPS
    // =========================================
    const totalTrips = trips.length;

    // =========================================
    // TODAY DATE
    // =========================================
    const todayDate = new Date().toISOString().split("T")[0];

    // =========================================
    // FILTERED TRIP LIST
    // =========================================
    const tripList = trips.filter((trip) => trip.date >= todayDate);

    // =========================================
    // RESPONSE
    // =========================================
    return {
      message: "Trip details loaded successfully",

      totalTrips,

      tripList,

      trips,
    };
  }

  //----------------------

  static async getTripDetailsbyRegIdCItizen(tripData, id) {
    try {
      const { Op, fn, col, where } = require("sequelize");


      // ===============================
      // PAGINATION
      // ===============================
      const page = Number(tripData.page) || 1;
      const limit = Number(tripData.limit) || 100;

      const offset = (page - 1) * limit;

      // ===============================
      // GET REG ID
      // ===============================
      const regIdObj = await Registration.findOne({
        where: { userId: id },
        attributes: ["reg_id"],
      });

      const reg_id = regIdObj ? regIdObj.get("reg_id") : null;

      if (!reg_id) {
        throw new Error("No registration ID found");
      }

      // ===============================
      // MAIN WHERE
      // ===============================
      const whereClause = {
        reg_id,
      };

      // ===============================
      // TRIP TYPE FILTER
      // ===============================
      const today = new Date().toISOString().split("T")[0];

      if (tripData.tripType === "todays") {
        whereClause.date = today;
      }

      if (tripData.tripType === "upcoming") {
        whereClause.date = {
          [Op.gte]: today,
        };

        whereClause.status = {
          [Op.notIn]: [2, 3],
        };
      }

      if (tripData.tripType === "completed") {
        whereClause.status = 2;
      }

      if (tripData.tripType === "rejected") {
        whereClause.status = {
          [Op.in]: [0, 3],
        };
      }
      // DATE FILTER
      if (tripData.selectedDate) {
        whereClause.date = tripData.selectedDate;
      }

      // ===============================
      // SEARCH FILTER
      // ===============================
      // ===============================
      // SEARCH FILTER
      // ===============================
      if (tripData.searchTerm && tripData.searchTerm.trim() !== "") {
        // querySearch = tripData.searchTerm.trim();
        const querySearch = tripData.searchTerm.trim();
        whereClause[Op.or] = [
          {
            tId: {
              [Op.like]: `%${querySearch}%`,
            },
          },

          {
            "$vehicle.vNum$": {
              [Op.like]: `%${querySearch}%`,
            },
          },
        ];
      }

      // ===============================
      // FETCH DATA
      // ===============================
      const result = await db.Trip.findAndCountAll({
        where: whereClause,

        include: [
          {
            model: db.Driver,
            as: "driver",
            attributes: ["dFirstName", "dLastName", "licenseNo"],
          },

          {
            model: db.Vehicle,
            as: "vehicle",
            required: false,
            attributes: ["vId", "vNum", "vCat"],
          },

          {
            model: db.OriginDestination,
            as: "originLocation",
            attributes: ["id", "location"],
          },

          {
            model: db.OriginDestination,
            as: "destinationLocation",
            attributes: ["id", "location"],
          },

          {
            model: db.TConvey,
            as: "convey",
            attributes: ["id", "convey_time", "convey_name"],
          },
        ],

        attributes: [
          "tId",
          "origin",
          "destination",
          "date",
          "vId",
          "dId",
          "convoyTime",
          "status",
          "entrydatetime",
          "verifiystatus",
        ],

        limit,
        offset,

        distinct: true,
        col: "tId",
        subQuery: false,

        order: [["entrydatetime", "DESC"]],
      });
      const trips = result.rows;
      const totalRecords = result.count;


      // ===============================
      // CONVOY FIX LOGIC
      // ===============================
      for (let trip of trips) {
        if (trip.convoyTime !== null) {
          const convoyVal = Number(trip.convoyTime);

          if (convoyVal >= 100 && convoyVal <= 199) {
            const convey = await db.TConvey.findOne({
              where: { id: 100 },
              attributes: ["id", "convey_time", "convey_name"],
            });

            trip.dataValues.convey = convey;
          } else if (convoyVal >= 200) {
            const convey = await db.TConvey.findOne({
              where: { id: 200 },
              attributes: ["id", "convey_time", "convey_name"],
            });

            trip.dataValues.convey = convey;
          }

          if (convoyVal >= 100) {
            const conveyControl = await db.ConveyControl.findOne({
              where: {
                conveyid: convoyVal,
                checkpostid: Number(trip.origin),

                [Op.and]: [where(fn("DATE", col("date")), trip.date)],
              },

              attributes: ["starttime", "closetime"],
            });

            if (conveyControl && trip.dataValues.convey) {
              trip.dataValues.convey.dataValues = {
                ...trip.dataValues.convey.dataValues,
                actual_start_time: conveyControl.starttime,
              };
            }
          }
        }
      }

      // ===============================
      // RESPONSE
      // ===============================
      return {
        message: "Trip details loaded successfully",

        totalRecords,

        currentPage: page,

        chunkSize: limit,

        totalChunks: Math.ceil(totalRecords / limit),

        trips,
      };
    } catch (error) {
      console.error("Error:", error);

      throw error;
    }
  }

  static async getTripDetailsbyTripId(tripData, id) {

    // ✅ Fetch main Trip with associations
    const trips = await db.Trip.findOne({
      where: { tId: tripData.tId },
      include: [
        {
          model: db.Passenger,
          as: "passengers",
          attributes: [
            "passengerName",
            "docType",
            "docId",
            "phoneNo",
            "gender",
            "age",
          ],
          through: {
            attributes: [], // hide junction fields
            where: { status: 1 }, // ✅ only passengers with status = 1
          },
        },
        {
          model: db.Driver,
          as: "driver",
          attributes: ["dFirstName", "dLastName", "licenseNo"],
          include: [
            {
              model: db.DriverStatus,
              as: "sts",
              attributes: ["phNo", "Status"],
            },
          ],
        },
        {
          model: db.Vehicle,
          as: "vehicle",
          attributes: ["vNum", "vCat", "ownershipType"],
        },
        {
          model: db.OriginDestination,
          as: "originLocation",
          attributes: ["id", "location"],
        },
        {
          model: db.OriginDestination,
          as: "destinationLocation",
          attributes: ["id", "location"],
        },
        {
          model: db.TConvey,
          as: "convey",
          attributes: ["id", "convey_time", "convey_name"],
        },
      ],
      attributes: [
        "dId",
        "tId",
        "origin",
        "destination",
        "date",
        "convoyTime",
        "status",
        "verifiystatus",
        "remarks",
      ],
    });

    // ✅ Fetch CheckoutTrip independently (already includes checkpost location)
    const checkoutTripsRaw = await db.CheckoutTrip.findAll({
      where: { tId: tripData.tId },
      include: [
        {
          model: db.OriginDestination,
          as: "checkpostLocation",
          attributes: ["id", "location"],
        },
      ],
      attributes: [
        "id",
        "tId",
        "checkoutdate",
        "checkouttime",
        "checkpostid",
        "remarks",
        "status",
      ],
    });

    const checkoutTrips = checkoutTripsRaw.length
      ? checkoutTripsRaw
      : [{ message: "No data found in CheckoutTrip" }];

    // ✅ Fetch ApproveTrip with convey & checkpost
    const approveTripRaw = await db.ApproveTrip.findOne({
      where: { tId: tripData.tId },
      include: [
        {
          model: db.TConvey,
          as: "convey",
          attributes: ["id", "convey_time", "convey_name"],
        },
        {
          model: db.OriginDestination,
          as: "checkpost",
          attributes: ["id", "location"],
        },
      ],
      attributes: [
        "id",
        "tId",
        "arrdate",
        "arrtime",
        "convey_id",
        "checkpost_id",
        "remarks",
        "astatus",
      ],
    });

    const approveTrip = approveTripRaw
      ? approveTripRaw
      : { message: "No data found in ApproveTrip" };

    // ===== FIX SPECIAL CONVOY MAPPING =====
    if (trips && trips.convoyTime !== null) {
      const convoyVal = Number(trips.convoyTime);

      if (convoyVal >= 100 && convoyVal <= 199) {
        const convey = await db.TConvey.findOne({
          where: { id: 100 },
          attributes: ["id", "convey_time", "convey_name"],
        });

        trips.dataValues.convey = convey;
      } else if (convoyVal >= 200) {
        const convey = await db.TConvey.findOne({
          where: { id: 200 },
          attributes: ["id", "convey_time", "convey_name"],
        });

        trips.dataValues.convey = convey;
      }
      // ===== GET REAL START TIME FROM ConveyControl =====
      if (convoyVal >= 100) {
        const conveyControl = await db.ConveyControl.findOne({
          where: {
            conveyid: convoyVal,
            checkpostid: Number(trips.origin),
            [Op.and]: [where(fn("DATE", col("date")), trips.date)],
          },
          attributes: ["starttime", "closetime"],
        });

        if (conveyControl && trips.dataValues.convey) {
          trips.dataValues.convey.dataValues = {
            ...trips.dataValues.convey.dataValues,
            actual_start_time: conveyControl.starttime,
            actual_close_time: conveyControl.closetime,
          };
        }
      }
    }

    return {
      message: "Trip details loaded successfully",
      trips,
      checkoutTrips,
      approveTrip,
    };
  }

  //--------------------------

  //get trip_details_by date role police, parameters - dt

  static async getTripDetailsbydt(param) {
    // ✅ Current Kolkata date
    const currentDate = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    // ✅ Base where condition
    const whereConditions = {
      status: 1,
      verifiystatus: 0,

      [db.Sequelize.Op.and]: [
        db.Sequelize.where(
          db.Sequelize.fn("DATE", db.Sequelize.col("date")),
          currentDate,
        ),
      ],
    };

    // ✅ Location filter
    if (param?.locationid === 1) {
      whereConditions.origin = 1;
    } else if (param?.locationid === 2) {
      whereConditions.origin = {
        [db.Sequelize.Op.ne]: 1,
      };
    } else if (param?.locationid) {
      whereConditions.origin = param.locationid;
    }

    // ✅ Fetch trip data
    const trips = await db.Trip.findAll({
      where: whereConditions,

      attributes: [
        "origin",
        "destination",
        "date",
        "convoyTime",
        "vId",
        "tId",
        "entrydatetime",
        "verifiedtime",
      ],

      include: [
        {
          model: db.Passenger,
          as: "passengers",

          attributes: ["passengerName", "docId", "phoneNo"],

          through: {
            attributes: [],
            where: { status: 1 },
          },
        },

        {
          model: db.OriginDestination,
          as: "originLocation",
          attributes: ["id", "location"],
        },

        {
          model: db.OriginDestination,
          as: "destinationLocation",
          attributes: ["id", "location"],
        },

        {
          model: db.Vehicle,
          as: "vehicle",
          attributes: ["vNum", "vCat"],
        },

        {
          model: db.TConvey,
          as: "convey",
          attributes: ["id", "convey_time", "convey_name"],
        },
      ],
    });

    // ✅ Logs

    // ✅ DTO Response
    return {
      message: "Trip details loaded successfully",

      trips: TripDetailsByDateResponseDTO.response(trips),
    };
  }

  //---------------------------------

  //get pending verified trip list
  static async getPendingTripDetailsbydt(param) {
    const now = new Date();
    const kolkataTimeString = now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const kolkataTime = new Date(kolkataTimeString);
    const year = kolkataTime.getFullYear();
    const month = String(kolkataTime.getMonth() + 1).padStart(2, "0");
    const day = String(kolkataTime.getDate()).padStart(2, "0");
    const currentDate = `${year}-${month}-${day}`;

    const whereConditions = [
      db.Sequelize.where(
        db.Sequelize.fn("DATE", db.Sequelize.col("date")),
        currentDate,
      ),
      { status: 1 },
      { verifiystatus: 0 },
    ];

    // 🟩 Location-based filter
    if (param?.locationid === 1) {
      whereConditions.push({ origin: 1 });
    } else if (param?.locationid === 2) {
      whereConditions.push({
        origin: { [db.Sequelize.Op.ne]: 1 }, // origin not equal to 1
      });
    } else if (param?.locationid) {
      whereConditions.push({ origin: param.locationid });
    }

    const trips = await db.Trip.findAll({
      where: { [db.Sequelize.Op.and]: whereConditions },
      include: [
        {
          model: db.Passenger,
          as: "passengers",
          attributes: ["passengerName", "docId", "phoneNo"],
          through: {
            attributes: [], // hide junction fields
            where: { status: 1 },
          },
        },
        {
          model: db.OriginDestination,
          as: "originLocation",
          attributes: ["id", "location"],
        },
        {
          model: db.OriginDestination,
          as: "destinationLocation",
          attributes: ["id", "location"],
        },
        { model: db.Vehicle, as: "vehicle", attributes: ["vNum", "vCat"] },
        {
          model: db.TConvey,
          as: "convey",
          attributes: ["id", "convey_time", "convey_name"],
        },
      ],
      attributes: [
        "origin",
        "destination",
        "date",
        "convoyTime",
        "vId",
        "tId",
        "entrydatetime",
      ],
    });


    return {
      message: "Trip details loaded successfully",
      trips,
    };
  }

  //-----------Trip Approval------------
  static async tripApproval({
    tId,
    buttonId,
    convey_id,
    checkpost_id,
    remarks,
    astatus,
  }, approveby) {
    // `approveby` is the signed-in officer's reg_id, never the request body.
    // Trip status 2 = approved, 3 = rejected.
    if (![2, 3].includes(Number(buttonId)) || ![0, 1].includes(Number(astatus))) {
      throw httpError("Invalid approval status");
    }

    const transaction = await db.sequelize.transaction();

    try {
      const trip = await db.Trip.findOne({
        where: { tId },
        transaction,
      });

      if (!trip) {
        throw httpError("Trip not found", 404);
      }

      // 1️⃣ Insert approval record
      await db.ApproveTrip.create(
        {
          tId,
          convey_id,
          checkpost_id,
          remarks,
          astatus,
          arrdate: new Date(),
          arrtime: new Date(),
          approveby,
        },
        { transaction },
      );

      // 2️⃣ Update trip status + verification status
      await trip.update(
        {
          status: buttonId,

          // ✅ SKIP VERIFICATION → SET TO 2
          verifiystatus: Number(astatus) === 1 ? 2 : trip.verifiystatus,
        },
        { transaction },
      );

      // 3️⃣ Insert verified_trip ONLY when approved
      if (Number(astatus) === 1) {
        await db.VerifiedTrip.create(
          {
            tripId: tId,
            verifiedby: approveby,
            remarks: "Auto-verified during approval",
            status: 1, // ✅ match verifiystatus
          },
          { transaction },
        );
      }
      if (Number(astatus) === 0) {
        await db.VerifiedTrip.create(
          {
            tripId: tId,
            verifiedby: approveby,
            remarks: remarks,
            status: 0, // ✅ match verifiystatus
          },
          { transaction },
        );
      }

      await transaction.commit();

      return {
        message: "Trip approved and verified successfully",
        trip,
      };
    } catch (error) {
      await transaction.rollback();

      if (
        error.name === "SequelizeUniqueConstraintError" ||
        error.original?.code === "ER_DUP_ENTRY"
      ) {
        throw httpError("Trip already approved", 409);
      }

      throw error;
    }
  }

  //--------------------------------
  //throw new Error("random");

  static async getallTripDetails(params) {
    const whereClause = {};

    //  Conditional origin logic
    if (Number(params.checkpostid) === 2) {
      whereClause.origin = { [Op.ne]: 1 }; // origin NOT equal to 1
    } else {
      whereClause.origin = params.checkpostid;
    }

    const trips = await db.Trip.findAll({
      where: whereClause,
      include: [
        {
          model: db.Passenger,
          as: "passengers",
          attributes: ["passengerName", "docId", "phoneNo"],
        },
      ],
      attributes: [
        "origin",
        "destination",
        "date",
        "convoyTime",
        "status",
        "verifiystatus",
        "tId",
        "entrydatetime",
      ],
    });

    return {
      message: "Trip details loaded successfully",
      trips,
    };
  }

  static async getallApproveTripDetails(params, res) {
    try {

      // Extract parameters safely
      const statuscode =
        typeof params === "object"
          ? params?.statuscode?.toString()
          : params?.toString();

      const checkpostcode =
        typeof params === "object"
          ? params?.checkpostid?.toString()
          : params?.toString();

      const conveyId =
        typeof params === "object" ? params?.conveyid?.toString() : null;

      let whereCondition = {};

      // ✅ Origin logic ONLY if checkpostid is provided
      if (
        checkpostcode !== undefined &&
        checkpostcode !== null &&
        checkpostcode !== ""
      ) {
        if (checkpostcode === "2") {
          whereCondition.origin = { [Op.ne]: 1 };
        } else {
          whereCondition.origin = checkpostcode;
        }
      }

      // OR condition only when statuscode is 3
      if (statuscode === "3") {
        // status = 3 OR verifiystatus = 3
        whereCondition[Op.or] = [{ status: "3" }, { verifiystatus: 3 }];
      } else if (statuscode === "1") {
        // status = 1 AND verifiystatus IN (0, 2)
        whereCondition.status = "1";
        whereCondition.verifiystatus = {
          [Op.in]: [0, 2],
        };
      } else {
        // default case
        whereCondition.status = statuscode;
      }

      // Convey filter
      if (conveyId) {
        whereCondition.convoyTime = conveyId;
      }

      // Query all approved trip details
      const trips = await db.Trip.findAll({
        where: whereCondition,
        include: [
          {
            model: db.ApproveTrip,
            as: "approveDetails",
            include: [
              {
                model: db.TConvey,
                as: "convey",
                attributes: ["id", "convey_time", "convey_name"],
              },
              {
                model: db.OriginDestination,
                as: "checkpost",
                attributes: ["id", "location"],
              },
            ],
          },

          {
            model: db.Passenger,
            as: "passengers",
            attributes: ["passengerName", "docId", "phoneNo"],
            through: {
              attributes: [],
              where: { status: 1 },
            },
          },
          {
            model: db.TConvey,
            as: "convey",
            attributes: ["id", "convey_time", "convey_name"],
          },

          {
            model: db.OriginDestination,
            as: "originLocation",
            attributes: ["id", "location"],
          },
          {
            model: db.OriginDestination,
            as: "destinationLocation",
            attributes: ["id", "location"],
          },
          {
            model: db.Vehicle,
            as: "vehicle",
            attributes: ["vId", "ownershipType", "vNum", "vCat"],
          },
        ],
        attributes: [
          "tId",
          "origin",
          "destination",
          "date",
          "convoyTime",
          "status",
          "verifiystatus",
          "entrydatetime",
          "vId",
        ],
        order: [["entrydatetime", "DESC"]],
      });

      // Add rejection-stage logic
      const formattedTrips = trips.map((trip) => {
        let rejectedStage = "N/A";

        if (trip.approveDetails?.astatus === 0) {
          rejectedStage = "Trip Approval";
        } else if (trip.status === "3" || trip.verifiystatus === 3) {
          rejectedStage = "Verify Trips";
        }

        return {
          ...trip.toJSON(),
          rejectedStage,
        };
      });

      // Return response
      return {
        message: "All Approved Trip Details Loaded Successfully",
        trips: formattedTrips,
      };
    } catch (error) {
      console.error("Error fetching approved trip details:", error.message);
      throw error;
    }
  }

  static async getallApproveTrip(params, res) {
    try {

      const approveCheckpostId =
        typeof params === "object" ? params?.checkpostid?.toString() : null;
      const approveConveyId =
        typeof params === "object" ? params?.conveyid?.toString() : null;

      const { Op } = require("sequelize");
      const approveWhere = {
        astatus: { [Op.ne]: 0 },

        // ✅ ADD THIS CONDITION
        convey_id: {
          [Op.lt]: 99, // only normal convoy
        },
      };

      // ✅ SEARCH SUPPORT (Trip ID)
      if (params?.searchTerm && params.searchTerm.trim() !== "") {
        approveWhere.tId = {
          [Op.like]: `%${params.searchTerm.trim()}%`,
        };

        // When searching, ignore pagination
      }

      if (approveCheckpostId) approveWhere.checkpost_id = approveCheckpostId;
      if (approveConveyId) approveWhere.convey_id = approveConveyId;
      if (params?.filteredDate) approveWhere.arrdate = params.filteredDate;

      // ✅ Fetch Convoy Timing
      const convoyTiming =
        approveConveyId && approveCheckpostId && params?.filteredDate
          ? await db.ConveyControl.findOne({
              where: {
                conveyid: approveConveyId,
                checkpostid: approveCheckpostId,
                date: params.filteredDate,
              },
              attributes: ["starttime", "closetime", "date"],
            })
          : null;

      // ✅ Fetch trips with passengers in one query
      const { count, rows: trips } = await db.Trip.findAndCountAll({
        include: [
          // ================= APPROVE DETAILS =================
          {
            model: db.ApproveTrip,
            as: "approveDetails",
            where: approveWhere,
            required: true, // optional but recommended
            attributes: [
              "id",
              "arrdate",
              "arrtime",
              "convey_id",
              "checkpost_id",
              "remarks",
              "astatus",
              "approveby",
            ],
            include: [
              {
                model: db.TConvey,
                as: "convey",
                attributes: ["id", "convey_time", "convey_name"],
              },
              {
                model: db.OriginDestination,
                as: "checkpost",
                attributes: ["id", "location"],
              },
              // ✅ APPROVER (CORRECT PLACE)
              {
                model: db.PoliceRegistration,
                as: "approverOfficer",
                attributes: [
                  "reg_id",
                  "title",
                  "firstName",
                  "lastName",
                  "designation",
                ],
              },
            ],
          },

          // ================= VERIFIED DETAILS =================
          {
            model: db.VerifiedTrip,
            as: "verifiedDetails",
            required: false,
            attributes: ["verifiedby", "vdate", "vtime"],
            include: [
              // ✅ VERIFIER (CORRECT PLACE)
              {
                model: db.PoliceRegistration,
                as: "verifiedOfficer",
                attributes: [
                  "reg_id",
                  "title",
                  "firstName",
                  "lastName",
                  "designation",
                ],
              },
            ],
          },

          // ================= OTHER INCLUDES =================
          {
            model: db.OriginDestination,
            as: "originLocation",
            attributes: ["id", "location"],
          },
          {
            model: db.OriginDestination,
            as: "destinationLocation",
            attributes: ["id", "location"],
          },
          {
            model: db.TConvey,
            as: "convey",
            attributes: ["id", "convey_time", "convey_name"],
          },
          {
            model: db.Vehicle,
            as: "vehicle",
            attributes: ["vId", "ownershipType", "vNum", "vCat"],
          },
          {
            model: db.Driver,
            as: "driver",
            attributes: ["dFirstName", "dLastName"],
          },
          {
            model: db.Passenger,
            as: "passengers",
            attributes: [
              "pId",
              "passengerName",
              "docId",
              "phoneNo",
              "gender",
              "age",
            ],
            through: { attributes: [], where: { status: 1 } },
            duplicating: false,
          },
        ],
        order: [["entrydatetime", "DESC"]],

        distinct: true,
      });

      // Updated on 31st December 2025
      // ================= VEHICLE CATEGORY COUNTS =================
      const vehicleCounts = {
        Government: 0,
        Commercial: 0,
        Private: 0,
      };

      trips.forEach((trip) => {
        if (!trip.vehicle || !trip.vehicle.ownershipType) return;

        const type = trip.vehicle.ownershipType;

        if (vehicleCounts[type] !== undefined) {
          vehicleCounts[type]++;
        }
      });

      // ================= PASSENGER COUNTS =================

      // ✅ Compute gender totals in one pass
      let totalMale = 0;
      let totalFemale = 0;
      let totalChild = 0;
      let totalPassengers = 0;

      trips.forEach((trip) => {
        const passengers = trip.passengers || [];
        totalPassengers += passengers.length;

        // ✅ attach child passengers to each trip
        trip.childPassengers = [];

        passengers.forEach((p) => {
          const gender = p.gender?.toLowerCase();
          const age = p.age;

          // ✅ CHILD ONLY
          if (typeof age === "number" && age <= 12) {
            totalChild++;
          }

          // ✅ ADULTS ONLY (12+)
          else if (gender === "male") totalMale++;
          else if (gender === "female") totalFemale++;
        });

      });


      // ✅ Get current server time (Kolkata timezone)
      const moment = require("moment-timezone");
      const reportGeneratedAt = moment()
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY hh:mm A");

      // ✅ Final response
      return {
        message: "Approved Trips Loaded",
        reportGeneratedAt,
        totalRecords: count,
        trips,

        convoyTiming: convoyTiming
          ? {
              starttime: convoyTiming.starttime,
              closetime: convoyTiming.closetime,
              date: convoyTiming.date,
            }
          : null,
        totalPassengers,
        totalMale,
        totalFemale,
        totalChild,
      };
    } catch (error) {
      console.error("❌ Error fetching approved trip details:", error.message);
      throw error;
    }
  }

  static async getallApproeveRejectedPendingTripDetails(params) {
    try {

      const { Op } = require("sequelize");

      //  Trip Filters
      const tripWhere = {};

      //  Approve Filters
      const approveWhere = {};

      //  Chunk Pagination
      const chunkSize = 100;

      const chunkPage = Number(params?.chunkPage) || 1;

      const offset = (chunkPage - 1) * chunkSize;

      // ✅ Status Filter
      if (params?.statuscode !== undefined) {
        tripWhere.status = params.statuscode;

        // ✅ convoyTime < 99
        tripWhere[Op.and] = [
          db.Sequelize.where(
            db.Sequelize.cast(db.Sequelize.col("Trip.convoyTime"), "SIGNED"),
            {
              [Op.lt]: 99,
            },
          ),
        ];
      }

      // ✅ Search Filter (Trip Table)
      if (params?.searchTerm && params.searchTerm.trim() !== "") {
        tripWhere.tId = {
          [Op.like]: `%${params.searchTerm.trim()}%`,
        };
      }

      // ✅ Pending Trips
      if (Number(params?.statuscode) === 1) {
        // ✅ Date Filter from trip_tbl
        if (params?.filteredDate) {
          tripWhere.date = params.filteredDate;
        }

        // ✅ Convoy Filter from trip_tbl
        if (params?.conveyid) {
          tripWhere.convoyTime = params.conveyid;
        }

        if (params?.checkpostid) {
          tripWhere.origin = params.checkpostid;
        }
      }

      // ✅ Approved / Rejected Trips
      else {
        // ✅ Date Filter from approve_trip
        if (params?.filteredDate) {
          approveWhere.arrdate = params.filteredDate;
        }

        // ✅ Convoy Filter from approve_trip
        if (params?.conveyid) {
          approveWhere.convey_id = params.conveyid;
        }

        // ✅ Checkpost Filter
        if (params?.checkpostid) {
          approveWhere.checkpost_id = params.checkpostid;
        }
      }

      // ✅ Vehicle Search Filter
      const vehicleWhere = {};

      if (params?.vehicleSearch && params.vehicleSearch.trim() !== "") {
        vehicleWhere.vNum = {
          [Op.like]: `%${params.vehicleSearch.trim()}%`,
        };
      }

      // ✅ Fetch Trips
      const { count, rows: trips } = await db.Trip.findAndCountAll({
        where: tripWhere,

        attributes: [
          "tId",
          "origin",
          "destination",
          "date",
          "status",
          "convoyTime",
          "updatedate",

          // ✅ Passenger Count
          [
            db.Sequelize.literal(`(
      SELECT COUNT(*)
      FROM trip_relation_tbl AS tr
      WHERE tr.tId = Trip.tId
    )`),
            "passengerCount",
          ],
        ],
        include: [
          // ✅ Origin
          {
            model: db.OriginDestination,

            as: "originLocation",

            attributes: ["id", "location"],
          },

          // ✅ Destination
          {
            model: db.OriginDestination,

            as: "destinationLocation",

            attributes: ["id", "location"],
          },

          // ✅ Vehicle
          {
            model: db.Vehicle,

            as: "vehicle",

            required: Object.keys(vehicleWhere).length > 0,

            where:
              Object.keys(vehicleWhere).length > 0 ? vehicleWhere : undefined,

            attributes: ["vId", "vNum", "vCat"],
          },
          // ✅ Driver
          {
            model: db.Driver,

            as: "driver",

            attributes: ["dId", "dFirstName", "dLastName"],
          },

          // ✅ Requested Convoy
          {
            model: db.TConvey,

            as: "convey",

            attributes: ["id", "convey_time", "convey_name"],
          },

          // ✅ Approve Details
          {
            model: db.ApproveTrip,

            as: "approveDetails",

            required: Object.keys(approveWhere).length > 0,

            where:
              Object.keys(approveWhere).length > 0 ? approveWhere : undefined,
            duplicating: false,

            attributes: [
              "id",
              "convey_id",
              "arrdate",
              "arrtime",
              "astatus",
              "checkpost_id",
              "remarks",
            ],

            include: [
              // ✅ Approved Convoy
              {
                model: db.TConvey,

                as: "convey",

                attributes: ["id", "convey_time", "convey_name"],
              },
            ],
          },
        ],

        order: [["updatedate", "DESC"]],

        // ✅ Backend Chunk Pagination
        limit: chunkSize,

        offset,

        distinct: true,

        subQuery: false,
      });


      return {
        message: "Trips fetched successfully",

        totalRecords: count,

        chunkPage,

        chunkSize,

        totalChunks: Math.ceil(count / chunkSize),

        trips,
      };
    } catch (error) {
      console.error("❌ Error:", error.message);

      throw error;
    }
  }

  static async getAllFilterdata(filterKeys) {
    try {
      const {
        carType,
        ownership,
        purpose,
        status,
        fromLocation,
        toLocation,
        convoyTime,
        fromDate, // ✅ New
        toDate, // ✅ New
        page = 1,
        limit = 10,
      } = filterKeys;

      const offset = (page - 1) * limit;

      const whereCondition = {};
      if (fromLocation) whereCondition.origin = fromLocation;
      if (toLocation) whereCondition.destination = toLocation;

      // ✅ Date range filter with same-date handling
      if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);

        // If both dates are the same, include the entire day
        if (fromDate === toDate) {
          end.setHours(23, 59, 59, 999);
        }

        whereCondition.date = {
          [db.Sequelize.Op.between]: [start, end],
        };
      } else if (fromDate) {
        const start = new Date(fromDate);
        whereCondition.date = {
          [db.Sequelize.Op.gte]: start,
        };
      } else if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        whereCondition.date = {
          [db.Sequelize.Op.lte]: end,
        };
      }

      if (convoyTime) whereCondition.convoyTime = convoyTime;
      if (status) whereCondition.status = status.toString();

      const vehicleWhere = {};
      if (carType) vehicleWhere.vCat = carType;
      if (ownership) vehicleWhere.ownershipType = ownership;
      if (purpose) vehicleWhere.vPurpose = purpose;

      // Count for pagination
      const totalCount = await db.Trip.count({
        where: whereCondition,
        include: [
          {
            model: db.Vehicle,
            as: "vehicle",
            where: Object.keys(vehicleWhere).length ? vehicleWhere : undefined,
          },
        ],
      });

      // Fetch paginated trips
      const trips = await db.Trip.findAll({
        where: whereCondition,
        attributes: [
          "origin",
          "destination",
          "date",
          "convoyTime",
          "status",
          "tId",
        ],
        include: [
          {
            model: db.Vehicle,
            as: "vehicle",
            attributes: [
              "vNum",
              "vCat",
              "otherCat",
              "vPurpose",
              "otherPurpose",
              "ownershipType",
              "deptName",
            ],
            where: Object.keys(vehicleWhere).length ? vehicleWhere : undefined,
          },

          {
            model: db.OriginDestination,
            as: "originLocation",
            attributes: ["id", "location"],
          },
          {
            model: db.OriginDestination,
            as: "destinationLocation",
            attributes: ["id", "location"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["tId", "DESC"]],
      });

      return {
        message: "Filtered trip details loaded successfully",
        trips,

        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        currentPage: parseInt(page),
        appliedFilters: { whereCondition, vehicleWhere },
      };
    } catch (error) {
      console.error("Error in getAllFilterdata:", error);
      throw new Error("Internal Server Error");
    }
  }

  ///////////get all orign Destionation
  static async getAllOriginDestination() {
    try {
      const records = await db.OriginDestination.findAll({
        attributes: ["id", "location", "loc_id"],
        where: {
          status: 1, // ✅ Optional: only fetch active records
        },
      });

      if (!records || records.length === 0) {
        return {
          success: true,
          message: "No origin/destination records found",
          data: [],
        };
      }

      return {
        success: true,
        message: "Origin/Destination records loaded successfully",
        data: records.map((item) => ({
          id: item.id,
          location: item.location,
          loc_id: item.loc_id,
        })),
      };
    } catch (error) {
      console.error("Error in getAllOriginDestination service:", error);
      return {
        success: false,
        message: "Failed to fetch origin/destination records",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async getConveyTimeByLocId(loc_id) {
    try {
      const records = await db.TConvey.findAll({
        where: { loc_id, status: 1 },
        attributes: ["id", "convey_time", "convey_name"],
        order: [["convey_time", "ASC"]],
      });

      if (!records || records.length === 0) {
        return {
          success: true,
          message: "No convey times found for this location",
          data: [],
        };
      }

      return {
        success: true,
        message: "Convey times loaded successfully",
        data: records.map((item) => ({
          id: item.id,
          convey_time: item.convey_time,
          convey_name: item.convey_name,
        })),
      };
    } catch (error) {
      console.error("Error in getConveyTimeByLocId service:", error);
      return {
        success: false,
        message: "Failed to fetch convey times",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

static async registerPolice(registerData) {
  const registerDTO = new PoliceRegistrationDto(registerData);
  const validation = registerDTO.validate();

  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }

  try {
    return await PoliceUser.sequelize.transaction(async (t) => {
      const existingUser = await PoliceUser.findOne({
        where: { email: registerDTO.email },
        transaction: t,
      });

      if (existingUser) {
        throw new Error("Police user already exists with this email");
      }

      const user = await PoliceUser.create(
        {
          email: registerDTO.email,
          password: registerDTO.password,
          role: "police",
          isActive: true,
          status: 1,
        },
        { transaction: t }
      );

      const reg_id = `POLREG_${Math.random()
        .toString(36)
        .substr(2, 8)
        .toUpperCase()}`;

      const registration = await PoliceRegistration.create(
        {
          reg_id: reg_id,
          userId: user.id,
          title: registerDTO.title,
          firstName: registerDTO.firstName,
          lastName: registerDTO.lastName,
          designation: registerDTO.designation,
          emp_id: registerDTO.emp_id,
          checkpost: registerDTO.checkpost,
          contact: registerDTO.contact,
          status: 1,
        },
        { transaction: t }
      );

      const accessToken = JWTConfig.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: "police",
      });

      const refreshToken = JWTConfig.generateRefreshToken({
        userId: user.id,
      });

      user.refreshToken = refreshToken;
      await user.save({ transaction: t });

      await registration.reload({
        include: [
          {
            model: PoliceUser,
            as: "user",
            attributes: { exclude: ["password", "refreshToken"] },
          },
        ],
        transaction: t,
      });

      return new AuthResponseDTO(registration, accessToken, refreshToken);
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new Error("Police user already exists with this email");
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new Error("Invalid checkpost selected");
    }
    throw error;
  }
}

  static async loginPolice(loginData, req) {
    await consumeCaptcha(req, loginData?.captcha);
    const loginNonce = AuthService.requireLoginNonce(loginData);

    const loginDTO = new PoliceLoginRequestDTO(loginData);
    const validation = loginDTO.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // ✅ Find police user by email (status 0 = frozen by admin)
    const user = await db.PoliceUser.findOne({
      where: { email: loginDTO.email, isActive: 1, status: 1 },
      include: [
        {
          model: db.PoliceRegistration,
          as: "registration",
          attributes: [
            "firstName",
            "lastName",
            "designation",
            "checkpost",
            "reg_id",
          ],
          include: [
            {
              model: db.OriginDestination, // ✅ Join with OriginDestination
              as: "originDestination", // give alias
              attributes: ["id", "location"], // fetch readable name
            },
          ],
        },
      ],
    });

    await AuthService.checkLoginPassword(
      req,
      ACCOUNT_TYPES.POLICE,
      loginDTO.email,
      user,
      loginDTO.password,
    );

    // ✅ Update last login
    user.lastLoginAt = new Date();

    const { accessToken, refreshToken } = await issueTokens(
      ACCOUNT_TYPES.POLICE,
      user,
      AuthService.accessClaims(ACCOUNT_TYPES.POLICE, user),
      { newSession: true, nonce: loginNonce },
    );

    return new PoliceLoginResponseDTO(user, accessToken, refreshToken);
  }

  static async loginAdmin(loginData, req) {
    await consumeCaptcha(req, loginData?.captcha);
    const loginNonce = AuthService.requireLoginNonce(loginData);

    const loginDTO = new AdminLoginRequestDTO(loginData);
    const validation = loginDTO.validate();

    //console.log("🔹 DTO validation:", validation);

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    //console.log("🔍 Searching admin with userid:", loginDTO.userid);

    // Find admin
    const admin = await db.Admin.findOne({
      where: {
        userid: loginDTO.userid,
        isActive: 1,
      },
    });

    //console.log("🔹 Admin found:", admin ? admin.userid : "NOT FOUND");

    const isAdmin =
      admin && (admin.role === "admin" || Number(admin.isadmin) === 1);

    await AuthService.checkLoginPassword(
      req,
      ACCOUNT_TYPES.ADMIN,
      loginDTO.userid,
      isAdmin ? admin : null,
      loginDTO.password,
    );

    admin.lastLoginAt = new Date();

    const { accessToken, refreshToken } = await issueTokens(
      ACCOUNT_TYPES.ADMIN,
      admin,
      AuthService.accessClaims(ACCOUNT_TYPES.ADMIN, admin),
      { newSession: true, nonce: loginNonce },
    );

    return {
      user: AuthService.sessionUser(ACCOUNT_TYPES.ADMIN, admin),
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  static async conveywise(payload) {
    const { fn, col, where, Op } = require("sequelize");

    // ✅ Extract date from payload or use today's date (YYYY-MM-DD)
    const inputDate =
      typeof payload === "object" && payload?.date
        ? payload.date
        : new Date().toISOString().split("T")[0];


    // ✅ Fetch all approved trips for that date from ApproveTrip
    const approveTrips = await db.ApproveTrip.findAll({
      where: {
        [Op.and]: [
          where(fn("DATE", col("arrdate")), inputDate),
          { astatus: { [Op.ne]: 0 } }, // ✅ not equal to 0
        ],
      },
      attributes: ["convey_id", "tId"], // we only need convey + trip id
    });

    // ✅ Group by convey_id and count ALL trips
    const convoyCounts = {};

    for (const record of approveTrips) {
      const { convey_id } = record;

      if (!convey_id) continue;

      if (!convoyCounts[convey_id]) {
        convoyCounts[convey_id] = 0;
      }

      convoyCounts[convey_id] += 1; // ✅ Count each approved trip
    }

    // ✅ Return identical response structure
    return {
      message: `Vehicle count by convoy time for ${inputDate}`,
      vehicleCountByConvoyTime: convoyCounts,
    };
  }

  // Activate a citizen account with its registration OTP. Every failure
  // gets the same message, so the endpoint cannot be used to probe emails.
  static async verifyCitizenOtp(data, req) {
    const dto = new ResendOtpDTO(data);
    const otp = String(data?.otp || "").trim();

    const user = dto.validate().isValid
      ? await db.User.findOne({
          where: { email: dto.email },
          attributes: ["id", "isActive", "isFrozen"],
        })
      : null;

    const valid = Boolean(
      user &&
        !user.isActive &&
        !user.isFrozen &&
        (await verifyOtp(
          ACCOUNT_TYPES.USER,
          user.id,
          OTP_PURPOSES.REGISTER,
          otp,
        )),
    );

    await audit(req, {
      actorType: ACCOUNT_TYPES.USER,
      actorId: user?.id,
      actorName: dto.email,
      action: AUDIT_ACTIONS.OTP_VERIFY,
      status: valid ? "success" : "failure",
    });

    if (!valid) {
      throw httpError(
        "Invalid or expired OTP. Please try again or request a new OTP.",
      );
    }

    await db.Registration.update(
      { status: 1 },
      { where: { userId: user.id } },
    );
    await user.update({ isActive: 1 });

    return { success: true, message: "OTP verified and user activated" };
  }

  // Send a new registration OTP. The reply is the same whether or not a
  // pending registration exists for the email.
  static async resendRegistrationOtp(data, req) {
    const dto = new ResendOtpDTO(data);
    const validation = dto.validate();
    if (!validation.isValid) {
      throw httpError(validation.errors.join(", "));
    }

    const user = await db.User.findOne({
      where: { email: dto.email, isActive: 0, isFrozen: 0 },
      attributes: ["id", "email"],
      include: [
        { model: Registration, as: "registration", attributes: ["ownContact"] },
      ],
    });

    let status = "failure";
    let details = "No pending registration";

    if (user) {
      try {
        const code = await createOtp(
          ACCOUNT_TYPES.USER,
          user.id,
          OTP_PURPOSES.REGISTER,
        );
        await deliverOtp(
          { mobile: user.registration?.ownContact, email: user.email },
          code,
          OTP_PURPOSES.REGISTER,
        );
        status = "success";
        details = null;
      } catch (error) {
        if (!error.expose) throw error;
        details = error.message;
      }
    }

    await audit(req, {
      actorType: ACCOUNT_TYPES.USER,
      actorId: user?.id,
      actorName: dto.email,
      action: AUDIT_ACTIONS.OTP_RESEND,
      status,
      details,
    });

    return {
      message:
        "If a registration is pending for this email, a new OTP has been sent.",
    };
  }

  // Active citizen or police account that may reset its password.
  static async findResetAccount(type, email) {
    if (type === ACCOUNT_TYPES.USER) {
      return User.findOne({
        where: { email, isActive: 1, isFrozen: 0 },
        include: [
          { model: Registration, as: "registration", attributes: ["ownContact"] },
        ],
      });
    }

    return db.PoliceUser.findOne({
      where: { email, isActive: 1, status: 1 },
      include: [
        {
          model: db.PoliceRegistration,
          as: "registration",
          attributes: ["contact"],
        },
      ],
    });
  }

  // Forgot password, step 1: send a reset OTP. The reply never says
  // whether the account exists.
  static async requestPasswordReset(data, req) {
    await consumeCaptcha(req, data?.captcha);

    const dto = new ForgotPasswordRequestDTO(data);
    const validation = dto.validate();
    if (!validation.isValid) {
      throw httpError(validation.errors.join(", "));
    }

    const account = await AuthService.findResetAccount(
      dto.accountType,
      dto.email,
    );

    let status = "failure";
    let details = "No active account";

    if (account) {
      try {
        const code = await createOtp(
          dto.accountType,
          account.id,
          OTP_PURPOSES.RESET,
        );
        const registration = account.registration;
        await deliverOtp(
          {
            mobile: registration?.ownContact || registration?.contact,
            email: account.email,
          },
          code,
          OTP_PURPOSES.RESET,
        );
        status = "success";
        details = null;
      } catch (error) {
        if (!error.expose) throw error;
        details = error.message;
      }
    }

    await audit(req, {
      actorType: dto.accountType,
      actorId: account?.id,
      actorName: dto.email,
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUEST,
      status,
      details,
    });

    return {
      message:
        "If an account exists for this email, an OTP has been sent to the registered mobile number and email.",
    };
  }

  // Forgot password, step 2: set a new password with the reset OTP.
  // Signs the account out everywhere and clears any login lockout.
  static async resetPassword(data, req) {
    const dto = new ResetPasswordDTO(data);
    const validation = dto.validate();
    if (!validation.isValid) {
      throw httpError(validation.errors.join(", "));
    }

    const account = await AuthService.findResetAccount(
      dto.accountType,
      dto.email,
    );

    const valid = Boolean(
      account &&
        (await verifyOtp(
          dto.accountType,
          account.id,
          OTP_PURPOSES.RESET,
          dto.otp,
        )),
    );

    await audit(req, {
      actorType: dto.accountType,
      actorId: account?.id,
      actorName: dto.email,
      action: AUDIT_ACTIONS.PASSWORD_RESET,
      status: valid ? "success" : "failure",
    });

    if (!valid) {
      throw httpError(
        "Invalid or expired OTP. Please try again or request a new OTP.",
      );
    }

    // The model hook hashes the password
    account.password = dto.newPassword;
    account.refreshToken = null;
    account.tokenVersion = (Number(account.tokenVersion) || 0) + 1;
    clearFailedLogins(account);
    await account.save();

    return { message: "Password reset successfully. Please login." };
  }

  // Signed-in account changes its own password (current password required).
  // All sessions, including this one, are signed out afterwards.
  static async changeOwnPassword(req, data) {
    const dto = new ChangePasswordDTO(data);
    const validation = dto.validate();
    if (!validation.isValid) {
      throw httpError(validation.errors.join(", "));
    }

    const models = {
      [ACCOUNT_TYPES.USER]: db.User,
      [ACCOUNT_TYPES.POLICE]: db.PoliceUser,
      [ACCOUNT_TYPES.ADMIN]: db.Admin,
    };
    const account = await models[req.accountType].findByPk(req.user.id);

    const entry = {
      actorType: req.accountType,
      actorId: req.user.id,
      actorName: req.user.email || req.user.userid,
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
    };

    if (!account || !(await account.validatePassword(dto.oldPassword))) {
      await audit(req, { ...entry, status: "failure", details: "Wrong current password" });
      throw httpError("Current password is incorrect");
    }

    // User and police models hash in a hook; the admin model has none
    account.password =
      req.accountType === ACCOUNT_TYPES.ADMIN
        ? await require("bcryptjs").hash(dto.newPassword, 10)
        : dto.newPassword;
    account.refreshToken = null;
    account.tokenVersion = (Number(account.tokenVersion) || 0) + 1;
    clearFailedLogins(account);
    await account.save();

    await audit(req, { ...entry, status: "success" });

    return { message: "Password changed successfully. Please login again." };
  }

  // ==================== Admin: citizen accounts ====================

  static async listCitizens(data) {
    const dto = new CitizenListDTO(data);
    const validation = dto.validate();
    if (!validation.isValid) {
      throw httpError(validation.errors.join(", "));
    }

    const now = Date.now();
    const userWhere = {
      active: { isActive: 1, isFrozen: 0 },
      pending: { isActive: 0, isFrozen: 0 },
      frozen: { isFrozen: 1 },
      locked: { lockedUntil: { [Op.gt]: now } },
      all: {},
    }[dto.status];

    const where = {};
    if (dto.search) {
      const like = `%${dto.search.replace(/[\\%_]/g, "\\$&")}%`;
      where[Op.or] = [
        { reg_id: { [Op.like]: like } },
        { firstName: { [Op.like]: like } },
        { lastName: { [Op.like]: like } },
        { orgName: { [Op.like]: like } },
        { ownContact: { [Op.like]: like } },
        { "$user.email$": { [Op.like]: like } },
      ];
    }

    const { rows, count } = await Registration.findAndCountAll({
      where,
      attributes: ["reg_id", "title", "firstName", "lastName", "orgName", "ownContact"],
      include: [
        {
          model: User,
          as: "user",
          where: userWhere,
          required: true,
          attributes: ["id", "email", "isActive", "isFrozen", "lockedUntil", "lastLoginAt", "createdAt"],
        },
      ],
      order: [[{ model: User, as: "user" }, "createdAt", "DESC"]],
      limit: dto.limit,
      offset: (dto.page - 1) * dto.limit,
      subQuery: false,
      distinct: true,
    });

    return {
      total: count,
      page: dto.page,
      limit: dto.limit,
      rows: rows.map((r) => {
        const u = r.user;
        const locked = (Number(u.lockedUntil) || 0) > now;
        return {
          userId: u.id,
          reg_id: r.reg_id,
          name: [r.title, r.firstName, r.lastName].filter(Boolean).join(" "),
          orgName: r.orgName,
          mobile: r.ownContact,
          email: u.email,
          registeredAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          locked,
          status: u.isFrozen
            ? "frozen"
            : !u.isActive
              ? "pending"
              : locked
                ? "locked"
                : "active",
        };
      }),
    };
  }

  // Freeze (true) or unfreeze (false) a citizen. Freezing signs them out.
  static async setCitizenFrozen(data, frozen) {
    const dto = new AccountRefDTO({ accountType: "user", id: data?.userId });
    const validation = dto.validate();
    if (!validation.isValid) {
      throw httpError(validation.errors.join(", "));
    }

    const user = await User.findByPk(dto.id);
    if (!user) throw httpError("Citizen not found", 404);

    user.isFrozen = frozen;
    if (frozen) {
      user.refreshToken = null;
      user.tokenVersion = (Number(user.tokenVersion) || 0) + 1;
    }
    await user.save();

    return {
      userId: user.id,
      message: frozen
        ? "Citizen account frozen successfully"
        : "Citizen account unfrozen successfully",
    };
  }

  // Clear the login lockout of a citizen or police account.
  static async unlockAccount(data) {
    const dto = new AccountRefDTO(data);
    const validation = dto.validate();
    if (!validation.isValid) {
      throw httpError(validation.errors.join(", "));
    }

    const model =
      dto.accountType === ACCOUNT_TYPES.USER ? db.User : db.PoliceUser;
    const account = await model.findByPk(dto.id);
    if (!account) throw httpError("Account not found", 404);

    clearFailedLogins(account);
    await account.save({ hooks: false });

    return { id: account.id, message: "Account unlocked successfully" };
  }

  // ==================== Admin: audit log ====================

  static async getAuditLogs(data) {
    const dto = new AuditLogListDTO(data);
    const validation = dto.validate();
    if (!validation.isValid) {
      throw httpError(validation.errors.join(", "));
    }

    const where = {};
    if (dto.action) where.action = dto.action;
    if (dto.actorType) where.actorType = dto.actorType;
    if (dto.status) where.status = dto.status;
    if (dto.from || dto.to) {
      where.createdAt = {
        ...(dto.from ? { [Op.gte]: `${dto.from} 00:00:00` } : {}),
        ...(dto.to ? { [Op.lte]: `${dto.to} 23:59:59` } : {}),
      };
    }
    if (dto.search) {
      const like = `%${dto.search.replace(/[\\%_]/g, "\\$&")}%`;
      where[Op.or] = [
        { actorName: { [Op.like]: like } },
        { actorId: { [Op.like]: like } },
        { targetId: { [Op.like]: like } },
        { ip: { [Op.like]: like } },
      ];
    }

    const { rows, count } = await db.AuditLog.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit: dto.limit,
      offset: (dto.page - 1) * dto.limit,
    });

    return {
      total: count,
      page: dto.page,
      limit: dto.limit,
      actions: Object.values(AUDIT_ACTIONS),
      rows,
    };
  }

  static async getConveyDetails(checkpostid) {
    try {

      let whereCondition = {};

      // ✅ ONLY when checkpostid is provided
      if (
        checkpostid !== undefined &&
        checkpostid !== null &&
        checkpostid !== ""
      ) {
        // Step 1: Get loc_id from OriginDestination
        const originDest = await db.OriginDestination.findOne({
          attributes: ["loc_id"],
          where: {
            id: checkpostid,
          },
        });

        if (!originDest) {
          throw new Error("No matching OriginDestination found");
        }

        // Add loc_id filter
        whereCondition.loc_id = originDest.loc_id;
      }

      // Step 2: Fetch convey details
      const conveyDetails = await db.TConvey.findAll({
        where: whereCondition, // empty object = fetch all
      });

      if (!conveyDetails || conveyDetails.length === 0) {
        throw new Error("No convey details found");
      }

      return {
        success: true,
        message: "Convey details fetched successfully",
        data: conveyDetails,
      };
    } catch (error) {
      console.error("Error fetching convey details:", error.message);
      throw error;
    }
  }

  static async getAllTodayConveyReports(param) {
    try {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];

      const { Op, fn, col, where } = db.Sequelize;

      // ✅ Origin condition ONLY for request count
      const requestOriginCondition =
        Number(param.locationid) === 1
          ? { origin: 1 }
          : { origin: { [Op.ne]: 1 } };

      // 1️⃣ Request trips (custom origin condition)
      const requestTrips = await db.Trip.findAll({
        where: {
          [Op.and]: [
            where(fn("DATE", col("Trip.date")), formattedDate),
            requestOriginCondition,
          ],
        },
        attributes: [
          [col("Trip.convoyTime"), "convoyTime"],
          [fn("COUNT", col("Trip.tId")), "tripCount"],
        ],
        group: ["Trip.convoyTime"],
        order: [[col("Trip.convoyTime"), "ASC"]],
        raw: true,
      });

      // 2️⃣ Approved trips (NORMAL condition)
      const approvedTrips = await db.Trip.findAll({
        where: {
          [Op.and]: [
            where(fn("DATE", col("Trip.date")), formattedDate),
            { origin: param.locationid },
            { status: 2 },
          ],
        },
        attributes: [
          [col("Trip.convoyTime"), "convoyTime"],
          [fn("COUNT", col("Trip.tId")), "tripCount"],
        ],
        group: ["Trip.convoyTime"],
        order: [[col("Trip.convoyTime"), "ASC"]],
        raw: true,
      });

      // 3️⃣ Merge results
      const convoyMap = {};

      requestTrips.forEach((trip) => {
        convoyMap[trip.convoyTime] = {
          convoyTime: trip.convoyTime,
          requestCount: trip.tripCount,
          approvedCount: 0,
        };
      });

      approvedTrips.forEach((trip) => {
        if (convoyMap[trip.convoyTime]) {
          convoyMap[trip.convoyTime].approvedCount = trip.tripCount;
        } else {
          convoyMap[trip.convoyTime] = {
            convoyTime: trip.convoyTime,
            requestCount: 0,
            approvedCount: trip.tripCount,
          };
        }
      });

      return {
        message: "Trip details grouped successfully for today's date",
        dateUsed: formattedDate,
        convoyReports: Object.values(convoyMap),
      };
    } catch (error) {
      console.error("❌ Error fetching today's convoy report:", error);
      throw new Error("Failed to fetch convoy reports");
    }
  }

  static async getAllDetailsByTripId(tripData) {

    const trips = await db.Trip.findOne({
      where: {
        tId: tripData,
      },
      include: [
        {
          model: db.Passenger,
          as: "passengers",
          attributes: [
            "passengerName",
            "docType",
            "docId",
            "phoneNo",
            "gender",
          ],
        },
        {
          model: db.Driver,
          as: "driver",
          attributes: ["dFirstName", "dLastName", "licenseNo"],
          include: [
            {
              model: db.DriverStatus,
              as: "sts",
              attributes: ["phNo", "Status"],
            },
          ],
        },
        {
          model: db.Vehicle,
          as: "vehicle",
          attributes: ["vId", "vNum", "vCat", "ownershipType"],
          include: [
            {
              model: db.VehicleStatus,
              as: "sts", // ✅ matches Vehicle model alias
              attributes: [
                "vId",
                "reg_id",
                "status",
                "start_date",
                "end_date",
                "reg_id",
              ],
              where: {
                reg_id: db.Sequelize.col("Trip.reg_id"), // ✅ filter by Trip.reg_id
              },
              required: false,
            },
          ],
        },
        {
          model: db.OriginDestination,
          as: "originLocation",
          attributes: ["id", "location"],
        },
        {
          model: db.OriginDestination,
          as: "destinationLocation",
          attributes: ["id", "location"],
        },
      ],
      attributes: [
        "reg_id",
        "dId",
        "tId",
        "origin",
        "destination",
        "date",
        "convoyTime",
        "status",
      ],
    });

    return {
      message: "Trip details loaded successfully",
      trips: trips,
    };
  }

  static async addConveyControl(convoyData) {
    try {
      // 1. Validation
      if (!convoyData.checkpost_id || !convoyData.convey_id) {
        return {
          success: false,
          message: "checkpost_id and convey_id are required to add a convey.",
        };
      }

      // 2. Get today's date in YYYY-MM-DD
      const today = new Date().toISOString().split("T")[0];

      // 3. Check if already inserted today (any status)
      const existingConvoy = await db.ConveyControl.findOne({
        where: {
          checkpostid: convoyData.checkpost_id,
          conveyid: convoyData.convey_id,
          date: today,
        },
      });

      if (existingConvoy) {
        if (existingConvoy.status === 1) {
          return {
            success: false,
            message: "Convey already started today at this checkpost",
            data: existingConvoy,
          };
        } else if (existingConvoy.status === 0) {
          return {
            success: false,
            message: "Convey already started earlier today and is closed",
            data: existingConvoy,
          };
        }
      }

      // 4. Insert new convoy
      const now = new Date();
      const currentTime = now.toTimeString().split(" ")[0]; // "HH:mm:ss"

      const newConvoy = await db.ConveyControl.create({
        checkpostid: convoyData.checkpost_id,
        conveyid: convoyData.convey_id,
        date: today,
        starttime: currentTime,
        closetime: "00:00:00",
        status: 1,
      });


      return {
        success: true,
        message: "Convey started successfully",
        data: newConvoy,
      };
    } catch (error) {
      // uq_convey_day: a parallel request started this convoy first
      if (error.name === "SequelizeUniqueConstraintError") {
        return {
          success: false,
          message: "Convey already started today at this checkpost",
        };
      }
      console.error("❌ Error starting convoy:", error);
      return { success: false, message: "Error starting convoy" };
    }
  }
  static async getCurrentRunningConvey(checkpost_id) {
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const runningConvey = await db.ConveyControl.findOne({
        where: {
          checkpostid: checkpost_id,
          status: 1, // running
          date: today,
        },
        include: [
          {
            model: db.TConvey,
            as: "tconvey",
            attributes: ["id", "convey_name", "convey_time"], // only needed fields
          },
        ],
      });

      if (!runningConvey) {
        return null;
      }

      return runningConvey;
    } catch (error) {
      console.error("Error fetching current running convey:", error);
      throw error;
    }
  }
  static async getStopConvey(checkpost_id, date) {
    try {

      const stopconvey = await db.ConveyControl.findAll({
        where: {
          checkpostid: checkpost_id,
          status: 0, // stopped
          date: date,
        },
        include: [
          {
            model: db.TConvey,
            as: "tconvey",
            attributes: ["id", "convey_name", "convey_time"], // only needed fields
          },
        ],
      });

      if (!stopconvey) {
        return null;
      }

      return stopconvey;
    } catch (error) {
      console.error("Error fetching current stopped convey:", error);
      throw error;
    }
  }

  static async stopConveyControl(convoyData) {
    try {
      // 1. Validation
      if (!convoyData?.checkpost_id || !convoyData?.convey_id) {
        return {
          success: false,
          message: "checkpost_id and convey_id are required to stop a convey.",
        };
      }

      // 2. Get today's date in YYYY-MM-DD
      const today = new Date().toISOString().split("T")[0];

      // 3. Find existing active convey today
      const existingConvoy = await db.ConveyControl.findOne({
        where: {
          checkpostid: convoyData.checkpost_id,
          conveyid: convoyData.convey_id,
          date: today,
          status: 1, // Active convey
        },
      });

      if (!existingConvoy) {
        return {
          success: false,
          message: "No active convey found to stop for today.",
        };
      }

      // 4. Update status and closetime
      const now = new Date();
      const currentTime = now.toTimeString().split(" ")[0]; // "HH:mm:ss"

      existingConvoy.status = 0;
      existingConvoy.closetime = currentTime;

      await existingConvoy.save();


      return {
        success: true,
        message: "Convey stopped successfully",
        data: existingConvoy,
      };
    } catch (error) {
      console.error("❌ Error stopping convey:", error);
      return {
        success: false,
        message: "Error stopping convey",
        error: error.message,
      };
    }
  }

  static async getCheckOutTrip(checkpostId) {
    try {
      // ================= DATE (IST) =================
      const kolkata = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const dateObj = new Date(kolkata);

      const today = `${dateObj.getFullYear()}-${String(
        dateObj.getMonth() + 1,
      ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

      // ================= FLIP CHECKPOST =================
      let targetCheckpostId = checkpostId;
      if (checkpostId == 1) targetCheckpostId = 2;
      else if (checkpostId == 2) targetCheckpostId = 1;

      // ================= FETCH LATEST CONVEY ENTRY =================
      const latestConvey = await db.ConveyControl.findOne({
        where: {
          checkpostid: targetCheckpostId,
          date: today,
        },
        include: [
          {
            model: db.TConvey,
            as: "tconvey",
            attributes: ["id", "convey_name", "convey_time"],
          },
        ],
        order: [["id", "DESC"]], // 🔥 latest entry only
      });

      // ❌ NO CONVEY ENTRY TODAY
      if (!latestConvey) {
        return {
          success: true,
          closed: false,
          message: `No convey activity found today for checkpost ${targetCheckpostId}`,
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      // ❌ LATEST CONVEY IS NOT CLOSED
      if (latestConvey.status !== 0) {
        return {
          success: true,
          closed: false,
          message: `Latest convey is not closed for checkpost ${targetCheckpostId}`,
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      // ✅ LATEST CONVEY IS CLOSED
      const closedConvey = latestConvey;

      // ================= FETCH APPROVED TRIPS =================
      const approvedTrips = await db.ApproveTrip.findAll({
        where: {
          checkpost_id: targetCheckpostId,
          astatus: 1,
          arrdate: today,
          convey_id: {
            [Op.lt]: 100,
          },
          //convey_id: closedConvey.conveyid, // ✅ ONLY CLOSED CONVEY
        },
        include: [
          {
            model: db.Trip,
            as: "trip",
            include: [
              {
                model: db.Driver,
                as: "driver",
                attributes: ["dFirstName", "dLastName"],
              },
              {
                model: db.Vehicle,
                as: "vehicle",
                attributes: ["vNum"],
              },
              {
                model: db.Passenger,
                as: "passengers",
                attributes: ["pId"],
                through: { attributes: [], where: { status: 1 } },
              },
              {
                model: db.OriginDestination,
                as: "originLocation",
                attributes: ["id", "location"],
              },
              {
                model: db.OriginDestination,
                as: "destinationLocation",
                attributes: ["id", "location"],
              },
            ],
          },
          {
            model: db.TConvey,
            as: "convey",
            attributes: ["id", "convey_name", "convey_time"],
          },
          {
            model: db.PoliceRegistration,
            as: "approverOfficer",
            attributes: ["title", "firstName", "lastName", "designation"],
          },
        ],
        order: [["id", "ASC"]],
      });

      // ❌ NO TRIPS FOR CLOSED CONVEY
      if (!approvedTrips || approvedTrips.length === 0) {
        return {
          success: true,
          closed: true,
          convey: {
            conveyid: closedConvey.conveyid,
            name: closedConvey.tconvey?.convey_name,
            time: closedConvey.tconvey?.convey_time,
            starttime: closedConvey.starttime,
            closetime: closedConvey.closetime,
          },
          message: "No approved trips found for closed convey",
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      // ================= FORMAT RESPONSE =================
      const formattedTrips = approvedTrips.map((trip) => {
        const officer = trip.approverOfficer;

        return {
          trip_id: trip.tId,
          origin_name: trip.trip?.originLocation?.location || null,
          destination_name: trip.trip?.destinationLocation?.location || null,
          vehicle_number: trip.trip?.vehicle?.vNum || null,
          date: trip.trip?.date || null,

          total_passengers: trip.trip?.passengers?.length || 0,

          driver_name: trip.trip?.driver
            ? `${trip.trip.driver.dFirstName} ${trip.trip.driver.dLastName}`
            : null,

          arr_time: trip.arrtime,
          checkpost_id: trip.checkpost_id,

          convey_name: trip.convey?.convey_name || null,
          convey_time: trip.convey?.convey_time || null,

          approved_by: officer
            ? `${officer.title ? officer.title + " " : ""}${
                officer.firstName
              } ${officer.lastName}`
            : null,

          approver_designation: officer?.designation || null,
        };
      });

      // ================= FINAL RESPONSE =================
      return {
        success: true,
        closed: true,
        convey: {
          conveyid: closedConvey.conveyid,
          name: closedConvey.tconvey?.convey_name,
          time: closedConvey.tconvey?.convey_time,
          starttime: closedConvey.starttime,
          closetime: closedConvey.closetime,
        },
        message: `Approved trips fetched for closed convey (checkpost ${targetCheckpostId})`,
        data: formattedTrips,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching checkout trips:", error);
      return {
        success: false,
        message: "Failed to fetch checkout trips",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  ///////specialconvoy checkout
  static async getspecialConvoyCheckOutTrip(checkpostId) {
    try {
      const { Op, fn, col, where } = require("sequelize");
      // ================= DATE (IST) =================
      const kolkata = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const dateObj = new Date(kolkata);

      const today = `${dateObj.getFullYear()}-${String(
        dateObj.getMonth() + 1,
      ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

      // ================= FLIP CHECKPOST =================
      let targetCheckpostId = checkpostId;
      if (checkpostId == 1) targetCheckpostId = 2;
      else if (checkpostId == 2) targetCheckpostId = 1;

      // ================= FETCH LATEST CONVEY ENTRY =================
      const latestConvey = await db.ConveyControl.findOne({
        where: {
          checkpostid: targetCheckpostId,
          date: today,
        },
        include: [
          {
            model: db.TConvey,
            as: "tconvey",
            attributes: ["id", "convey_name", "convey_time"],
          },
        ],
        order: [["id", "DESC"]], // 🔥 latest entry only
      });

      // ❌ NO CONVEY ENTRY TODAY
      if (!latestConvey) {
        return {
          success: true,
          closed: false,
          message: `No convey activity found today for checkpost ${targetCheckpostId}`,
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      // ❌ LATEST CONVEY IS NOT CLOSED
      if (latestConvey.status !== 0) {
        return {
          success: true,
          closed: false,
          message: `Latest convey is not closed for checkpost ${targetCheckpostId}`,
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      // ✅ LATEST CONVEY IS CLOSED
      const closedConvey = latestConvey;

      // ================= FETCH APPROVED TRIPS =================
      const approvedTrips = await db.ApproveTrip.findAll({
        where: {
          checkpost_id: targetCheckpostId,
          astatus: 1,

          convey_id: {
            [Op.gte]: 99,
          },
          //convey_id: closedConvey.conveyid, // ✅ ONLY CLOSED CONVEY
        },
        include: [
          {
            model: db.Trip,
            as: "trip",
            include: [
              {
                model: db.Driver,
                as: "driver",
                attributes: ["dFirstName", "dLastName"],
              },
              {
                model: db.Vehicle,
                as: "vehicle",
                attributes: ["vNum"],
              },
              {
                model: db.Passenger,
                as: "passengers",
                attributes: ["pId"],
                through: { attributes: [], where: { status: 1 } },
              },
              {
                model: db.OriginDestination,
                as: "originLocation",
                attributes: ["id", "location"],
              },
              {
                model: db.OriginDestination,
                as: "destinationLocation",
                attributes: ["id", "location"],
              },
            ],
          },
          {
            model: db.TConvey,
            as: "convey",
            attributes: ["id", "convey_name", "convey_time"],
          },
          {
            model: db.PoliceRegistration,
            as: "approverOfficer",
            attributes: ["title", "firstName", "lastName", "designation"],
          },
        ],
        order: [["id", "ASC"]],
      });

      // ❌ NO TRIPS FOR CLOSED CONVEY
      if (!approvedTrips || approvedTrips.length === 0) {
        return {
          success: true,
          closed: true,
          convey: {
            conveyid: closedConvey.conveyid,
            name: closedConvey.tconvey?.convey_name,
            time: closedConvey.tconvey?.convey_time,
            starttime: closedConvey.starttime,
            closetime: closedConvey.closetime,
          },
          message: "No approved trips found for closed convey",
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      // preload convoy master
      const emergencyConvoy = await db.TConvey.findOne({
        where: { id: 100 },
        attributes: ["id", "convey_name", "convey_time"],
      });

      const vipConvoy = await db.TConvey.findOne({
        where: { id: 200 },
        attributes: ["id", "convey_name", "convey_time"],
      });
      // ================= FORMAT RESPONSE =================
      const formattedTrips = await Promise.all(
        approvedTrips.map(async (trip) => {
          const convoyVal = Number(trip.convey_id);

          // ✅ ALWAYS keep real id
          let convey = {
            id: convoyVal, // 🔥 REAL convoy id (102, 203...)
            convey_name:
              convoyVal >= 200
                ? "Special Convoy (VIP)"
                : convoyVal >= 100
                  ? "Special Convoy (Emergency)"
                  : trip.convey?.convey_name || null,

            convey_time: trip.convey?.convey_time || null,
          };

          // ✅ NOW await WORKS
          if (convoyVal >= 100) {
            const conveyControl = await db.ConveyControl.findOne({
              where: {
                conveyid: convoyVal,
                checkpostid: Number(trip.checkpost_id),
              },
              attributes: ["starttime"],
            });

            if (conveyControl) {
              convey.actual_start_time = conveyControl.starttime;
            }
          }

          return {
            trip_id: trip.trip?.tId,
            origin_name: trip.trip?.originLocation?.location || null,
            destination_name: trip.trip?.destinationLocation?.location || null,
            vehicle_number: trip.trip?.vehicle?.vNum || null,
            driver_name: trip.trip?.driver
              ? `${trip.trip.driver.dFirstName} ${trip.trip.driver.dLastName}`
              : null,
            date: trip.trip?.date || null,
            arr_time: trip.arrtime || null,
            total_passengers: trip.trip?.passengers?.length || 0,
            approved_by: trip.approverOfficer
              ? `${trip.approverOfficer.firstName} ${trip.approverOfficer.lastName}`
              : null,

            // ✅ FINAL OBJECT
            convey,
          };
        }),
      );

      // ================= FINAL RESPONSE =================
      return {
        success: true,
        closed: true,
        convey: {
          conveyid: closedConvey.conveyid,
          name: closedConvey.tconvey?.convey_name,
          time: closedConvey.tconvey?.convey_time,
          starttime: closedConvey.starttime,
          closetime: closedConvey.closetime,
        },
        message: `Approved trips fetched for closed convey (checkpost ${targetCheckpostId})`,
        data: formattedTrips,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching checkout trips:", error);
      return {
        success: false,
        message: "Failed to fetch checkout trips",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async updateCheckOutTrip(data) {
    try {
      // 1. Validation

      if (!data.tId || !data.checkpostId) {
        return {
          success: false,
          message: "tId and checkpostId are required to insert checkout trip.",
        };
      }

      // ✅ Use frontend value if present, else fallback
      const today = data.checkoutDate || new Date().toISOString().split("T")[0];

      const currentTime =
        data.checkoutTime || new Date().toTimeString().split(" ")[0];

      const existingCheckout = await db.CheckoutTrip.findOne({
        where: { tId: data.tId },
      });

      if (existingCheckout) {
        return {
          success: false,
          message: "Trip already checked out",
        };
      }
      //  3. Insert into checkout_trip
      const newCheckout = await db.CheckoutTrip.create({
        tId: data.tId,
        checkpostid: data.checkpostId,
        checkoutdate: today,
        checkouttime: currentTime,
        status: data.status, // default 0 if not provided
        remarks: data.remarks || null,
        conveyid: data.runningConveyId || null,
      });


      // 4. Update approve_trip -> set astatus = 3
      const [rowsUpdated] = await db.ApproveTrip.update(
        { astatus: 2 },
        {
          where: { tId: data.tId },
        },
      );

      if (rowsUpdated > 0) {
      } else {
        console.warn(`⚠️ No ApproveTrip found for tId=${data.tId}`);
      }

      return {
        success: true,
        message: "Checkout trip recorded and ApproveTrip updated successfully",
        data: {
          checkout: newCheckout,
          approveTripUpdated: rowsUpdated > 0,
        },
      };
    } catch (error) {
      console.error("❌ Error updating checkout trip:", error);

      // ✅ Backup duplicate protection
      if (
        error.name === "SequelizeUniqueConstraintError" ||
        error.original?.code === "ER_DUP_ENTRY"
      ) {
        return {
          success: false,
          message: "Trip already checked out",
        };
      }

      return {
        success: false,
        message: "Error updating checkout trip",
        error: error.message,
      };
    }
  }

  static async getProfileByUserId(userId) {
    try {
      const record = await db.Registration.findOne({
        where: { userId, status: 1 },

        include: [
          {
            model: db.Village,
            as: "village",
            attributes: ["village_code", "village_name"],
          },
          {
            model: db.Subdistrict,
            as: "subdistrict",
            attributes: ["subdistrict_code", "subdistrict_name"],
          },
          {
            model: db.District,
            as: "district",
            attributes: ["district_code", "district_name"],
          },
        ],
      });

      if (!record) {
        return {
          success: true,
          message: "No profile found for this user",
          data: null,
        };
      }

      return {
        success: true,
        message: "Profile loaded successfully",
        data: {
          title: record.title,
          firstName: record.firstName,
          lastName: record.lastName,
          orgName: record.orgName,
          docId: record.docId,
          docIdtype: record.docIdtype,
          ownContact: record.ownContact,
          ownAddress: record.ownAddress,
          isOrg: record.isOrg,
          status: record.status,
          // Relations

          village: record.village ? record.village.village_name : null,
          subdistrict: record.subdistrict
            ? record.subdistrict.subdistrict_name
            : null,
          district: record.district ? record.district.district_name : null,
        },
      };
    } catch (error) {
      console.error("Error in getProfileByUserId service:", error);
      return {
        success: false,
        message: "Failed to fetch profile",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  // AuthService.js (or PoliceService.js)
  static async getPoliceProfileByUserId(userId) {
    try {

      const record = await db.PoliceRegistration.findOne({
        where: { userId, status: 1 },
        include: [
          {
            model: db.OriginDestination,
            as: "originDestination", // ✅ must match association alias
            attributes: ["id", "location"], // ✅ fetch only required fields
          },
        ],
      });

      if (!record) {
        return {
          success: true,
          message: "No police profile found for this user",
          data: null,
        };
      }

      return {
        success: true,
        message: "Police profile loaded successfully",
        data: {
          reg_id: record.reg_id,
          userId: record.userId,
          title: record.title,
          firstName: record.firstName,
          lastName: record.lastName,
          designation: record.designation,
          emp_id: record.emp_id,
          contact: record.contact,
          status: record.status,

          // ✅ return both raw ID and location name
          checkpostId: record.checkpost,
          checkpostName: record.originDestination
            ? record.originDestination.location
            : null,
        },
      };
    } catch (error) {
      console.error("Error in getPoliceProfileByUserId service:", error);
      return {
        success: false,
        message: "Failed to fetch police profile",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async editTripDetailsByTripId(tripId) {
    try {

      const trip = await db.Trip.findOne({
        where: { tId: tripId },
        include: [
          {
            model: db.Passenger,
            as: "passengers",
            through: {
              attributes: [],
              where: { status: 1 }, // ✅ only active passengers
            },
            attributes: [
              "pId",
              "passengerName",
              "fatherName",
              "phoneNo",
              "age",
              "gender",
              "isForeigner",
              "docType",
              "docId",
              "nationality",
              "visaNumber",
              "residence",
              "lastStayInAndaman",
              "isIslander",
            ],
          },
        ],
      });

      if (!trip) {
        return {
          success: true,
          message: "No trip found for this tripId",
          timestamp: new Date().toISOString(),
          selecteddata: {
            success: true,
            message: "No trip found for this tripId",
            data: null,
          },
          availabledata: {},
        };
      }

      /* ============================
       CLEAN TRIP DATA (FOR EDIT PAGE)
    ============================ */
      const cleanData = {
        tId: trip.tId,
        reg_id: trip.reg_id,
        vId: trip.vId,
        dId: trip.dId,
        origin: trip.origin,
        destination: trip.destination,
        date: trip.date,
        conveytime: trip.convoyTime,
        remarks: trip.remarks,
        status: trip.status,
        isTourist: trip.isTourist,
        entrydatetime: trip.entrydatetime,
        updatedate: trip.updatedate,
        loc_id: trip.loc_id || null, // ✅ ADD THIS

        passengers: trip.passengers.map((p) => ({
          pId: p.pId,
          passengerName: p.passengerName,
          fatherName: p.fatherName || "",
          phoneNo: p.phoneNo,
          age: p.age,
          gender: p.gender,
          isForeigner: p.isForeigner,
          docType: p.docType,
          docId: p.docId,
          passportNo: p.docType === "PASSPORT" ? p.docId : "",
          nationality: p.nationality || "",
          visaNumber: p.visaNumber || "",
          residence: p.residence || "",
          lastStayInAndaman: p.lastStayInAndaman || "",
          isIslander: p.isIslander || 0,
        })),
      };


      const reg_id = trip.reg_id;

      /* ============================
       DRIVERS
    ============================ */
      const drivers = await db.Driver.findAll({
        include: [
          {
            model: db.DriverStatus,
            as: "sts",
            attributes: ["reg_id", "phNo"],
            where: { reg_id },
          },
        ],
        attributes: ["dId", "dFirstName", "dLastName", "licenseNo", "title"],
      });

      /* ============================
       VEHICLES
    ============================ */
      const vehicles = await db.Vehicle.findAll({
        include: [
          {
            model: db.VehicleStatus,
            as: "sts",
            attributes: ["reg_id"],
            where: { reg_id },
          },
        ],
        attributes: [
          "vId",
          "vNum",
          "vOwnName",
          "vCat",
          "otherCat",
          "ownershipType",
          "deptName",
          "vPurpose",
          "otherPurpose",
          "vSeating", // ✅ needed for EditTrip UI
        ],
        order: [["vId", "DESC"]],
      });

      return {
        success: true,
        message: "Trip details fetched successfully",
        timestamp: new Date().toISOString(),
        selecteddata: {
          success: true,
          message: "Trip details loaded successfully",
          data: cleanData,
        },
        availabledata: {
          drivers: {
            message: "Driver List Loaded successfully",
            driver: drivers,
          },
          vehicles: {
            message: "Vehicle List Loaded successfully",
            vehicle: vehicles,
          },
        },
      };
    } catch (error) {
      console.error("Error in editTripDetailsByTripId service:", error);
      return {
        success: false,
        message: "Failed to fetch trip details",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }


static async updateTripPolice(tripDataArray) {
  let transaction;

  try {
    // 1. Detect HTML tags, event handlers, and control characters.
    const hasUnsafeContent = (value) => {
      if (typeof value !== "string") return false;

      return (
        /<\s*\/?\s*[a-z][^>]*>/i.test(value) ||
        /<\s*![\s\S]*?>/.test(value) ||
        /<\s*\?[\s\S]*?\?>/.test(value) ||
        /\bon[a-z]+\s*=/i.test(value) ||
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)
      );
    };

    // 2. Recursively inspect all strings in nested objects and arrays.
    const findUnsafePath = (value, path = "payload") => {
      if (typeof value === "string") {
        return hasUnsafeContent(value) ? path : null;
      }

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const result = findUnsafePath(
            value[i],
            `${path}[${i}]`
          );

          if (result) return result;
        }
      } else if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) {
          const result = findUnsafePath(
            child,
            `${path}.${key}`
          );

          if (result) return result;
        }
      }

      return null;
    };

    // 3. Validate the request structure.
    if (
      !Array.isArray(tripDataArray) ||
      tripDataArray.length === 0
    ) {
      return {
        success: false,
        message: "Invalid format",
        errors: ["Invalid or empty request payload"],
      };
    }

    const allowedActions = [
      "updateTrip",
      "updatePassenger",
      "addPassenger",
      "deletePassenger",
    ];

    // Validate EVERY item before making database changes.
    for (let index = 0; index < tripDataArray.length; index++) {
      const item = tripDataArray[index];
      const payload = item?.payload;

      if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
      ) {
        return {
          success: false,
          message: "Invalid format",
          errors: [`Item ${index + 1}: Invalid payload`],
        };
      }

      // Reject unsafe content anywhere inside the payload.
      const unsafePath = findUnsafePath(payload);

      if (unsafePath) {
        return {
          success: false,
          message: "Invalid format",
          errors: [
            `Item ${index + 1}: HTML tags or unsafe content are not allowed`,
          ],
        };
      }

      const { action, tId, pId, data } = payload;

      if (!allowedActions.includes(action)) {
        return {
          success: false,
          message: "Invalid format",
          errors: [
            `Item ${index + 1}: Unsupported action`,
          ],
        };
      }

      // Every action requires a trip ID.
      if (
        tId === undefined ||
        tId === null ||
        String(tId).trim() === ""
      ) {
        return {
          success: false,
          message: "Invalid format",
          errors: [
            `Item ${index + 1}: Missing trip ID`,
          ],
        };
      }

      // Passenger update/delete actions require a passenger ID.
      if (
        ["updatePassenger", "deletePassenger"].includes(action) &&
        (
          pId === undefined ||
          pId === null ||
          String(pId).trim() === ""
        )
      ) {
        return {
          success: false,
          message: "Invalid format",
          errors: [
            `Item ${index + 1}: Missing passenger ID`,
          ],
        };
      }

      // Trip and passenger create/update actions require data.
      if (action !== "deletePassenger") {
        if (
          !data ||
          typeof data !== "object" ||
          Array.isArray(data)
        ) {
          return {
            success: false,
            message: "Invalid format",
            errors: [
              `Item ${index + 1}: Invalid action data`,
            ],
          };
        }
      }
    }

    // 4. Normalize passenger fields from frontend payloads.
    const normalizePassengerData = (data = {}) => ({
      passengerName:
        data.name ||
        data.passengerName ||
        data.PassengerName ||
        null,

      fatherName:
        data.fatherName ||
        data.FatherName ||
        null,

      phoneNo:
        data.phone ||
        data.phoneNo ||
        data.PhoneNo ||
        null,

      age: data.age ?? data.Age ?? null,

      gender:
        data.gender ||
        data.Gender ||
        null,

      isForeigner:
        data.isForeigner === 1 ||
        data.isForeigner === "1"
          ? 1
          : 0,

      docType:
        data.docType ||
        data.documentType ||
        data.DocumentType ||
        null,

      docId:
        data.docId ||
        data.documentId ||
        data.DocumentId ||
        null,

      nationality:
        data.nationality ||
        data.Nationality ||
        null,

      visaNumber:
        data.visaNumber ||
        data.VisaNo ||
        null,

      residence:
        data.residence ||
        data.Residence ||
        null,

      lastStayInAndaman:
        data.lastStayInAndaman ||
        data.LastStayInAndaman ||
        null,

      isIslander:
        data.isIslander === 1 ||
        data.isIslander === "1" ||
        data.IsIslander === 1 ||
        data.IsIslander === "1"
          ? 1
          : 0,
    });

    // 5. Start a transaction using the Trip model's Sequelize instance.
    transaction = await Trip.sequelize.transaction();

    // 6. Execute all database changes inside the transaction.
    for (const item of tripDataArray) {
      const { action, tId, pId, data } = item.payload;

      if (action === "updateTrip") {
        await Trip.update(
          {
            vId: data.vId,
            dId: data.dId,
            origin: data.origin,
            destination: data.destination,
            date: data.date,
            convoyTime: data.convoyTime,
            remarks: data.remarks,
            isTourist: data.isTourist ?? undefined,
          },
          {
            where: { tId },
            transaction,
          }
        );
      } else if (action === "updatePassenger") {
        // Deactivate the existing passenger relation.
        const [disabledCount] = await tripRelation.update(
          { status: 0 },
          {
            where: {
              tId,
              pId,
              status: 1,
            },
            transaction,
          }
        );

        if (disabledCount === 0) {
          throw new Error(
            "Active passenger relation not found"
          );
        }

        const pdata = normalizePassengerData(data);

        // Create the replacement passenger.
        const newPassenger = await Passenger.create(
          {
            passengerName: pdata.passengerName,
            fatherName: pdata.fatherName,
            phoneNo: pdata.phoneNo,
            age: pdata.age,
            gender: pdata.gender,
            isForeigner: pdata.isForeigner,
            docType: pdata.docType,
            docId: pdata.docId,
            nationality: pdata.isForeigner
              ? pdata.nationality
              : null,
            visaNumber: pdata.isForeigner
              ? pdata.visaNumber
              : null,
            residence: pdata.residence,
            lastStayInAndaman: pdata.lastStayInAndaman,
            isIslander: pdata.isForeigner === 1
              ? 0
              : pdata.isIslander,
          },
          { transaction }
        );

        // Link the replacement passenger to the trip.
        await tripRelation.create(
          {
            tId,
            pId: newPassenger.pId,
            status: 1,
          },
          { transaction }
        );
      } else if (action === "addPassenger") {
        const pdata = normalizePassengerData(data);

        const newPassenger = await Passenger.create(
          {
            passengerName: pdata.passengerName,
            fatherName: pdata.fatherName,
            phoneNo: pdata.phoneNo,
            age: pdata.age,
            gender: pdata.gender,
            isForeigner: pdata.isForeigner,
            docType: pdata.docType,
            docId: pdata.docId,
            nationality: pdata.isForeigner
              ? pdata.nationality
              : null,
            visaNumber: pdata.isForeigner
              ? pdata.visaNumber
              : null,
            residence: pdata.residence,
            lastStayInAndaman: pdata.lastStayInAndaman,
            isIslander: pdata.isForeigner === 1
              ? 0
              : pdata.isIslander,
          },
          { transaction }
        );

        await tripRelation.create(
          {
            tId,
            pId: newPassenger.pId,
            status: 1,
          },
          { transaction }
        );
      } else if (action === "deletePassenger") {
        const [disabledCount] = await tripRelation.update(
          { status: 0 },
          {
            where: {
              tId,
              pId,
              status: 1,
            },
            transaction,
          }
        );

        if (disabledCount === 0) {
          throw new Error(
            "Active passenger relation not found"
          );
        }
      }
    }

    // 7. Commit only after every operation succeeds.
    await transaction.commit();
    transaction = null;

    return {
      success: true,
      message: "Trip and passenger details updated successfully",
    };
  } catch (error) {
    // 8. Roll back all changes if any operation fails.
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Transaction rollback failed:",
          rollbackError.message
        );
      }
    }

    console.error(
      "updateTripPolice failed:",
      error.message
    );

    return {
      success: false,
      message:
        error.message === "Active passenger relation not found"
          ? error.message
          : "Failed to update trip data",
      errors: [],
    };
  }
}



static async updateProfile(profileData) {
  try {
    // 1. Validate profile data
    const validation = UpdateProfileDTO.validate(profileData);

    if (!validation.isValid) {
      return {
        success: false,
        message: "Profile validation failed",
        errors: validation.errors,
      };
    }

    const {
      userid,
      title,
      firstName,
      lastName,
      ownContact,
      ownAddress,
    } = profileData;

    // 2. Normalize accepted plain-text values
    const normalize = (value) =>
      typeof value === "string"
        ? value.normalize("NFKC").trim()
        : value;

    const sanitizedTitle = normalize(title);
    const sanitizedFirstName = normalize(firstName);
    const sanitizedLastName = normalize(lastName);
    const sanitizedOwnContact = normalize(ownContact);
    const sanitizedOwnAddress = normalize(ownAddress);

    // 3. Find registration record
    const registration = await db.Registration.findOne({
      where: { userId: userid },
    });

    if (!registration) {
      return {
        success: false,
        message: "Profile not found for the given user ID",
      };
    }

    // 4. Update only validated fields
    await registration.update({
      title: sanitizedTitle || null,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      ownContact: sanitizedOwnContact,
      ownAddress: sanitizedOwnAddress,
    });

    // 5. Return success
    return {
      success: true,
      message: "Profile updated successfully",
      updatedData: registration.toSafeObject(),
    };
  } catch (error) {
    console.error("Error updating profile:", error.message);

    return {
      success: false,
      message: "Error updating profile",
    };
  }
}

  static async updatePoliceProfile(profileData) {
    try {

      const {
        title,
        firstName,
        lastName,
        designation,
        emp_id,
        checkpostId,
        contact,
        userid,
      } = profileData;
      if (!userid) {
        return { success: false, message: "User ID is required" };
      }

      const registration = await db.PoliceRegistration.findOne({
        where: { userId: userid },
      });

      if (!registration) {
        return { success: false, message: "Police profile not found" };
      }

      await registration.update({
        title,
        firstName,
        lastName,
        designation,
        emp_id,
        checkpost: checkpostId || null,
        contact,
      });

      // ✅ Include OriginDestination association
      const updatedProfile = await db.PoliceRegistration.findOne({
        where: { userId: userid },
        include: [
          {
            model: db.OriginDestination,
            as: "originDestination",
            attributes: ["id", "location"],
          },
        ],
      });

      return {
        success: true,
        message: "Police profile updated successfully ✅",
        updatedData: updatedProfile,
      };
    } catch (error) {
      console.error("Error updating police profile:", error);
      return {
        success: false,
        message: "Error updating police profile",
        error: error.message,
      };
    }
  }
  static async getApprovedCountByConvey(checkpostid) {
    try {
      // 🕒 Get current date in Kolkata timezone (YYYY-MM-DD)
      const today = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      // Convert "DD/MM/YYYY" to "YYYY-MM-DD"
      const [day, month, year] = today.split("/");
      const kolkataDate = `${year}-${month}-${day}`;


      const approvedCounts = await db.ApproveTrip.findAll({
        attributes: [
          "convey_id",
          [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "approvedCount"],
        ],
        where: {
          astatus: [1, 2],
          arrdate: kolkataDate, // ✅ use calculated Kolkata date
          checkpost_id: checkpostid,
        },
        group: ["convey_id"],
        raw: true,
      });


      const result = approvedCounts.map((item) => ({
        conveyId: item.convey_id,
        approvedCount: parseInt(item.approvedCount, 10),
      }));

      return result;
    } catch (error) {
      console.error("Full error in getApprovedCountByConvey:", error);
      throw error;
    }
  }

  static async getCurrentDateAndTime() {
    try {
      const now = new Date();

      // Kolkata timezone (Asia/Kolkata)
      const timeZone = "Asia/Kolkata";

      // Get date in YYYY-MM-DD format
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);

      // Get time in HH:MM:SS format
      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);

      // Full ISO-like timestamp in Kolkata time
      const options = {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      const locale = new Intl.DateTimeFormat("en-GB", options).format(now);


      return { date, time, timestamp: now.toISOString(), locale };
    } catch (error) {
      console.error("AuthService.getCurrentDateAndTime error:", error);
      throw new Error("Failed to get current date and time");
    }
  }

  // Soft-delete records owned by the account `userId`. Each returns false
  // when the record does not exist, is already deleted, or is not the caller's.
  static async deleteVehicle(vId, userId) {
    const reg_id = await AuthService.regIdOf(userId);
    if (!reg_id || !(await db.VehicleStatus.count({ where: { vId, reg_id } }))) {
      return false;
    }
    const [updated] = await db.Vehicle.update(
      { status: 0 },
      { where: { vId, status: 1 } },
    );
    return updated > 0;
  }

  static async deleteDriver(dId, userId) {
    const reg_id = await AuthService.regIdOf(userId);
    if (!reg_id || !(await db.DriverStatus.count({ where: { dId, reg_id } }))) {
      return false;
    }
    const [updated] = await db.Driver.update(
      { dStatus: "inactive" },
      { where: { dId, dStatus: "active" } },
    );
    return updated > 0;
  }

  static async getCheckOutReport(params) {
    try {
      const { Op } = require("sequelize");

      // ✅ Clean Request DTO
      params = CheckoutReportRequestDTO(params);

      // ✅ Pagination
      const usePagination =
        params.page !== undefined && params.limit !== undefined;

      const chunkSize = usePagination ? Number(params.limit) : null;

      const page = usePagination ? Number(params.page) : null;

      const offset = usePagination ? (page - 1) * chunkSize : null;

      // ✅ Main Filters
      const whereClause = {
        conveyid: {
          [Op.lte]: 99,
        },
      };

      // ✅ Checkpost Filter
      if (params.checkpostid !== undefined) {
        whereClause.checkpostid = params.checkpostid;
      }

      // ✅ Status Filter
      if (
        params.status !== undefined &&
        params.status !== null &&
        params.status !== ""
      ) {
        whereClause.status = Array.isArray(params.status)
          ? { [Op.in]: params.status }
          : params.status;
      }

      // ✅ Date Filter
      if (
        params.checkoutdate !== undefined &&
        params.checkoutdate !== null &&
        params.checkoutdate !== ""
      ) {
        whereClause.checkoutdate = params.checkoutdate;
      }

      // ✅ Trip ID Search
      if (params.searchTerm && params.searchTerm.trim() !== "") {
        whereClause.tId = {
          [Op.like]: `%${params.searchTerm.trim()}%`,
        };
      }

      // ✅ Vehicle Search
      if (params.vehicleSearch && params.vehicleSearch.trim() !== "") {
        whereClause["$trip.vehicle.vNum$"] = {
          [Op.like]: `%${params.vehicleSearch.trim()}%`,
        };
      }

      // ✅ Approve Filter
      const approveWhere = {};

      if (
        params.conveyId !== undefined &&
        params.conveyId !== null &&
        params.conveyId !== ""
      ) {
        approveWhere.convey_id = params.conveyId;
      }

      // ✅ Query
      const queryOptions = {
        where: whereClause,

        include: [
          {
            model: db.OriginDestination,
            as: "checkpostLocation",

            attributes: ["id", "location"],
          },

          {
            model: db.Trip,
            as: "trip",

            include: [
              {
                model: db.OriginDestination,
                as: "originLocation",

                attributes: ["id", "location"],
              },

              {
                model: db.OriginDestination,
                as: "destinationLocation",

                attributes: ["id", "location"],
              },

              {
                model: db.Vehicle,
                as: "vehicle",

                required: false,

                attributes: ["vId", "vNum", "vCat"],
              },

              {
                model: db.Driver,
                as: "driver",

                attributes: ["dId", "dFirstName", "dLastName"],
              },
            ],
          },

          {
            model: db.ApproveTrip,
            as: "approveTrip",

            required: Object.keys(approveWhere).length > 0,

            where:
              Object.keys(approveWhere).length > 0 ? approveWhere : undefined,

            include: [
              {
                model: db.TConvey,
                as: "convey",

                required: false,
              },
            ],
          },
        ],

        order: [["id", "DESC"]],
      };

      // ✅ Pagination
      if (usePagination) {
        queryOptions.limit = chunkSize;

        queryOptions.offset = offset;

        queryOptions.distinct = true;

        queryOptions.subQuery = false;
      }

      // ✅ Fetch Data
      const result = usePagination
        ? await db.CheckoutTrip.findAndCountAll(queryOptions)
        : await db.CheckoutTrip.findAll(queryOptions);

      const checkOutTrips = usePagination ? result.rows : result;

      const count = usePagination ? result.count : checkOutTrips.length;

      // ✅ Response DTO
      const formatted = checkOutTrips.map(CheckoutReportResponseDTO);

      return {
        message: "Checkout report loaded successfully",

        ...(usePagination && {
          totalRecords: count,
          currentPage: page,
          totalPages: Math.ceil(count / chunkSize),
          totalChunks: Math.ceil(count / chunkSize),
          chunkSize,
        }),

        data: formatted,
      };
    } catch (error) {
      console.error("Error loading checkout report:", error);

      throw new Error("Failed to load checkout report");
    }
  }

  // ✅ AuthService.getarrivalist (final corrected)
  static async getarrivalist(checkpost_id) {
    try {
      const oppositeCheckpostId =
        checkpost_id === 1 ? 2 : checkpost_id === 2 ? 1 : null;

      const test =
        oppositeCheckpostId === 1
          ? "Jirkatang"
          : oppositeCheckpostId === 2
            ? "Middle Strait"
            : null;
      const nowUtc = new Date();
      const kolkataOffset = 5.5 * 60; // IST offset in minutes
      const localTime = new Date(nowUtc.getTime() + kolkataOffset * 60 * 1000);
      const currentDate = `${localTime.getUTCFullYear()}-${String(
        localTime.getUTCMonth() + 1,
      ).padStart(2, "0")}-${String(localTime.getUTCDate()).padStart(2, "0")}`;
      //console.log("📅 Kolkata Current Date:", currentDate);

      // ✅ Step 1️⃣: Find currently running convoy (status = 1)
      const runningConvey = await db.ConveyControl.findOne({
        where: {
          checkpostid: oppositeCheckpostId,
          status: 1,
          [db.Sequelize.Op.and]: db.Sequelize.where(
            db.Sequelize.fn("DATE", db.Sequelize.col("date")),
            currentDate,
          ),
        },
        include: [
          {
            model: db.OriginDestination,
            as: "originDestination",
            attributes: ["id", "location"],
          },
          {
            model: db.TConvey,
            as: "tconvey", // ✅ use alias you define in ConveyControl model
            attributes: ["id", "convey_time", "convey_name"],
          },
        ],
      });

      if (!runningConvey) {
        // Format date as dd-mm-yyyy
        const dateforpolice = new Date(currentDate).toLocaleDateString(
          "en-GB",
          { day: "2-digit", month: "2-digit", year: "numeric" },
        );
        //console.log("policedate", dateforpolice);
        return {
          success: false,
          message: `No running convoy found for checkpost ${test} on ${dateforpolice}`,
          conveyDetails: null,
          approvedTrips: [],
        };
      }

      const conveyDetails = {
        convey_id: runningConvey.conveyid, // ✅ use conveyid
        checkpost_id: runningConvey.checkpostid,
        checkpost_name:
          runningConvey.originDestination?.location || "Unknown Checkpost",
        convey_name: runningConvey.tconvey?.convey_name || "Unknown Convey", // ✅ added
        start_time: runningConvey.starttime,
        close_time: runningConvey.closetime,
        date: runningConvey.date,
        status: runningConvey.status,
      };


      // ✅ Step 2️⃣: Fetch approved trips for this convey, checkpost & date
      // ✅ Step 2️⃣: Fetch approved trips for this convey, checkpost & date
      const approvedTrips = await db.ApproveTrip.findAll({
        where: {
          convey_id: runningConvey.conveyid,
          checkpost_id: oppositeCheckpostId,
          arrdate: currentDate,
          astatus: 1,
        },
        include: [
          {
            model: db.Trip,
            as: "trip",
            attributes: ["tId", "origin", "destination", "date"],
            include: [
              {
                model: db.OriginDestination,
                as: "originLocation", // ✅ Correct alias
                attributes: ["location"],
              },
              {
                model: db.OriginDestination,
                as: "destinationLocation", // ✅ Correct alias
                attributes: ["location"],
              },
            ],
          },
          {
            model: db.OriginDestination,
            as: "checkpost",
            attributes: ["id", "location"],
          },
        ],
      });

      const totalTrips = approvedTrips.length;


      // ✅ Step 3️⃣: Build final combined response
      const response = {
        success: true,
        conveyDetails,
        approvedTrips: approvedTrips.map((trip) => ({
          tId: trip.trip?.tId || null,
          origin: trip.trip?.originLocation?.location || "Unknown",
          destination: trip.trip?.destinationLocation?.location || "Unknown",
          trip_date: trip.trip?.date || null,
          arrdate: trip.arrdate,
          arrtime: trip.arrtime,
          remarks: trip.remarks,
          astatus: trip.astatus,
          checkpost_name: trip.checkpost?.location || "Unknown",
          totalvehicle: totalTrips,
        })),
      };

      return response;
    } catch (error) {
      console.error("❌ Error in getarrivalist service:", error);
      throw new Error("Failed to fetch arrival list");
    }
  }

  // Soft-delete a trip owned by the account `userId` (false if not found).
  static async deletetrip(tId, userId) {
    const reg_id = await AuthService.regIdOf(userId);
    if (!reg_id) return false;
    const [updated] = await db.Trip.update(
      { status: 0 },
      { where: { tId, reg_id, status: { [Op.ne]: 0 } } },
    );
    return updated > 0;
  }
  //-----------Trip Verification------------

  // `verifiedby` is the signed-in officer's reg_id, never the request body.
  static async tripVerify(data, verifiedby) {
    const buttonId = Number(data?.buttonId);
    const astatus = Number(data?.astatus);
    if (![1, 2, 3].includes(buttonId) || ![0, 1].includes(astatus)) {
      throw httpError("Invalid verification status");
    }

    const trip = await db.Trip.findOne({ where: { tId: data.tId } });
    if (!trip) {
      throw httpError("Trip not found", 404);
    }

    await db.sequelize.transaction(async (transaction) => {
      await trip.update({ verifiystatus: buttonId }, { transaction });
      // A MySQL trigger updates 'verifiedtime' when verifiystatus changes
      await db.VerifiedTrip.create(
        {
          tripId: data.tId,
          verifiedby,
          remarks: data.remarks || null,
          status: astatus,
        },
        { transaction },
      );
    });

    return {
      message: "Trip verification updated successfully",
      trip,
    };
  }

  static async getVerifiedTripDetails({ checkpostid, convey }) {
    try {
      // ✅ Build where condition dynamically
      const tripWhere = {};

      if (checkpostid) {
        tripWhere.origin = checkpostid;
      }

      if (convey) {
        tripWhere.convoyTime = convey; // only apply if selected
      }

      const trips = await db.Trip.findAll({
        where: tripWhere,
        include: [
          // ✅ Verified details
          {
            model: db.VerifiedTrip,
            as: "verifiedDetails",
            attributes: ["vdate", "vtime", "remarks", "status"],
            where: { status: 1 }, // verified only
            required: true,
            include: [
              {
                model: db.PoliceRegistration,
                as: "verifiedOfficer",
                attributes: [
                  "reg_id",
                  "title",
                  "firstName",
                  "lastName",
                  "designation",
                ],
              },
            ],
          },

          // ✅ Convey time from trip table
          {
            model: db.TConvey,
            as: "convey",
            attributes: ["id", "convey_time", "convey_name"],
          },

          {
            model: db.OriginDestination,
            as: "originLocation",
            attributes: ["location"],
          },
          {
            model: db.OriginDestination,
            as: "destinationLocation",
            attributes: ["location"],
          },
          {
            model: db.Driver,
            as: "driver",
            attributes: ["dFirstName", "dLastName", "licenseNo"],
          },
          {
            model: db.Vehicle,
            as: "vehicle",
            attributes: ["vNum"],
          },
        ],
        order: [["entrydatetime", "DESC"]],
      });

      return { trips };
    } catch (error) {
      console.error("❌ Failed to fetch verified trips:", error.message);
      throw error;
    }
  }

  static async todayConvoyTrips(payload) {
    const { fn, col, where, Op, Sequelize } = require("sequelize");

    /* =========================
     1️⃣ DATE HANDLING
     ========================= */

    /* =========================
1️⃣ DATE HANDLING
========================= */

    let fromDate = null;
    let toDate = null;

    /* ===== SINGLE DATE ===== */
    if (payload?.date) {
      if (typeof payload.date === "string") {
        fromDate = payload.date.split("T")[0];
        toDate = payload.date.split("T")[0];
      } else if (typeof payload.date === "object" && payload.date.date) {
        fromDate = payload.date.date;
        toDate = payload.date.date;
      }
    } else if (payload?.fromDate && payload?.toDate) {
      /* ===== DATE RANGE ===== */
      fromDate = payload.fromDate.split("T")[0];
      toDate = payload.toDate.split("T")[0];
    } else {
      /* ===== DEFAULT TODAY ===== */
      const today = new Date().toISOString().split("T")[0];

      fromDate = today;
      toDate = today;
    }

    /* =========================
     2️⃣ CHECKPOST ID (UNIFIED)
     ========================= */

    const checkpostId = payload?.checkpostId || payload?.checkpost_id || null;


    /* =========================
     3️⃣ CONVEY CONTROL (START / END TIME)
     ========================= */

    const conveyControlWhere = {
      date: {
        [Op.between]: [fromDate, toDate],
      },
    };

    if (checkpostId) {
      conveyControlWhere.checkpostid = checkpostId;
    }

    const conveyControlRows = await db.ConveyControl.findAll({
      attributes: ["conveyid", "starttime", "closetime"],
      where: conveyControlWhere,
      raw: true,
    });

    const conveyControlMap = {};
    conveyControlRows.forEach((row) => {
      conveyControlMap[row.conveyid] = {
        start_time: row.starttime,
        end_time: row.closetime,
      };
    });

    /* =========================
     4️⃣ VERIFICATION COUNTS
     ========================= */

    const verificationRows = await db.Trip.findAll({
      attributes: [
        "convoyTime",
        [
          Sequelize.literal(
            "SUM(CASE WHEN verifiystatus = 3 THEN 1 ELSE 0 END)",
          ),
          "verificationRejectedCount",
        ],
        [
          Sequelize.literal(
            "SUM(CASE WHEN verifiystatus = 0 AND status = '1' THEN 1 ELSE 0 END)",
          ),
          "verificationPendingCount",
        ],
      ],
      where: {
        date: {
          [Op.between]: [fromDate, toDate],
        },
      },
      group: ["convoyTime"],
      raw: true,
    });

    const verificationMap = {};
    verificationRows.forEach((row) => {
      verificationMap[row.convoyTime] = {
        verificationRejectedCount: Number(row.verificationRejectedCount || 0),
        verificationPendingCount: Number(row.verificationPendingCount || 0),
      };
    });

    /* =========================
     5️⃣ APPROVED TRIPS QUERY
     ========================= */

    const approveTripWhere = {
      [Op.and]: [
        where(fn("DATE", col("approvedTrips.arrdate")), {
          [Op.between]: [fromDate, toDate],
        }),
      ],
    };

    if (checkpostId) {
      approveTripWhere[Op.and].push({
        checkpost_id: checkpostId,
      });
    }

    const convoys = await db.TConvey.findAll({
      where: { status: 1 },
      attributes: ["id", "convey_name", "convey_time"],
      include: [
        {
          model: db.ApproveTrip,
          as: "approvedTrips",
          required: false,
          attributes: ["id", "tId", "astatus"],
          where: approveTripWhere,
          include: [
            {
              model: db.Trip,
              as: "trip",
              attributes: ["tId", "isTourist"],
              include: [
                {
                  model: db.Passenger,
                  as: "passengers",
                  attributes: ["gender", "age", "isForeigner"],
                  through: { attributes: [], where: { status: 1 } },
                  required: false,
                },
                {
                  model: db.Vehicle,
                  as: "vehicle",
                  attributes: ["ownershipType", "vCat"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    /* =========================
     6️⃣ BUILD FINAL RESPONSE
     ========================= */

    const result = convoys.map((c) => {
      let approvedTripsCount = 0;
      let rejectedTripsCount = 0;

      let totalPassengers = 0;
      let totalMale = 0;
      let totalFemale = 0;
      let totalChild = 0;
      let touristTripsCount = 0;
      let nonTouristTripsCount = 0;
      let totalForeigners = 0;

      /* ================= VEHICLE STATS ================= */

      const vehicleStats = {
        Government: 0,
        Commercial: 0,
        Private: 0,

        Car: 0,
        SUV: 0,
        Van: 0,
        LMVCargo: 0,

        PickupTruck: 0,
        Truck: 0,
        HMV: 0,

        BusGovernment: 0,
        BusCommercial: 0,

        Ambulance: 0,
        MortuaryVan: 0,

        WaterTanker: 0,
        OilTanker: 0,
        LPGTanker: 0,

        Other: 0,
      };

      /* ✅ NEW — GOVT CATEGORY BREAKDOWN */
      const govtVehicleStats = {
        Car: 0,
        SUV: 0,
        Van: 0,
        LMVCargo: 0,
        PickupTruck: 0,
        Truck: 0,
        HMV: 0,
        Bus: 0,
        Ambulance: 0,
        MortuaryVan: 0,
        WaterTanker: 0,
        OilTanker: 0,
        LPGTanker: 0,
        Other: 0,
        Total: 0,
      };

      const privateVehicleStats = {
        Car: 0,
        SUV: 0,
        Van: 0,
        LMVCargo: 0,
        PickupTruck: 0,
        Truck: 0,
        HMV: 0,
        Bus: 0,
        Ambulance: 0,
        MortuaryVan: 0,
        WaterTanker: 0,
        OilTanker: 0,
        LPGTanker: 0,
        Other: 0,
        Total: 0,
      };

      (c.approvedTrips || []).forEach((ap) => {
        if (ap.astatus === 0) {
          rejectedTripsCount++;
          return;
        }

        approvedTripsCount++;

        const trip = ap.trip;
        if (!trip) return;

        if (Number(trip.isTourist) === 1) touristTripsCount++;
        else nonTouristTripsCount++;

        const vehicle = trip.vehicle;

        if (vehicle) {
          const vCat = vehicle.vCat?.replace(/\s+/g, " ").trim().toLowerCase();
          const ownership = vehicle.ownershipType
            ?.replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

          const isGovt = ownership === "government";
          const targetStats = isGovt ? govtVehicleStats : privateVehicleStats;

          /* ===== CATEGORY COUNTS (FULL LIST) ===== */

          if (vCat === "car") {
            vehicleStats.Car++;
            targetStats.Car++;
          } else if (vCat === "suv") {
            vehicleStats.SUV++;
            targetStats.SUV++;
          } else if (vCat === "van") {
            vehicleStats.Van++;
            targetStats.Van++;
          } else if (vCat === "lmv cargo") {
            vehicleStats.LMVCargo++;
            targetStats.LMVCargo++;
          } else if (vCat === "pickup truck") {
            vehicleStats.PickupTruck++;
            targetStats.PickupTruck++;
          } else if (vCat === "truck") {
            vehicleStats.Truck++;
            targetStats.Truck++;
          } else if (vCat === "hmv") {
            vehicleStats.HMV++;
            targetStats.HMV++;
          } else if (vCat === "bus") {
            if (isGovt) vehicleStats.BusGovernment++;
            else vehicleStats.BusCommercial++;

            targetStats.Bus++;
          } else if (vCat === "ambulance") {
            vehicleStats.Ambulance++;
            targetStats.Ambulance++;
          } else if (vCat === "mortuary van") {
            vehicleStats.MortuaryVan++;
            targetStats.MortuaryVan++;
          } else if (vCat === "water tanker") {
            vehicleStats.WaterTanker++;
            targetStats.WaterTanker++;
          } else if (vCat === "oil tanker") {
            vehicleStats.OilTanker++;
            targetStats.OilTanker++;
          } else if (vCat === "lpg tanker") {
            vehicleStats.LPGTanker++;
            targetStats.LPGTanker++;
          } else {
            // unknown category
            vehicleStats.Other++;
            targetStats.Other++;
          }

          // increment govt/private totals
          targetStats.Total++;

          /* ===== OWNERSHIP TOTALS ===== */
          if (ownership === "government") vehicleStats.Government++;
          else if (ownership === "commercial") vehicleStats.Commercial++;
          else if (ownership === "private") vehicleStats.Private++;
        }

        /* ===== PASSENGER STATS ===== */

        const passengers = trip.passengers || [];
        totalPassengers += passengers.length;

        passengers.forEach((p) => {
          if (Number(p.isForeigner) === 1) totalForeigners++;

          if (typeof p.age === "number" && p.age <= 12) totalChild++;
          else if (p.gender?.toLowerCase() === "male") totalMale++;
          else if (p.gender?.toLowerCase() === "female") totalFemale++;
        });
      });

      const verification = verificationMap[c.convey_time?.toString()] || {
        verificationRejectedCount: 0,
        verificationPendingCount: 0,
      };

      const conveyTiming = conveyControlMap[c.id] || {
        start_time: null,
        end_time: null,
      };

      return {
        convey_id: c.id,
        convey_name: c.convey_name,
        convey_time: c.convey_time,

        start_time: conveyTiming.start_time,
        end_time: conveyTiming.end_time,

        approvedTripsCount,
        rejectedTripsCount,
        touristTripsCount,
        nonTouristTripsCount,

        verificationRejectedCount: verification.verificationRejectedCount,
        verificationPendingCount: verification.verificationPendingCount,

        totalPassengers,
        totalMale,
        totalFemale,
        totalChild,
        totalForeigners,

        vehicleStats,

        /* ✅ NEW FIELDS */
        govtVehicleStats,
        privateVehicleStats,
      };
    });

    /* =========================
🔥 OPTIMIZED SPECIAL TRIPS (WITH VEHICLES FIXED)
========================= */

    const specialTrips = await db.Trip.findAll({
      attributes: ["tId", "convoyTime", "isTourist"],
      where: {
        date: {
          [Op.between]: [fromDate, toDate],
        },
        status: 2,
        origin: checkpostId ? checkpostId : { [Op.in]: [1, 2] },
        [Op.and]: [
          Sequelize.where(
            Sequelize.cast(Sequelize.col("convoyTime"), "SIGNED"),
            { [Op.gte]: 99 },
          ),
        ],
      },
      include: [
        {
          model: db.Vehicle,
          as: "vehicle", // ⚠️ SAME alias as your normal convoy query
          attributes: ["ownershipType", "vCat"],
          required: false,
        },
      ],
      raw: false, // ❗ IMPORTANT (we need object access)
    });

    // 👉 Trip IDs
    const tripIds = specialTrips.map((t) => t.tId);

    // 👉 Passenger relations
    const relations = await db.tripRelation.findAll({
      attributes: ["tId", "pId"],
      where: {
        tId: tripIds,
        status: 1,
      },
      raw: true,
    });

    // 👉 Passenger data
    const passengers = await db.Passenger.findAll({
      attributes: ["pId", "isForeigner", "gender", "age"],
      where: {
        pId: relations.map((r) => r.pId),
      },
      raw: true,
    });

    // 👉 Passenger lookup
    const foreignSet = new Set(
      passengers.filter((p) => p.isForeigner === 1).map((p) => p.pId),
    );

    const passengerMap = {};
    passengers.forEach((p) => {
      passengerMap[p.pId] = p;
    });

    // 👉 Trip → passenger map
    const tripMap = {};
    relations.forEach((r) => {
      if (!tripMap[r.tId]) tripMap[r.tId] = [];
      tripMap[r.tId].push(r.pId);
    });

    // 👉 FINAL SUMMARY
    let summary = {
      emergency: {
        totalTrips: 0,
        touristTrips: 0,
        nonTouristTrips: 0,
        totalPassengers: 0,
        totalForeigners: 0,
        totalMale: 0,
        totalFemale: 0,
        totalChild: 0,

        vehicleStats: {
          LMV: 0,
          LMVCargo: 0,
          Truck: 0,
          WaterTanker: 0,
          OilTanker: 0,
          LPGTruck: 0,
          BusGovernment: 0,
          BusCommercial: 0,
          Ambulance: 0,
          PickupTruck: 0,
          Government: 0,
          Commercial: 0,
          Private: 0,
        },
      },

      vip: {
        totalTrips: 0,
        touristTrips: 0,
        nonTouristTrips: 0,
        totalPassengers: 0,
        totalForeigners: 0,
        totalMale: 0,
        totalFemale: 0,
        totalChild: 0,

        vehicleStats: {
          LMV: 0,
          LMVCargo: 0,
          Truck: 0,
          WaterTanker: 0,
          OilTanker: 0,
          LPGTruck: 0,
          BusGovernment: 0,
          BusCommercial: 0,
          Ambulance: 0,
          PickupTruck: 0,
          Government: 0,
          Commercial: 0,
          Private: 0,
        },
      },
    };

    // 👉 SINGLE LOOP (FIXED)
    specialTrips.forEach((t) => {
      const id = Number(t.convoyTime);
      const isVip = id >= 200;
      const group = isVip ? summary.vip : summary.emergency;

      group.totalTrips++;

      if (Number(t.isTourist) === 1) group.touristTrips++;
      else group.nonTouristTrips++;

      const pIds = tripMap[t.tId] || [];

      // 👉 PASSENGERS
      group.totalPassengers += pIds.length;

      pIds.forEach((pid) => {
        const p = passengerMap[pid];
        if (!p) return;

        if (foreignSet.has(pid)) group.totalForeigners++;

        if (typeof p.age === "number" && p.age <= 12) {
          group.totalChild++;
        } else if (p.gender?.toLowerCase() === "male") {
          group.totalMale++;
        } else if (p.gender?.toLowerCase() === "female") {
          group.totalFemale++;
        }
      });

      // 👉 VEHICLES (FIXED)
      const vehicle = t.vehicle; // ✅ direct relation

      if (vehicle) {
        const vCat = vehicle.vCat?.toLowerCase();
        const ownership = vehicle.ownershipType?.toLowerCase();

        const stats = group.vehicleStats;

        if (vCat === "car") stats.LMV++;
        else if (vCat === "lmv cargo") stats.LMVCargo++;
        else if (vCat === "truck") stats.Truck++;
        else if (vCat === "water tanker") stats.WaterTanker++;
        else if (vCat === "oil tanker") stats.OilTanker++;
        else if (vCat === "lpg tanker") stats.LPGTruck++;
        else if (vCat === "pickup truck") stats.PickupTruck++;
        else if (vCat === "ambulance") stats.Ambulance++;
        else if (vCat === "bus") {
          if (ownership === "government") stats.BusGovernment++;
          else stats.BusCommercial++;
        }

        // ownership
        if (ownership === "government") stats.Government++;
        else if (ownership === "commercial") stats.Commercial++;
        else if (ownership === "private") stats.Private++;
      }
    });
    return {
      message: "Today's convoy statistics fetched successfully",
      convoys: result,
      specialSummary: summary,
    };
  }

  static async startcheckout(payload) {
    try {
      const { convey_id, checkpost_id } = payload;

      if (!convey_id || !checkpost_id) {
        return {
          success: false,
          message: "convey_id and checkpost_id are required",
        };
      }

      const today = new Date().toISOString().split("T")[0];
      const currentTime = new Date().toTimeString().split(" ")[0];

      const existing = await db.CheckoutControl.findOne({
        where: {
          conveyid: convey_id,
          checkpostid: checkpost_id,
          date: today,
        },
      });

      if (existing) {
        return {
          success: false,
          message: "Checkout already started and Stoped for this convey today",
          data: existing,
        };
      }

      //  Insert new checkout
      const checkout = await db.CheckoutControl.create({
        conveyid: convey_id,
        checkpostid: checkpost_id,
        date: today,
        starttime: currentTime,
        closetime: "00:00:00",
        status: 1,
      });


      return {
        success: true,
        message: "Checkout started successfully",
        data: checkout,
      };
    } catch (error) {
      console.error("❌ AuthService startcheckout:", error);
      return {
        success: false,
        message: "Error starting checkout",
        error: error.message,
      };
    }
  }

  // services/AuthService.js
  static async getRunningCheckout(checkpostId) {
    try {
      const today = new Date().toISOString().split("T")[0];

      const runningCheckout = await db.CheckoutControl.findOne({
        where: {
          checkpostid: checkpostId,
          date: today,
          status: 1, // ✅ running
        },
        include: [
          {
            model: db.TConvey,
            as: "tconvey",
            attributes: ["id", "convey_name", "convey_time"],
          },
        ],
        order: [["id", "DESC"]],
      });

      if (!runningCheckout) {
        return {
          success: true,
          message: "No running checkout found",
          data: null,
        };
      }

      return {
        success: true,
        message: "Running checkout fetched successfully",
        data: {
          id: runningCheckout.id,
          conveyid: runningCheckout.conveyid,
          checkpostid: runningCheckout.checkpostid,
          date: runningCheckout.date,
          starttime: runningCheckout.starttime,
          tconvey: runningCheckout.tconvey,
          status: runningCheckout.status,
        },
      };
    } catch (error) {
      console.error("❌ Error fetching running checkout:", error);
      return {
        success: false,
        message: "Failed to fetch running checkout",
        error: error.message,
      };
    }
  }

  static async stopcheckout(payload) {
    try {
      const { convey_id, checkpost_id } = payload;

      // 1️⃣ Validation
      if (!convey_id || !checkpost_id) {
        return {
          success: false,
          message: "convey_id and checkpost_id are required",
        };
      }

      const today = new Date().toISOString().split("T")[0];
      const currentTime = new Date().toTimeString().split(" ")[0];

      // 2️⃣ Find currently running checkout
      const runningCheckout = await db.CheckoutControl.findOne({
        where: {
          conveyid: convey_id,
          checkpostid: checkpost_id,
          date: today,
          status: 1, // 🔥 only running checkout
        },
        order: [["id", "DESC"]],
      });

      if (!runningCheckout) {
        return {
          success: false,
          message: "No running checkout found to stop",
        };
      }

      // 3️⃣ Update checkout → STOP
      await runningCheckout.update({
        closetime: currentTime,
        status: 0,
      });


      return {
        success: true,
        message: "Checkout stopped successfully",
        data: runningCheckout,
      };
    } catch (error) {
      console.error("❌ AuthService stopcheckout:", error);
      return {
        success: false,
        message: "Error stopping checkout",
        error: error.message,
      };
    }
  }

  static async generateCheckoutReport(params) {
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      const conveyid = params?.conveyid;
      const checkpostid = params?.checkpostid;
      const checkoutdate = params?.checkoutdate || null;

      if (!conveyid || !checkpostid) {
        throw new Error("conveyid and checkpostid are required");
      }

      // ================= WHERE CONDITION =================
      const whereClause = {
        conveyid,
        checkpostid,
        checkoutdate: checkoutdate || today, // ✅ force current date if not provided
      };

      // ================= FETCH CHECKOUT DATA =================
      const rows = await db.CheckoutTrip.findAll({
        where: whereClause,
        include: [
          // ✅ APPROVE TRIP
          {
            model: db.ApproveTrip,
            as: "approveTrip",
            attributes: [
              "id",
              "arrdate",
              "arrtime",
              "convey_id",
              "checkpost_id",
              "remarks",
              "astatus",
              "approveby",
            ],
            include: [
              {
                model: db.TConvey,
                as: "convey",
                attributes: ["id", "convey_name", "convey_time"],
              },
              {
                model: db.OriginDestination,
                as: "checkpost",
                attributes: ["id", "location"],
              },
              {
                model: db.PoliceRegistration,
                as: "approverOfficer",
                attributes: [
                  "reg_id",
                  "title",
                  "firstName",
                  "lastName",
                  "designation",
                ],
              },
            ],
          },

          // ✅ TRIP + VEHICLE + DRIVER + PASSENGERS
          {
            model: db.Trip,
            as: "trip",
            include: [
              {
                model: db.OriginDestination,
                as: "originLocation",
                attributes: ["id", "location"],
              },
              {
                model: db.OriginDestination,
                as: "destinationLocation",
                attributes: ["id", "location"],
              },
              {
                model: db.Vehicle,
                as: "vehicle",
                attributes: ["vId", "vNum", "ownershipType", "vCat"],
              },
              {
                model: db.Driver,
                as: "driver",
                attributes: ["dId", "dFirstName", "dLastName"],
              },
              {
                model: db.Passenger,
                as: "passengers",
                attributes: ["pId", "gender", "age"],
                through: { attributes: [], where: { status: 1 } },
                required: false,
                duplicating: false,
              },
            ],
          },

          // ✅ CONVEY (FROM CHECKOUT)
          {
            model: db.TConvey,
            as: "convey",
            attributes: ["id", "convey_name", "convey_time"],
          },

          // ✅ CHECKPOST LOCATION
          {
            model: db.OriginDestination,
            as: "checkpostLocation",
            attributes: ["id", "location"],
          },
        ],
        order: [["checkouttime", "ASC"]],
      });


      // ================= VEHICLE CATEGORY COUNTS =================
      const vehicleCounts = {
        Government: 0,
        Commercial: 0,
        Private: 0,
        Ambulance: 0,
      };

      // ================= PASSENGER COUNTS =================
      let totalPassengers = 0;
      let totalMale = 0;
      let totalFemale = 0;
      let totalChild = 0;

      rows.forEach((row) => {
        const trip = row.trip;
        if (!trip) return;

        // 🚗 Vehicle counts
        const ownershipType = trip.vehicle?.ownershipType;
        if (ownershipType && vehicleCounts[ownershipType] !== undefined) {
          vehicleCounts[ownershipType]++;
        }

        // 🧍 Passenger counts
        const passengers = trip.passengers || [];
        totalPassengers += passengers.length;

        passengers.forEach((p) => {
          const gender = p.gender?.toLowerCase();
          const age = p.age;

          if (typeof age === "number" && age <= 12) {
            totalChild++;
          } else if (gender === "male") {
            totalMale++;
          } else if (gender === "female") {
            totalFemale++;
          }
        });
      });


      // ================= REPORT GENERATED TIME =================
      const moment = require("moment-timezone");
      const reportGeneratedAt = moment()
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY hh:mm A");

      // ================= FINAL RESPONSE =================
      return {
        success: true,
        reportGeneratedAt,
        rows, // checkout rows (main data)
        summary: {
          totalPassengers,
          totalMale,
          totalFemale,
          totalChild,
          vehicleCounts,
        },
      };
    } catch (error) {
      console.error("❌ Error fetching checkout report:", error.message);
      throw error;
    }
  }

  static async getRegisteredPolice() {
    try {
      // Get registrations + checkpost name
      const registrations = await db.PoliceRegistration.findAll({
        where: { status: 1 },
        include: [
          {
            model: db.OriginDestination,
            as: "originDestination",
            attributes: ["id", "location"],
          },
        ],
      });

      // Get valid police users (include createdAt)
      const users = await db.PoliceUser.findAll({
        where: { status: 1 },
        attributes: ["id", "email", "isActive", "lastLoginAt", "createdAt"],
      });

      // Map users by ID
      const userMap = {};
      users.forEach((u) => {
        userMap[u.id] = u;
      });

      // ✅ SORT registrations by PoliceUser.createdAt (DESC)
      registrations.sort((a, b) => {
        const userA = userMap[a.userId];
        const userB = userMap[b.userId];

        return (
          new Date(userB?.createdAt || 0) - new Date(userA?.createdAt || 0)
        );
      });

      // Build response
      const result = registrations.map((r) => {
        const user = userMap[r.userId];

        return {
          reg_id: r.reg_id,
          name: `${r.firstName} ${r.lastName}`.trim(),
          designation: r.designation,
          emp_id: r.emp_id,
          contact: r.contact,
          email: user?.email || "",
          isActive: user?.isActive ?? false,
          userid: user?.id,
          lastLoginAt: user?.lastLoginAt || null,
          checkpostId: r.checkpost,
          checkpost: r.originDestination?.location || "N/A",
        };
      });

      return { success: true, count: result.length, data: result };
    } catch (err) {
      console.error("getRegisteredPolice error:", err);
      return { success: false, message: "Fetch failed", error: err.message };
    }
  }

  static async getFreezPolice() {
    try {
      // Get registrations + checkpost name
      const registrations = await db.PoliceRegistration.findAll({
        where: { status: 0 },
        include: [
          {
            model: db.OriginDestination,
            as: "originDestination",
            attributes: ["id", "location"],
          },
        ],
      });

      // Get valid police users
      const users = await db.PoliceUser.findAll({
        where: { status: 0 },
        attributes: ["id", "email", "isActive", "lastLoginAt", "id"],
      });

      const userMap = {};
      users.forEach((u) => (userMap[u.id] = u));

      const result = registrations.map((r) => {
        const user = userMap[r.userId];

        return {
          reg_id: r.reg_id,
          name: `${r.firstName} ${r.lastName}`.trim(),
          designation: r.designation,
          emp_id: r.emp_id,
          contact: r.contact,
          email: user?.email || "",
          isActive: user?.isActive ?? false,
          userid: user?.id,
          lastLoginAt: user?.lastLoginAt || null,
          checkpostId: r.checkpost,
          checkpost: r.originDestination?.location || "N/A",
        };
      });

      return { success: true, count: result.length, data: result };
    } catch (err) {
      console.error("getRegisteredPolice error:", err);
      return { success: false, message: "Fetch failed", error: err.message };
    }
  }

  static async freezePoliceUser(body, loggedInUser) {
    try {
      const { policeId } = body;

      if (!policeId) {
        throw new Error("policeId is required");
      }

      const { PoliceUser, PoliceRegistration } = require("../models");

      // 1️⃣ Check police user exists
      const policeUser = await PoliceUser.findOne({
        where: { id: policeId },
      });

      if (!policeUser) {
        throw new Error("Police user not found");
      }

      // 2️⃣ Freeze police user and sign them out everywhere
      await PoliceUser.update(
        {
          status: 0,
          refreshToken: null,
          tokenVersion: db.sequelize.literal("tokenVersion + 1"),
        },
        { where: { id: policeId } },
      );

      // 3️⃣ Freeze police registration
      await PoliceRegistration.update(
        { status: 0 },
        { where: { userId: policeId } },
      );


      return {
        policeId,
        status: 0,
        message: "Police account frozen successfully",
        frozenBy: loggedInUser?.reg_id || null,
      };
    } catch (error) {
      console.error("Freeze Police Service Error:", error);
      throw error;
    }
  }

  static async unfreezePoliceUser(body, loggedInUser) {
    try {
      const { policeId } = body;

      if (!policeId) {
        throw new Error("policeId is required");
      }

      const { PoliceUser, PoliceRegistration } = require("../models");

      // 1️⃣ Check police user exists
      const policeUser = await PoliceUser.findOne({
        where: { id: policeId },
      });

      if (!policeUser) {
        throw new Error("Police user not found");
      }

      // 2️⃣ Freeze police user
      await PoliceUser.update({ status: 1 }, { where: { id: policeId } });

      // 3️⃣ Freeze police registration
      await PoliceRegistration.update(
        { status: 1 },
        { where: { userId: policeId } },
      );


      return {
        policeId,
        status: 0,
        message: "Police account Unfrozen successfully",
        frozenBy: loggedInUser?.reg_id || null,
      };
    } catch (error) {
      console.error("Freeze Police Service Error:", error);
      throw error;
    }
  }

  static async deletePoliceUser(policeId, loggedInUser) {
    const t = await db.sequelize.transaction();

    try {

      // 1️⃣ Check if user exists
      const user = await db.PoliceUser.findOne({
        where: { id: policeId },
        transaction: t,
      });

      if (!user) {
        throw new Error("Police user not found");
      }

      // 2️⃣ Soft delete PoliceUser
      await db.PoliceUser.update(
        {
          status: 2, // Deleted
          isActive: false,
        },
        {
          where: { id: policeId },
          transaction: t, // ✅ FIXED
        },
      );

      // 3️⃣ Soft delete PoliceRegistration
      await db.PoliceRegistration.update(
        {
          status: 2, // Deleted
        },
        {
          where: { userId: policeId },
          transaction: t, // ✅ FIXED
        },
      );

      await t.commit();

      return {
        deletedPoliceId: policeId,
        deletedBy: loggedInUser?.reg_id || null,
        status: "Deleted successfully",
      };
    } catch (error) {
      await t.rollback();
      console.error("Delete Police Service Error:", error);
      throw error;
    }
  }

  static async getDesignations() {
    try {
      const designations = await db.TDesignation.findAll({
        attributes: ["id", "designation", "value"],
        where: { status: 1 },
        order: [["id", "ASC"]],
      });

      return designations;
    } catch (error) {
      console.error("AuthService.getDesignations error:", error);
      throw error;
    }
  }

  static async getSpReport(selecteddate) {
    try {

      // ✅ USE SELECTED DATE OR TODAY
      const reportDate =
        selecteddate && /^\d{4}-\d{2}-\d{2}$/.test(selecteddate)
          ? selecteddate
          : new Date().toISOString().split("T")[0];


      // 🔹 Helper: origin condition by checkpost
      const getOriginCondition = (checkpostid) =>
        checkpostid === 1 ? { origin: 1 } : { origin: { [Op.ne]: 1 } };

      // 🔹 Closed convoy count
      const getClosedConvoyCount = async (checkpostid) => {
        return await db.ConveyControl.count({
          where: {
            [Op.and]: [
              where(fn("DATE", col("date")), reportDate),
              { status: 0 },
              { checkpostid },

              {
                conveyid: {
                  [Op.lt]: 99,
                },
              },
            ],
          },
        });
      };

      // 🔹 Approved convoy count
      const getApprovedConvoyCount = async (checkpostid) => {
        return await db.ApproveTrip.count({
          include: [
            {
              model: db.Trip,
              as: "trip",
              required: true,
              where: {
                date: reportDate,
                ...getOriginCondition(checkpostid),
              },
            },
          ],
          where: {
            arrdate: reportDate,
            astatus: { [Op.ne]: 0 },
            convey_id: {
              [Op.lt]: 99,
            },
          },
        });
      };

      // 🔹 Approved passenger count
      const getApprovedPassengerCount = async (checkpostid) => {
        return await db.tripRelation.count({
          include: [
            {
              model: db.Trip,
              as: "trip",
              required: true,
              where: {
                date: reportDate,
                ...getOriginCondition(checkpostid),

                // ✅ ADD THIS
                [Op.and]: [
                  Sequelize.where(
                    Sequelize.cast(Sequelize.col("trip.convoyTime"), "SIGNED"),
                    { [Op.lt]: 99 },
                  ),
                ],
              },
              include: [
                {
                  model: db.ApproveTrip,
                  as: "approveDetails",
                  required: true,
                  where: {
                    arrdate: reportDate,
                    astatus: { [Op.ne]: 0 },
                  },
                },
              ],
            },
          ],
        });
      };

      // 🔹 Rejected trip count
      const getRejectedTripCount = async (checkpostid) => {
        return await db.Trip.count({
          where: {
            date: reportDate,
            [Op.and]: [
              getOriginCondition(checkpostid),
              {
                [Op.or]: [{ status: 3 }, { verifiystatus: 3 }],
              },

              // ✅ ADD THIS
              Sequelize.where(
                Sequelize.cast(Sequelize.col("convoyTime"), "SIGNED"),
                { [Op.lt]: 99 },
              ),
            ],
          },
        });
      };

      // 🔹 Non-arrival vehicle count
      const getNonArrivalVehicleCount = async (checkpostid) => {
        const checkpostCondition =
          checkpostid === 1
            ? { checkpostid: 1 }
            : { checkpostid: { [Op.ne]: 1 } };

        return await db.CheckoutTrip.count({
          where: {
            checkoutdate: reportDate,
            status: 0,
            ...checkpostCondition,
          },
          include: [
            {
              model: db.Trip,
              as: "trip",
              required: true,

              where: {
                [Op.and]: [
                  Sequelize.where(
                    Sequelize.cast(Sequelize.col("trip.convoyTime"), "SIGNED"),
                    { [Op.lt]: 99 },
                  ),
                ],
              },
            },
          ],
        });
      };

      const getCheckProblemcount = async (checkpostid) => {
        const checkpostCondition =
          checkpostid === 1
            ? { checkpostid: 1 }
            : { checkpostid: { [Op.ne]: 1 } };

        return await db.CheckoutTrip.count({
          where: {
            checkoutdate: reportDate,
            status: 2,
            ...checkpostCondition,
          },
          include: [
            {
              model: db.Trip,
              as: "trip",
              required: true,

              where: {
                [Op.and]: [
                  Sequelize.where(
                    Sequelize.cast(Sequelize.col("trip.convoyTime"), "SIGNED"),
                    { [Op.lt]: 99 },
                  ),
                ],
              },
            },
          ],
        });
      };

      // 🔹 Arrival count
      const getArrivalcount = async (checkpostid) => {
        const checkpostCondition =
          checkpostid === 1
            ? { checkpostid: 1 }
            : { checkpostid: { [Op.ne]: 1 } };

        return await db.CheckoutTrip.count({
          where: {
            checkoutdate: reportDate,
            status: { [Op.ne]: 0 },
            ...checkpostCondition,
          },
          include: [
            {
              model: db.Trip,
              as: "trip",
              required: true,

              where: {
                [Op.and]: [
                  Sequelize.where(
                    Sequelize.cast(Sequelize.col("trip.convoyTime"), "SIGNED"),
                    { [Op.lt]: 99 },
                  ),
                ],
              },
            },
          ],
        });
      };

      const getArrivalTripIds = async (checkpostid) => {
        const checkpostCondition =
          checkpostid === 1
            ? { checkpostid: 1 }
            : { checkpostid: { [Op.ne]: 1 } };

        const rows = await db.CheckoutTrip.findAll({
          where: {
            checkoutdate: reportDate,
            status: { [Op.ne]: 0 },
            ...checkpostCondition,
          },
          include: [
            {
              model: db.Trip,
              as: "trip",
              required: true,
              attributes: [],

              where: {
                [Op.and]: [
                  Sequelize.where(
                    Sequelize.cast(Sequelize.col("trip.convoyTime"), "SIGNED"),
                    { [Op.lt]: 99 },
                  ),
                ],
              },
            },
          ],
          attributes: ["tId"],
          raw: true,
        });

        return rows.map((r) => r.tId);
      };

      // 🔹 Arrival passenger total from trip_relation_tbl
      const getArrivalPassengerTotal = async (tripIds) => {
        if (!tripIds || tripIds.length === 0) return 0;

        const passengerCount = await db.tripRelation.count({
          where: {
            tId: { [Op.in]: tripIds },
            status: 1, // arrived / active passenger
          },
        });

        return passengerCount;
      };
      const getArrivalPassengerCount = async (tripIds) => {
        if (!tripIds.length) return 0;

        const passengerCount = await db.tripRelation.count({
          where: {
            tId: { [Op.in]: tripIds },
            status: 1, // ✅ keep if required
          },
        });


        return passengerCount;
      };

      // 🔹 Fetch counts
      const jirkatangClosed = await getClosedConvoyCount(1);
      const middleStraitClosed = await getClosedConvoyCount(2);

      const jirkatangApproved = await getApprovedConvoyCount(1);
      const middleStraitApproved = await getApprovedConvoyCount(2);

      const jirkatangPassengers = await getApprovedPassengerCount(1);
      const middleStraitPassengers = await getApprovedPassengerCount(2);

      const jirkatangRejected = await getRejectedTripCount(1);
      const middleStraitRejected = await getRejectedTripCount(2);

      const jirkatangNotArrived = await getNonArrivalVehicleCount(1);
      const middleStraitNotArrived = await getNonArrivalVehicleCount(2);

      const jirkatangCheckProblem = await getCheckProblemcount(1);
      const middleStraitCheckProblem = await getCheckProblemcount(2);

      const jirkatangArrival = await getArrivalcount(1);
      const middleStraitArrival = await getArrivalcount(2);

      const jirkatangTripIds = await getArrivalTripIds(1);

      // Middle Strait
      const middleStraitTripIds = await getArrivalTripIds(2);


      // 🔹 Get arrival passenger totals
      const jirkatangArrivalPassengers =
        await getArrivalPassengerTotal(jirkatangTripIds);

      const middleStraitArrivalPassengers =
        await getArrivalPassengerTotal(middleStraitTripIds);

      // =========================
      // 🔥 SPECIAL CONVOY (CHECKPOST-WISE)
      // =========================

      // 🚨 Emergency (100–199)

      // 👉 JIRKATANG (checkpost = 1)
      const jirkatangEmergency = await db.Trip.count({
        where: {
          date: reportDate,
          status: 2,
          origin: 1, // ✅ JIRKATANG
          [Op.and]: [
            Sequelize.where(
              Sequelize.cast(Sequelize.col("convoyTime"), "SIGNED"),
              { [Op.gte]: 100 },
            ),
            Sequelize.where(
              Sequelize.cast(Sequelize.col("convoyTime"), "SIGNED"),
              { [Op.lt]: 200 },
            ),
          ],
        },
      });

      // 👉 MIDDLE STRAIT (checkpost ≠ 1)
      const middleStraitEmergency = await db.Trip.count({
        where: {
          date: reportDate,
          status: 2,
          origin: { [Op.ne]: 1 }, // ✅ MIDDLE STRAIT
          [Op.and]: [
            Sequelize.where(
              Sequelize.cast(Sequelize.col("convoyTime"), "SIGNED"),
              { [Op.gte]: 100 },
            ),
            Sequelize.where(
              Sequelize.cast(Sequelize.col("convoyTime"), "SIGNED"),
              { [Op.lt]: 200 },
            ),
          ],
        },
      });

      // ⭐ VIP (>=200)

      // 👉 JIRKATANG
      const jirkatangVIP = await db.Trip.count({
        where: {
          date: reportDate,
          status: 2,
          origin: 1,
          [Op.and]: [
            Sequelize.where(
              Sequelize.cast(Sequelize.col("convoyTime"), "SIGNED"),
              { [Op.gte]: 200 },
            ),
          ],
        },
      });

      // 👉 MIDDLE STRAIT
      const middleStraitVIP = await db.Trip.count({
        where: {
          date: reportDate,
          status: 2,
          origin: { [Op.ne]: 1 },
          [Op.and]: [
            Sequelize.where(
              Sequelize.cast(Sequelize.col("convoyTime"), "SIGNED"),
              { [Op.gte]: 200 },
            ),
          ],
        },
      });

      // ✅ FINAL RESPONSE
      return {
        success: true,
        message: "SP convoy report fetched successfully",
        date: reportDate,
        checkposts: [
          {
            checkpostId: 1,
            checkpostName: "Jirkatang",
            totalClosedConvoys: jirkatangClosed,
            totalApprovedConvoys: jirkatangApproved,
            totalApprovedPassengers: jirkatangPassengers,
            totalRejectedTrips: jirkatangRejected,
            totalNonArrivalVehicles: jirkatangNotArrived,
            totalCheckProblem: jirkatangCheckProblem,
            totalArrivaltripsjirkatang: jirkatangArrival,
            totalArrivalPassengers: jirkatangArrivalPassengers,
            specialConvoy: {
              emergency: jirkatangEmergency,
              vip: jirkatangVIP,
            },
          },
          {
            checkpostId: 2,
            checkpostName: "Middle Strait",
            totalClosedConvoys: middleStraitClosed,
            totalApprovedConvoys: middleStraitApproved,
            totalApprovedPassengers: middleStraitPassengers,
            totalRejectedTrips: middleStraitRejected,
            totalNonArrivalVehicles: middleStraitNotArrived,
            totalCheckProblem: middleStraitCheckProblem,
            totalArrivaltripsmiddleStrait: middleStraitArrival,
            totalArrivalPassengers: middleStraitArrivalPassengers,
            specialConvoy: {
              emergency: middleStraitEmergency,
              vip: middleStraitVIP,
            },
          },
        ],
      };
    } catch (error) {
      console.error("❌ AuthService.getSpReport error:", error);
      throw error;
    }
  }

  static async getSpTripDetails(payload) {
    try {
      const { date, checkpostId, type } = payload;

      if (!date || !checkpostId || !type) {
        throw new Error("Missing required parameters");
      }

      const originCondition =
        checkpostId === 1 ? { origin: 1 } : { origin: { [Op.ne]: 1 } };

      switch (type) {
        case "REJECTED":
          return await db.Trip.findAll({
            where: {
              date,
              ...originCondition,
              [Op.or]: [{ status: 3 }, { verifiystatus: 3 }],

              // ✅ ADD THIS
              [Op.and]: [
                Sequelize.where(
                  Sequelize.cast(Sequelize.col("Trip.convoyTime"), "SIGNED"),
                  { [Op.lt]: 99 },
                ),
              ],
            },
            attributes: ["tId", "date", "status", "verifiystatus"],
            include: [
              {
                model: db.Driver,
                as: "driver",
                required: false,
                attributes: ["title", "dFirstName", "dLastName"],
              },
              {
                model: db.Vehicle,
                as: "vehicle",
                required: false,
                attributes: ["vNum", "Vcat"],
              },
              {
                model: db.ApproveTrip,
                as: "approveDetails",
                required: false,
                attributes: ["remarks", "astatus", "approveby"],
              },
            ],
          });

        case "DEPARTURE":
          return await db.ApproveTrip.findAll({
            where: {
              arrdate: date,
              astatus: { [Op.ne]: 0 }, // ✅ APPROVED / DEPARTED
              convey_id: {
                [Op.lt]: 99,
              },
            },
            include: [
              {
                model: db.Trip,
                as: "trip",
                required: true,
                where: {
                  date,
                  ...originCondition,
                },
                include: [
                  {
                    model: db.Vehicle,
                    as: "vehicle",
                    attributes: ["vNum", "vCat"],
                  },
                  {
                    model: db.Driver,
                    as: "driver",
                    attributes: ["dFirstName", "dLastName"],
                  },
                ],
              },
            ],
          });

        case "ARRIVAL":
          return await db.CheckoutTrip.findAll({
            where: {
              checkoutdate: date,
              status: { [Op.ne]: 0 },
              checkpostid: checkpostId === 1 ? 1 : { [Op.ne]: 1 },
            },
            include: [
              {
                model: db.Trip,
                as: "trip",
                required: true, // ✅ IMPORTANT (for filtering)
                attributes: ["tId", "date", "convoyTime"],

                where: {
                  // ✅ ADD THIS (NORMAL CONVOY ONLY)
                  [Op.and]: [
                    Sequelize.where(
                      Sequelize.cast(
                        Sequelize.col("trip.convoyTime"),
                        "SIGNED",
                      ),
                      { [Op.lt]: 99 },
                    ),
                  ],
                },

                include: [
                  {
                    model: db.Vehicle,
                    as: "vehicle",
                    attributes: ["vNum", "vCat"],
                  },
                  {
                    model: db.Driver,
                    as: "driver",
                    attributes: ["dFirstName", "dLastName"],
                  },
                ],
              },
            ],
          });

        case "NON_ARRIVAL":
          return await db.CheckoutTrip.findAll({
            where: {
              checkoutdate: date,
              status: 0,
              checkpostid: checkpostId === 1 ? 1 : { [Op.ne]: 1 },
            },
            include: [
              {
                model: db.Trip,
                as: "trip",
                required: true, // ✅ IMPORTANT

                where: {
                  [Op.and]: [
                    Sequelize.where(
                      Sequelize.cast(
                        Sequelize.col("trip.convoyTime"),
                        "SIGNED",
                      ),
                      { [Op.lt]: 99 },
                    ),
                  ],
                },

                attributes: ["tId", "date", "origin", "destination"],
                include: [
                  {
                    model: db.Vehicle,
                    as: "vehicle",
                    attributes: ["vNum"],
                  },
                  {
                    model: db.Driver,
                    as: "driver",
                    attributes: ["dFirstName", "dLastName"],
                  },
                ],
              },
            ],
          });

        case "ISSUE":
          return await db.CheckoutTrip.findAll({
            where: {
              checkoutdate: date,
              status: 2,
              checkpostid: checkpostId === 1 ? 1 : { [Op.ne]: 1 },
            },
            include: [
              {
                model: db.Trip,
                as: "trip",
                required: true, // ✅ IMPORTANT

                where: {
                  [Op.and]: [
                    Sequelize.where(
                      Sequelize.cast(
                        Sequelize.col("trip.convoyTime"),
                        "SIGNED",
                      ),
                      { [Op.lt]: 99 },
                    ),
                  ],
                },

                attributes: ["tId", "date"],
                include: [
                  {
                    model: db.Vehicle,
                    as: "vehicle",
                    attributes: ["vNum", "vCat"],
                  },
                  {
                    model: db.Driver,
                    as: "driver",
                    attributes: ["dFirstName", "dLastName"],
                  },
                ],
              },
            ],
          });

        case "TOTAL_CONVOY":
          return await db.ConveyControl.findAll({
            where: {
              date,
              status: 0,
              checkpostid: checkpostId,

              // ✅ ADD THIS
              conveyid: {
                [Op.lt]: 99,
              },
            },
            attributes: ["id", "conveyid", "date", "starttime", "closetime"],
            include: [
              {
                model: db.TConvey,
                as: "tconvey",
                attributes: ["convey_name", "convey_time"],
              },
            ],
            order: [["starttime", "ASC"]],
          });

        default:
          throw new Error("Invalid report type");
      }
    } catch (err) {
      console.error("❌ getSpTripDetails error:", err);
      throw err;
    }
  }

  //  Change Police Password (DEBUG VERSION)
  static async changePolicePassword(payload) {
    try {
      const { userid, password } = payload;

      // 1️⃣ Basic validation
      if (!userid || !password) {
        throw new Error("User ID and password are required");
      }

      const passwordError = checkPassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // 2️⃣ Find police user
      const policeUser = await PoliceUser.findOne({
        where: { id: userid },
      });

      if (!policeUser) {
        throw new Error("Police user not found");
      }

      // 3️⃣ Check account status
      if (!policeUser.isActive) {
        throw new Error("Police user account is frozen");
      }

      // 4️⃣ Update password (PLAIN TEXT HERE)
      // 🔐 bcrypt hashing happens in model hook (beforeUpdate)
      policeUser.password = password;
      // Sign the officer out everywhere after a password change
      policeUser.refreshToken = null;
      policeUser.tokenVersion = (Number(policeUser.tokenVersion) || 0) + 1;
      await policeUser.save();

      return {
        success: true,
        message: "Password updated successfully",
      };
    } catch (error) {
      console.error("❌ changePolicePassword error:", error);
      throw error;
    }
  }

  static async getNationality() {
    try {
      const nationalities = await db.Nationality.findAll({
        attributes: ["id", "nationality"],
        order: [["nationality", "ASC"]],
      });

      // Return empty array if no data
      if (!nationalities || nationalities.length === 0) {
        return {
          success: true,
          message: "No nationalities found",
          nationalities: [],
        };
      }

      return {
        success: true,
        message: "Nationality list fetched successfully",
        nationalities: nationalities.map((n) => ({
          id: n.id,
          nationality: n.nationality,
        })),
      };
    } catch (error) {
      console.error("Error fetching nationality list:", error);
      return {
        success: false,
        message: "Failed to fetch nationality list",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async getSplConvoyTripDetailsbyRegId(tripData, id) {
    const { Op, fn, col, where, literal } = require("sequelize");

    // Get reg_id associated with the userId
    let regIdObj = await Registration.findOne({
      where: { userId: id },
      attributes: ["reg_id"],
    });

    let reg_id = regIdObj ? regIdObj.get("reg_id") : null;

    if (!reg_id) {
      throw new Error("No registration ID found for the given user.");
    }

    // Fetch trip details by reg_id
    const trips = await db.Trip.findAll({
      where: {
        reg_id: reg_id,
      },
      include: [
        {
          model: db.Driver,
          as: "driver",
          attributes: ["dFirstName", "dLastName", "licenseNo"],
        },
        {
          model: db.Vehicle,
          as: "vehicle",
          attributes: ["vId", "vNum", "vCat"],
        },
        {
          model: db.Passenger,
          as: "passengers",
          attributes: ["passengerName", "phoneNo", "docId"],
        },
        {
          model: db.OriginDestination,
          as: "originLocation",
          attributes: ["id", "location"], // ✅ include location name
        },
        {
          model: db.OriginDestination,
          as: "destinationLocation",
          attributes: ["id", "location"], // ✅ include location name
        },
        {
          model: db.TConvey,
          as: "convey",
          attributes: ["id", "convey_time", "convey_name"],
        }, // add convey include here
      ],
      attributes: [
        "tId",
        "origin",
        "destination",
        "date",
        "vId",
        "dId",
        "convoyTime",
        "status",
        "entrydatetime",
        "verifiystatus",
      ],
      order: [["entrydatetime", "DESC"]],
    });

    // ===== LOOP ALL TRIPS =====
    for (let trip of trips) {
      if (trip.convoyTime !== null) {
        const convoyVal = Number(trip.convoyTime);

        // ===== FIX TCONVEY (100 / 200) =====
        if (convoyVal >= 100 && convoyVal <= 199) {
          const convey = await db.TConvey.findOne({
            where: { id: 100 },
            attributes: ["id", "convey_time", "convey_name"],
          });
          trip.dataValues.convey = convey;
        } else if (convoyVal >= 200) {
          const convey = await db.TConvey.findOne({
            where: { id: 200 },
            attributes: ["id", "convey_time", "convey_name"],
          });
          trip.dataValues.convey = convey;
        }

        // ===== GET START TIME =====
        if (convoyVal >= 100) {
          const conveyControl = await db.ConveyControl.findOne({
            where: {
              conveyid: convoyVal,
              checkpostid: Number(trip.origin),
              [Op.and]: [where(fn("DATE", col("date")), trip.date)],
            },
            attributes: ["starttime", "closetime"],
          });

          if (conveyControl && trip.dataValues.convey) {
            trip.dataValues.convey.dataValues = {
              ...trip.dataValues.convey.dataValues,
              actual_start_time: conveyControl.starttime,
            };
          }
        }
      }
    }

    return {
      message: "Trip details loaded successfully",
      trips: trips,
    };
  }

  static async getSpecialConvoyReport(body) {
    const { Op } = require("sequelize");

    try {

      const { checkpostid, date } = body;

      const whereCondition = {
        origin: checkpostid,
        [Op.and]: [db.sequelize.literal("CAST(convoyTime AS UNSIGNED) > 99")],
      };

      if (date) {
        whereCondition.date = date;
      }

      const trips = await db.Trip.findAll({
        where: whereCondition,

        include: [
          {
            model: db.ApproveTrip,
            as: "approveDetails",
            attributes: ["arrdate", "arrtime", "checkpost_id"],
            required: false,
          },
          {
            model: db.CheckoutTrip,
            as: "checkoutDetails",
            attributes: ["checkoutdate", "checkouttime", "checkpostid"],
            required: false,
          },

          // ✅ NEW JOIN (ACTUAL CONVOY TIME)
          {
            model: db.ConveyControl,
            as: "conveyControl",
            attributes: ["starttime", "closetime", "date", "checkpostid"],
            required: false,
          },

          {
            model: db.Vehicle,
            as: "vehicle",
            attributes: ["vNum", "vCat"],
            required: false,
          },

          // 👨‍✈️ DRIVER (NEW)
          {
            model: db.Driver,
            as: "driver",
            attributes: ["dFirstName", "dLastName"],
            required: false,
          },
          {
            model: db.Passenger,
            as: "passengers",
            attributes: ["pId"],
            through: { attributes: [] },
            required: false,
          },
        ],

        order: [["entrydatetime", "DESC"]],
      });


      const result = trips.map((trip) => {
        const latestCheckout =
          trip.checkoutDetails?.length > 0
            ? trip.checkoutDetails.sort(
                (a, b) =>
                  new Date(b.checkoutdate + " " + b.checkouttime) -
                  new Date(a.checkoutdate + " " + a.checkouttime),
              )[0]
            : null;

        // 🔥 MERGED ACTUAL TIME (Date + Convoy Start Time)
        const actualDateTime =
          trip.date && trip.conveyControl?.starttime
            ? `${trip.date} ${trip.conveyControl.starttime}`
            : "-";

        // 🔥 MERGED CHECKOUT DATETIME
        const checkoutDateTime =
          latestCheckout?.checkoutdate && latestCheckout?.checkouttime
            ? `${latestCheckout.checkoutdate} ${latestCheckout.checkouttime}`
            : "-";

        return {
          tId: trip.tId,

          // 🔥 NEW MERGED FIELD
          actualDateTime,

          // 🔥 NEW CHECKOUT FIELD
          checkoutDateTime,

          // 🚗 VEHICLE
          vehicle: trip.vehicle
            ? `${trip.vehicle.vNum} (${trip.vehicle.vCat || "-"})`
            : "-",

          // 👨‍✈️ DRIVER
          driverName: trip.driver
            ? `${trip.driver.dFirstName} ${trip.driver.dLastName}`
            : "-",
          passengerCount: trip.passengers?.length || 0,
          convoyTime: trip.convoyTime,
        };
      });

      return result;
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  }

  static async splconvoygetCheckOutReport(params) {
    try {
      const whereClause = {
        conveyid: { [Op.gt]: 99 }, // always applied
      };

      if (params.checkpostid !== undefined) {
        whereClause.checkpostid = params.checkpostid;
      }

      if (params.status !== undefined) {
        whereClause.status = params.status;
      }

      if (params.checkoutdate !== undefined) {
        whereClause.checkoutdate = params.checkoutdate;
      }

      const approveWhere =
        params.conveyId !== undefined &&
        params.conveyId !== null &&
        params.conveyId !== ""
          ? { convey_id: params.conveyId }
          : undefined;

      const checkOutTrips = await db.CheckoutTrip.findAll({
        where: whereClause,

        // ✅ only required columns
        attributes: [
          "id",
          "tId",
          "checkoutdate",
          "checkouttime",
          "status",
          "remarks",
        ],

        include: [
          {
            model: db.OriginDestination,
            as: "checkpostLocation",
            attributes: ["id", "location"],
          },
          {
            model: db.Trip,
            as: "trip",
            attributes: ["date", "convoyTime"], // ✅ limit fields
            include: [
              {
                model: db.Vehicle,
                as: "vehicle",
                attributes: ["vNum", "vCat"],
              },
              {
                model: db.Driver,
                as: "driver",
                attributes: ["dFirstName", "dLastName"],
              },
            ],
          },
          {
            model: db.ApproveTrip,
            as: "approveTrip",
            required: !!approveWhere,
            where: approveWhere,
            attributes: [
              "id",
              "tId",
              "arrdate",
              "arrtime",
              "remarks",
              "astatus",
            ],
            include: [
              {
                model: db.TConvey,
                as: "convey",
                attributes: ["convey_time", "convey_name"], // ✅ only needed
              },
            ],
          },
        ],

        order: [["id", "DESC"]],
        raw: false, // keep nested structure
      });

      // ✅ faster + cleaner mapping
      const formatted = checkOutTrips.map((trip) => {
        const t = trip.trip || {};
        const vehicle = t.vehicle;
        const driver = t.driver;
        const approve = trip.approveTrip;

        return {
          id: trip.id,
          tId: trip.tId,
          checkoutdate: trip.checkoutdate,
          checkouttime: trip.checkouttime,
          status: trip.status,
          remarks: trip.remarks,

          tripdate: t.date || "-",
          tripid: t.convoyTime || "-",

          vehicle: vehicle ? `${vehicle.vNum} (${vehicle.vCat || "-"})` : "-",

          driverName: driver ? `${driver.dFirstName} ${driver.dLastName}` : "-",

          checkpostDetails: trip.checkpostLocation
            ? {
                id: trip.checkpostLocation.id,
                location: trip.checkpostLocation.location,
                checkoutdate: trip.checkoutdate,
                checkouttime: trip.checkouttime,
              }
            : null,

          approveDetails: approve
            ? {
                id: approve.id,
                tId: approve.tId,
                arrdate: approve.arrdate,
                arrtime: approve.arrtime,
                remarks: approve.remarks,
                astatus: approve.astatus,
                convey: approve.convey
                  ? {
                      convey_time: approve.convey.convey_time,
                      convey_name: approve.convey.convey_name,
                    }
                  : null,
              }
            : null,
        };
      });

      return {
        message: "Checkout report loaded successfully",
        data: formatted,
      };
    } catch (error) {
      console.error("Error loading checkout report:", error);
      throw new Error("Failed to load checkout report");
    }
  }
}

module.exports = AuthService;
