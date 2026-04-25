const db = require("../models"); // make sure index.js in /models returns db with initialized models
const User = db.User;
const Registration = db.Registration;

const JWTConfig = require("../config/jwt");
const LoginRequestDTO = require("../dto/request/LoginRequestDTO");
const RegisterRequestDTO = require("../dto/request/RegisterRequestDTO");
const AuthResponseDTO = require("../dto/response/AuthResponseDTO");
const RegistrationDtoV1 = require("../dto/request/RegistrationDtoV1");
const VehicleDto = require("../dto/request/VehicleRequestDTO_V1");
const DriverRequestDTO_V1 = require("../dto/request/DriverRequestDTO_V1");
const TripRequestDTO = require("../dto/request/TripRequestDTO");
const DriverStatusRequestDTO = require("../dto/request/DriverStatusRequestDTO");
const VehicleStatusRequestDTO = require("../dto/request/VehicleStatusRequestDTO");
const VehicleStatusResponseDTO = require("../dto/response/VehicleStatusResponseDTO");
const LoginResponseDTO = require("../dto/response/LoginResponseDTO");
const VehicleRequestDTO = require("../dto/request/VehicleRequestDTO_V1");
const PoliceRegistrationDto = require("../dto/request/PoliceRegistrationDto");
const PoliceLoginRequestDTO = require("../dto/request/PoliceLoginRequestDTO");
const PoliceLoginResponseDTO = require("../dto/response/PoliceLoginResponseDTO");
const AdminLoginRequestDTO = require("../dto/request/AdminLoginRequestDTO");

const Driver = db.Driver;
const { v4: uuidv4 } = require("uuid");
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
  // static async login(loginData) {
  //   const loginDTO = new LoginRequestDTO(loginData);
  //   const validation = loginDTO.validate();

  //   if (!validation.isValid) {
  //     throw new Error(validation.errors.join(", "));
  //   }

  //   const user = await User.findOne({
  //     where: { email: loginDTO.email, isActive: 1 },
  //     include: [
  //       {
  //         model: Registration,
  //         as: "registration",
  //         attributes: ["firstName", "lastName", "isOrg", "orgName"],
  //       },
  //     ],
  //   });

  //   if (!user || !(await user.validatePassword(loginDTO.password))) {
  //     throw new Error("Invalid credentials");
  //   }

  //   // Update last login
  //   user.lastLoginAt = new Date();

  //   // Generate tokens
  //   const accessToken = JWTConfig.generateAccessToken({
  //     userId: user.id,
  //     email: user.email,
  //     //name: user.name, // Assuming you have a name field in User model
  //     role: user.role,
  //   });

  //   const refreshToken = JWTConfig.generateRefreshToken({
  //     userId: user.id,
  //   });

  //   // Store refresh token
  //   user.refreshToken = refreshToken;
  //   await user.save();
  //   // console.log("Authuser", user.registration);

  //   return new LoginResponseDTO(user, accessToken, refreshToken);
  // }

  // static async login(loginData) {
  //   const loginDTO = new LoginRequestDTO(loginData);
  //   const validation = loginDTO.validate();

  //   if (!validation.isValid) {
  //     throw new Error(validation.errors.join(", "));
  //   }

  //   const user = await User.findOne({
  //     where: { email: loginDTO.email, isActive: 1 },
  //     include: [
  //       {
  //         model: Registration,
  //         as: "registration",
  //         attributes: ["firstName", "lastName", "isOrg", "orgName"],
  //       },
  //     ],
  //   });

  //   if (!user || !(await user.validatePassword(loginDTO.password))) {
  //     throw new Error("Invalid credentials");
  //   }

  //   // Update last login
  //   user.lastLoginAt = new Date();

  //   // Generate tokens
  //   const accessToken = JWTConfig.generateAccessToken({
  //     userId: user.id,
  //     email: user.email,
  //     //name: user.name, // Assuming you have a name field in User model
  //     role: user.role,
  //   });

  //   const refreshToken = JWTConfig.generateRefreshToken({
  //     userId: user.id,
  //   });

  //   // Store refresh token
  //   user.refreshToken = refreshToken;
  //   await user.save();
  //   // console.log("Authuser", user.registration);

  //   return new LoginResponseDTO(user, accessToken, refreshToken);
  // }

  static async login(loginData, req) {
    const userCaptcha = String(loginData.captcha || "").trim();
    const sessionCaptcha = String(req.session.captcha || "").trim();

    console.log("LOGIN SESSION ID:", req.sessionID);
    console.log("SESSION CAPTCHA:", req.session.captcha);
    console.log("USER CAPTCHA:", loginData.captcha);

    if (!userCaptcha || !sessionCaptcha || userCaptcha !== sessionCaptcha) {
      throw new Error("Invalid captcha");
    }

    req.session.captcha = null;

    const loginDTO = new LoginRequestDTO(loginData);
    const validation = loginDTO.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const user = await User.findOne({
      where: { email: loginDTO.email, isActive: 1 },
      include: [
        {
          model: Registration,
          as: "registration",
          attributes: ["firstName", "lastName", "isOrg", "orgName"],
        },
      ],
    });

    if (!user || !(await user.validatePassword(loginDTO.password))) {
      throw new Error("Invalid credentials");
    }

    user.lastLoginAt = new Date();

    const accessToken = JWTConfig.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = JWTConfig.generateRefreshToken({
      userId: user.id,
    });

    user.refreshToken = refreshToken;
    await user.save();

    return new LoginResponseDTO(user, accessToken, refreshToken);
  }

  static async register(registerData) {
    const registerDTO = new RegisterRequestDTO(registerData);
    const validation = registerDTO.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: registerDTO.email },
    });

    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Create user
    const user = await User.create({
      email: registerDTO.email,
      password: registerDTO.password,
      firstName: registerDTO.firstName,
      lastName: registerDTO.lastName,
    });
    console.log("User created:", user);
    // Generate tokens
    const accessToken = JWTConfig.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = JWTConfig.generateRefreshToken({
      userId: user.id,
    });

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return new AuthResponseDTO(user, accessToken, refreshToken);
  }

  // REGISTER NEW
  static async registerNew(registerData) {
    console.log("Registering new user with data:", registerData);
    const registerDTO = new RegistrationDtoV1(registerData);

    const validation = registerDTO.validate();
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: registerDTO.email },
    });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Create user
    const user = await User.create({
      email: registerDTO.email,
      password: registerDTO.password,
      firstName: registerDTO.firstName,
      lastName: registerDTO.lastName,
      role: "user",
      isActive: 0,
    });

    // Generate unique registration ID
    //const randomString = Math.random().toString(36).substr(2, 8).toUpperCase();

    const reg_id = `REG_${uuidv4()
      .replace(/-/g, "")
      .substring(0, 8)
      .toUpperCase()}`;
    // Create registration record
    const registration = await Registration.create({
      reg_id,
      userId: user.id,
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
    });

    // ✅ Generate OTP (6 digits)
    const otpCode = 111111;

    // Save OTP in otp table
    await Otp.create({
      otp: otpCode,
      regid: reg_id,
      userid: user.id,
      status: 0, // 1 = used
    });

    // Generate JWT tokens
    const accessToken = JWTConfig.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = JWTConfig.generateRefreshToken({
      userId: user.id,
    });

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    await registration.reload({
      include: [
        {
          model: User,
          as: "user", // must match alias in association
        },
      ],
    });

    // Optionally send OTP via SMS or Email here

    return {
      auth: new AuthResponseDTO(registration, accessToken, refreshToken),
      otp: otpCode, // you might hide this in prod
    };
  }

  static async refreshToken(token) {
    if (!token) {
      throw new Error("Refresh token required");
    }

    const decoded = JWTConfig.verifyRefreshToken(token);

    const user = await User.findOne({
      where: {
        id: decoded.userId,
        refreshToken: token,
        isActive: true,
      },
    });

    if (!user) {
      throw new Error("Invalid refresh token");
    }

    // Generate new tokens
    const accessToken = JWTConfig.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = JWTConfig.generateRefreshToken({
      userId: user.id,
    });

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return new AuthResponseDTO(user, accessToken, newRefreshToken);
  }

  static async logout(userId) {
    await User.update({ refreshToken: null }, { where: { id: userId } });
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
    const regIdObj = await Registration.findOne({
      where: { userId: userId },
      attributes: ["reg_id"],
    });

    if (!regIdObj) {
      throw new Error("Registration not found for user");
    }

    const reg_id = regIdObj.get("reg_id");
    console.log("Registration ID:", reg_id);

    const vehicleDTO = new VehicleRequestDTO(registerData);
    const validation = vehicleDTO.validate();

    if (!validation.isValid) {
      // Stop execution immediately
      return {
        success: false,
        errors: validation.errors,
      };
    }

    console.log("Vehicle data:", vehicleDTO);

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

    console.log("New vehicle created:", newVehicle);

    // Add vehicle status after vehicle creation
    const vehicleStatus = await db.VehicleStatus.create({
      vId: newVehicle.vId,
      reg_id: reg_id,
      start_date: new Date(), // Default to current date
      end_date: null, // Default to null
    });

    console.log("Vehicle status created:", vehicleStatus);

    return {
      success: true,
      vehicle: newVehicle,
      status: vehicleStatus,
    };
  }

  static async driverstatus(registerData, user) {
    const registerDTO = new DriverStatusRequestDTO(registerData);
    const validation = registerDTO.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // Extract fields
    const { reg_id, d_id, Phone_no, Status } = registerDTO;

    const errors = [];

    // Field validation
    if (!reg_id) errors.push("Registration ID (reg_id) is required");
    if (!d_id) errors.push("Driver ID (d_id) is required");
    if (!Phone_no || !/^[6-9]\d{9}$/.test(Phone_no)) {
      errors.push("Valid Phone number is required");
    }

    const allowedStatuses = ["Active", "Inactive"];
    if (!allowedStatuses.includes(Status)) {
      errors.push(`Status must be one of: ${allowedStatuses.join(", ")}`);
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    // Create entry in driver_status_tbl
    const DriverStatus = db.DriverStatus; // Assuming model is named like this

    const createdStatus = await DriverStatus.create({
      reg_id,
      d_id,
      Phone_no,
      Status,
    });

    // Optional: associate with user
    console.log("Driver status registered by user:", user?.id);

    // Return DTO or raw object
    return createdStatus; // Or wrap with response DTO if needed
  }

  //===========================vehicle status registration=============

  static async vehiclestatus(data) {
    const dto = new VehicleStatusRequestDTO(data);
    const validation = dto.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const { reg_id, start_date, end_date, status } = dto;

    try {
      const VehicleStatus = db.VehicleStatus;

      const createdStatus = await VehicleStatus.create({
        //v_id,
        reg_id,
        start_date,
        end_date,
        status,
      });

      return new VehicleStatusResponseDTO(createdStatus);
    } catch (err) {
      console.error(
        "Error in VehicleStatusService.registerVehicleStatus:",
        err,
      );
      throw new Error("Failed to create vehicle status record");
    }
  }

  static async getAllStatuses() {
    try {
      const VehicleStatus = db.VehicleStatus;
      const allStatuses = await VehicleStatus.findAll();
      return allStatuses.map((status) => new VehicleStatusResponseDTO(status));
    } catch (err) {
      console.error("Error in VehicleStatusService.getAllStatuses:", err);
      throw new Error("Failed to fetch vehicle status records");
    }
  }

  static async getByMobilenumber(mobileNumber) {
    console.log("Fetching driver by mobile number:", mobileNumber);
    if (!mobileNumber) {
      throw new Error("Mobile number is required");
    }

    const driver = await Driver.findOne({
      include: [
        {
          model: DriverStatus,
          where: { Phone_no: mobileNumber },
          required: true,
        },
      ],
    });

    if (!driver) {
      throw new Error("No driver found with this mobile number");
    }

    return driver;
  }

  static async getByLicense(license) {
    if (!license) {
      throw new Error("License number is required");
    }

    const driver = await Driver.findOne({
      where: { license_no: license },
      include: [
        {
          model: DriverStatus,
          required: false,
        },
      ],
    });

    if (!driver) {
      throw new Error("No driver found with this license number");
    }

    return driver;
  }
  //----------------------------------

  // =============get_driver_list_by_regId========================
  static async getDriveListbyRegId(registerData, id) {
    console.log("Registering new driver with data:", registerData);
    // const registerDTO = new DriverRequestDTO_V1(registerData);

    // const validation = registerDTO.validate();

    // if (!validation.isValid) {

    //   throw new Error(validation.errors.join(', '));
    // }

    let regIdObj = await Registration.findOne({
      where: { userId: id },
      attributes: ["reg_id"],
    });
    let reg_id = regIdObj ? regIdObj.get("reg_id") : null;

    console.log("Registration ID found:", reg_id);
    const drivers = await db.Driver.findAll({
      where: {
        dStatus: "active", // <-- Added this condition
      },
      include: [
        {
          model: db.DriverStatus,
          as: "sts",
          attributes: ["reg_id", "phNo"],
          where: {
            reg_id: reg_id, // 🔍 Filter by this registration ID
          },
        },
      ],
      attributes: ["dId", "dFirstName", "dLastName", "licenseNo", "title"],
    });

    return {
      message: "Driver List Loaded successfully",
      driver: drivers,
    };
  }

  // =============get_Vehicle_list_by_regId========================
  static async getVehicleListbyRegId(registerData, id) {
    try {
      // 🔍 Fetch registration ID for given user
      const regIdObj = await Registration.findOne({
        where: { userId: id },
        attributes: ["reg_id"],
      });

      const reg_id = regIdObj ? regIdObj.get("reg_id") : null;
      console.log("Registration ID found:", reg_id);

      if (!reg_id) {
        return {
          success: false,
          message: "No registration ID found for this user",
          vehicle: [],
        };
      }

      // ✅ Fetch only active vehicles (status = 1)
      const vehicles = await db.Vehicle.findAll({
        include: [
          {
            model: db.VehicleStatus,
            as: "sts",
            attributes: ["reg_id"],
            where: { reg_id }, // Filter by registration ID
          },
        ],
        where: {
          status: 1, // ✅ Only active vehicles
        },
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
      });

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

  // =============create_new_trip========================
  static async newtrip(tripData, id) {
    let createdPassengers;
    let tripWithConvey;
    let returnTrip = null;

    console.log("Creating new trip with data:", tripData);

    // 🔐 Declaration enforcement
    if (tripData.declarationAccepted !== true) {
      throw new Error("Declaration not accepted. Trip submission denied.");
    }

    const tripDTO = new TripRequestDTO(tripData);
    const validation = tripDTO.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // ===== Get registration ID =====
    let regIdObj = await Registration.findOne({
      where: { userId: id },
      attributes: ["reg_id"],
    });
    let reg_id = regIdObj ? regIdObj.get("reg_id") : null;

    // ===== Generate forward tId =====
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
    const base36Value = BigInt(combined).toString(36).toUpperCase();
    const tId = base36Value;

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
      // 🔁 Generate return tId
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
      const returnTId = BigInt(combined).toString(36).toUpperCase();

      let passengersForReturn;

      // ✅ SAME passengers
      if (!tripDTO.returnType || tripDTO.returnType === "same") {
        passengersForReturn = createdPassengers;
      } else {
        // 🔁 DIFFERENT passengers
        const returnPassengersSource =
          tripDTO.returnPassengers?.length > 0
            ? tripDTO.returnPassengers
            : tripDTO.Passengers;

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
          })),
        );
      }

      // 🔁 Create return trip
      returnTrip = await db.Trip.create({
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
    }

    // ===== FINAL RESPONSE =====
    return {
      message: "Trip registered successfully",
      trip: {
        ...tripWithConvey.toJSON(),
        conveyTimeName: tripWithConvey.convey?.convey_name || null,
        conveyTimeValue: tripWithConvey.convey?.convey_time || null,
      },
      returnTrip: returnTrip || null,
    };
  }

  // -------------------

  //--------------special convoy trip----------------

  static async splnewtrip(tripData, id) {
    console.log("Creating new trip with data:", tripData);
    console.log("User ID:", id);

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

    console.log("Final Convey ID:", newConveyId);

    // ===== INSERT INTO ConveyControl =====
    await db.ConveyControl.create({
      conveyid: newConveyId,
      checkpostid: Number(tripDTO.origin),
      date: tripDTO.date,
      starttime: tripDTO.convoyTime,
      closetime: tripDTO.convoyTime,
      status: 0,
    });

    // ===== GENERATE tId =====
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
    const tId = BigInt(combined).toString(36).toUpperCase();

    // ===== INSERT INTO TRIP =====
    const newTrip = await db.Trip.create({
      tId,
      reg_id,
      vId: tripDTO.vId,
      dId: tripDTO.dId,
      origin: tripDTO.origin,
      destination: tripDTO.destination,
      date: tripDTO.date,

      // 🔥 IMPORTANT: store conveyid
      convoyTime: newConveyId,

      isTourist: tripDTO.isTourist,
      status: "2",
      verifiystatus: 2,
    });

    console.log("✅ Trip Created:", newTrip.toJSON());

    // ===== AUTO APPROVAL (Special Convoy) =====
    await db.ApproveTrip.create({
      tId: newTrip.tId,
      convey_id: newConveyId,
      checkpost_id: Number(tripDTO.origin),
      remarks: "Auto-approved (Special Convoy)",
      astatus: 1, // approved
      arrdate: new Date(),
      arrtime: new Date(),
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
    console.log("Fetching trip details with data:", tripData);
    console.log("fetch trip details with data:", id);

    // Get reg_id associated with the userId
    let regIdObj = await Registration.findOne({
      where: { userId: id },
      attributes: ["reg_id"],
    });

    let reg_id = regIdObj ? regIdObj.get("reg_id") : null;
    console.log("Registration ID found:", reg_id);

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
    const { Op, fn, col, where } = require("sequelize");

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

  //----------------------

  //--------get_trip_details_by_tripId----------------
  // static async getTripDetailsbyTripId(tripData, id) {
  //   console.log("Fetching trip details with data:", tripData);

  //   const trips = await db.Trip.findOne({
  //     where: {
  //       tId: tripData.tId,
  //     },
  //     include: [
  //       {
  //         model: db.Passenger,
  //         as: "passengers",
  //         attributes: [
  //           "passengerName",
  //           "docType",
  //           "docId",
  //           "phoneNo",
  //           "gender",
  //         ],
  //       },
  //       {
  //         model: db.Driver,
  //         as: "driver",
  //         attributes: ["dFirstName", "dLastName", "licenseNo"],
  //         include: [
  //           {
  //             model: db.DriverStatus,
  //             as: "sts", // ✅ must match Driver.hasMany alias
  //             attributes: ["phNo", "Status"],
  //           },
  //         ],
  //       },
  //       {
  //         model: db.Vehicle,
  //         as: "vehicle",
  //         attributes: ["vNum", "vCat", "ownershipType"],
  //       },
  //       {
  //         model: db.OriginDestination,
  //         as: "originLocation",
  //         attributes: ["id", "location"], // ✅ include location name
  //       },
  //       {
  //         model: db.OriginDestination,
  //         as: "destinationLocation",
  //         attributes: ["id", "location"], // ✅ include location name
  //       },
  //       {
  //         model: db.TConvey,
  //         as: "convey",
  //         attributes: ["id", "convey_time", "convey_name"],
  //       },
  //     ],
  //     attributes: [
  //       "dId",
  //       "tId",
  //       "origin",
  //       "destination",
  //       "date",
  //       "convoyTime",
  //       "status",
  //     ],
  //   });

  //   return {
  //     message: "Trip details loaded successfully",
  //     trips: trips,
  //   };
  // }
  static async getTripDetailsbyTripId(tripData, id) {
    console.log("Fetching trip details with data:", tripData);

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
        "verifiedtime",
      ],
    });

    console.log("✅ Current Kolkata Date:", currentDate);
    console.log("📍 Location ID:", param?.locationid);

    return {
      message: "Trip details loaded successfully",
      trips,
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

    console.log("✅ Current Kolkata Date:", currentDate);
    console.log("📍 Location ID:", param?.locationid);

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
    approveby,
  }) {
    const transaction = await db.sequelize.transaction();

    try {
      const trip = await db.Trip.findOne({
        where: { tId },
        transaction,
      });

      if (!trip) {
        throw new Error("Trip not found");
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

      console.log("Approval status:", astatus);
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
      throw new Error(error.message || "Trip approval failed");
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
      console.log("Params received:", params);

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
      throw new Error(error.message || "Failed to fetch approved trip details");
    }
  }

  static async getallApproveTrip(params, res) {
    try {
      console.log("🟦 Incoming Parameters to getallApproveTrip:", params);

      const approveCheckpostId =
        typeof params === "object" ? params?.checkpostid?.toString() : null;
      const approveConveyId =
        typeof params === "object" ? params?.conveyid?.toString() : null;

      const { Op } = require("sequelize");
      const approveWhere = { astatus: { [Op.ne]: 0 } };

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
      console.log("Vehicle Counts:", vehicleCounts);

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

        // if (gender === "male") totalMale++;
        // if (gender === "female") totalFemale++;
        // if (typeof age === "number" && age < 12) {
        //   totalChild++;
        //   // ✅ store child details
        //   trip.childPassengers.push({
        //     name: p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
        //     age: p.age,
        //     gender: p.gender,
        //   });
        // }
        // });
      });

      console.log("👨‍🦰 Total Male:", totalMale);
      console.log("👩‍🦰 Total Female:", totalFemale);
      console.log("🧒 Total Child:", totalChild);
      console.log("🧍‍♂️ Total Passengers:", totalPassengers);

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
      throw new Error(error.message || "Failed to fetch approved trip details");
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
            model: db.Passenger,
            as: "passengers",
            attributes: ["passengerName", "docId", "phoneNo"],
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

  ///////////////Police Registration

  static async registerPolice(registerData) {
    const registerDTO = new PoliceRegistrationDto(registerData);
    const validation = registerDTO.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const existingUser = await PoliceUser.findOne({
      where: { email: registerDTO.email },
    });

    if (existingUser) {
      throw new Error("Police user already exists with this email");
    }

    const user = await PoliceUser.create({
      email: registerDTO.email,
      password: registerDTO.password,
      isActive: registerDTO.isActive,
      status: 1,
    });

    const reg_id = `POLREG_${Math.random()
      .toString(36)
      .substr(2, 8)
      .toUpperCase()}`;

    const registration = await PoliceRegistration.create({
      reg_id: reg_id,
      userId: user.id,
      title: registerDTO.title,
      firstName: registerDTO.firstName,
      lastName: registerDTO.lastName,
      designation: registerDTO.designation,
      emp_id: registerDTO.emp_id,
      checkpost: registerDTO.checkpost,
      contact: registerDTO.contact,
      status: registerDTO.status,
    });

    const accessToken = JWTConfig.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: registerDTO.role,
    });

    const refreshToken = JWTConfig.generateRefreshToken({
      userId: user.id,
    });

    user.refreshToken = refreshToken;
    await user.save();

    await registration.reload({
      include: [{ model: PoliceUser, as: "user" }],
    });

    return new AuthResponseDTO(registration, accessToken, refreshToken);
  }

  static async loginPolice(loginData, req) {
    //console.log("SESSION ID:", req.sessionID);

    console.log("req", req.session.captcha);
    const userCaptcha = String(loginData.captcha || "").trim();
    const sessionCaptcha = String(req.session.captcha || "").trim();
    console.log("User Captcha1111:", userCaptcha);
    console.log("Session Captcha11111:", sessionCaptcha);

    if (!userCaptcha || !sessionCaptcha || userCaptcha !== sessionCaptcha) {
      throw new Error("Invalid captcha");
    }

    req.session.captcha = null;
    const loginDTO = new PoliceLoginRequestDTO(loginData);
    const validation = loginDTO.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // ✅ Find police user by email
    const user = await db.PoliceUser.findOne({
      where: { email: loginDTO.email, isActive: 1 },
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

    if (!user || !(await user.validatePassword(loginDTO.password))) {
      throw new Error("Invalid credentials");
    }

    // ✅ Update last login
    user.lastLoginAt = new Date();

    // ✅ Generate tokens
    const accessToken = JWTConfig.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: "police",
    });

    const refreshToken = JWTConfig.generateRefreshToken({
      userId: user.id,
    });

    // ✅ Save token
    user.refreshToken = refreshToken;
    await user.save();
    //console.log("Police user logged in:", user);

    return new PoliceLoginResponseDTO(user, accessToken, refreshToken);
  }

  // static async conveywise(payload) {
  //   const { fn, col, where, Op } = require("sequelize");

  //   // ✅ Extract date from request body or default to today
  //   const inputDate =
  //     typeof payload === "object" && payload?.date
  //       ? payload.date
  //       : new Date().toISOString().split("T")[0];

  //   console.log("Filter date =", inputDate);

  //   // ✅ Fetch all trips for the input date where status = 2
  //   const trips = await db.Trip.findAll({
  //     where: {
  //       [Op.and]: [where(fn("DATE", col("date")), inputDate), { status: 2 }],
  //     },
  //     attributes: ["convoyTime", "vId"],
  //   });

  //   // ✅ Group by convoyTime and count ALL vId entries
  //   const convoyCounts = {};

  //   for (const trip of trips) {
  //     const { convoyTime } = trip;

  //     if (!convoyTime) continue;

  //     if (!convoyCounts[convoyTime]) {
  //       convoyCounts[convoyTime] = 0;
  //     }

  //     convoyCounts[convoyTime] += 1; // ✅ Count every trip, even if same vId
  //   }

  //   return {
  //     message: `Vehicle count by convoy time for ${inputDate}`,
  //     vehicleCountByConvoyTime: convoyCounts,
  //   };
  // }

  static async loginAdmin(loginData, req) {
    console.log("🔹 Admin login request received:", loginData);

    const userCaptcha = String(loginData.captcha || "").trim();
    const sessionCaptcha = String(req.session.captcha || "").trim();

    console.log("🔹 User captcha:", userCaptcha);
    console.log("🔹 Session captcha:", sessionCaptcha);

    if (!userCaptcha || !sessionCaptcha || userCaptcha !== sessionCaptcha) {
      throw new Error("Invalid captcha");
    }

    // Prevent captcha reuse
    req.session.captcha = null;
    console.log("✅ Captcha validated");

    const loginDTO = new AdminLoginRequestDTO(loginData);
    const validation = loginDTO.validate();

    console.log("🔹 DTO validation:", validation);

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    console.log("🔍 Searching admin with userid:", loginDTO.userid);

    // Find admin
    const admin = await db.Admin.findOne({
      where: {
        userid: loginDTO.userid,
        isActive: 1,
      },
    });

    console.log("🔹 Admin found:", admin ? admin.userid : "NOT FOUND");

    if (!admin) {
      console.error("❌ Admin not found or inactive");
      throw new Error("Invalid credentials");
    }

    const passwordOk = await admin.validatePassword(loginDTO.password);
    console.log("🔹 Password valid:", passwordOk);

    if (!passwordOk) {
      console.error("❌ Wrong password");
      throw new Error("Invalid credentials");
    }

    console.log("🔹 Admin role:", admin.role, "isadmin:", admin.isadmin);

    if (admin.role !== "admin" && admin.isadmin !== 1) {
      console.error("❌ Not an admin account");
      throw new Error("Unauthorized admin access");
    }

    // Update last login
    admin.lastLoginAt = new Date();

    console.log("🔑 Generating tokens...");

    const accessToken = JWTConfig.generateAccessToken({
      userId: admin.id,
      userid: admin.userid,
      role: "admin",
    });

    const refreshToken = JWTConfig.generateRefreshToken({
      userId: admin.id,
    });

    console.log("🔹 Access Token:", accessToken);
    console.log("🔹 Refresh Token:", refreshToken);

    // Store refresh token
    admin.refreshToken = refreshToken;
    await admin.save();

    console.log("✅ Admin login successful:", admin.userid);

    const response = {
      user: {
        id: admin.id,
        email: admin.userid,
        role: "admin",
        usertype: "admin",
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };

    console.log("📦 Admin login response:", response);

    return response;
  }

  static async conveywise(payload) {
    const { fn, col, where, Op } = require("sequelize");

    // ✅ Extract date from payload or use today's date (YYYY-MM-DD)
    const inputDate =
      typeof payload === "object" && payload?.date
        ? payload.date
        : new Date().toISOString().split("T")[0];

    console.log("Filter date =", inputDate);

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

  static async verifyCitizenOtp({ email, otp }) {
    try {
      console.log("Received OTP verification request:", { email, otp });

      // Find user by email (get id)
      const user = await db.User.findOne({
        where: { email },
        attributes: ["id", "isActive"],
      });
      if (!user) throw new Error("User not found");
      console.log("User found:", user);

      // Find latest OTP record by user id
      const otpRecord = await db.Otp.findOne({
        where: { userid: user.id },
        order: [["datetime", "DESC"]],
      });
      if (!otpRecord) throw new Error("OTP record not found");
      console.log("OTP record found:", otpRecord);

      // Compare OTP values
      if (otpRecord.otp !== Number(otp)) {
        throw new Error("Invalid OTP");
      }

      // Update otp status to 1
      await otpRecord.update({ status: 1 });

      // Update registration status = 1 for this user
      await db.Registration.update(
        { status: 1 },
        { where: { userId: user.id } },
      );

      // Update user isActive = 1
      await user.update({ isActive: 1 });

      return { success: true, message: "OTP verified and user activated" };
    } catch (error) {
      console.error("Error in verifyCitizenOtp:", error.message);
      throw error;
    }
  }

  // AuthService
  static async adminlogin(loginData) {
    const { userid, password } = loginData;
    console.log("Admin login attempt with data:", loginData);

    if (!userid || !password) {
      return { success: false, message: "User ID and password are required" };
    }

    const adminRecord = await Admin.findOne({
      where: { userid, isActive: 1 },
    });

    if (!adminRecord) {
      return { success: false, message: "Invalid credentials" };
    }

    console.log("Stored password in DB:", adminRecord.password);
    console.log("Entered password:", password);

    if (password !== adminRecord.password) {
      return { success: false, message: "Invalid credentials" };
    }

    adminRecord.lastLoginAt = new Date();

    const accessToken = JWTConfig.generateAccessToken({
      userId: adminRecord.id,
      userid: adminRecord.userid,
      role: adminRecord.role,
    });

    const refreshToken = JWTConfig.generateRefreshToken({
      userId: adminRecord.id,
    });

    adminRecord.refreshToken = refreshToken;
    await adminRecord.save();

    return {
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      admin: {
        id: adminRecord.id,
        userid: adminRecord.userid,
        role: adminRecord.role,
      },
    };
  }
  static async getConveyDetails(checkpostid) {
    try {
      console.log("Fetching convey details with payload:", checkpostid);

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
    console.log("Fetching trip details with data:", tripData);

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
          console.log(
            "⚠️ Convey already active today:",
            existingConvoy.toJSON(),
          );
          return {
            success: false,
            message: "Convey already started today at this checkpost",
            data: existingConvoy,
          };
        } else if (existingConvoy.status === 0) {
          console.log(
            "⚠️ Convey was already started & closed today:",
            existingConvoy.toJSON(),
          );
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

      console.log("✅ New convoy created:", newConvoy.toJSON());

      return {
        success: true,
        message: "Convey started successfully",
        data: newConvoy,
      };
    } catch (error) {
      console.error("❌ Error starting convoy:", error);
      return {
        success: false,
        message: "Error starting convoy",
        error: error.message,
      };
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
      console.log("selected date", date);

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

      console.log("✅ Convey stopped:", existingConvoy.toJSON());

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
          arrdate: today,
          convey_id: {
            [Op.gte]: 100,
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
  ////new fetch checkout trip and update approve trip status

  // static async getCheckOutTrip(checkpostId) {
  //   try {
  //     // ================= DATE (IST) =================
  //     const kolkata = new Date().toLocaleString("en-US", {
  //       timeZone: "Asia/Kolkata",
  //     });
  //     const dateObj = new Date(kolkata);

  //     const today = `${dateObj.getFullYear()}-${String(
  //       dateObj.getMonth() + 1,
  //     ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

  //     // ================= FLIP CHECKPOST =================
  //     let targetCheckpostId = checkpostId;
  //     if (checkpostId == 1) targetCheckpostId = 2;
  //     else if (checkpostId == 2) targetCheckpostId = 1;

  //     // ================= FETCH APPROVED TRIPS =================
  //     const approvedTrips = await db.ApproveTrip.findAll({
  //       where: {
  //         checkpost_id: targetCheckpostId,
  //         astatus: 1, // ✅ approved only
  //         arrdate: today, // ✅ today's trips
  //       },
  //       include: [
  //         {
  //           model: db.Trip,
  //           as: "trip",
  //           include: [
  //             {
  //               model: db.Driver,
  //               as: "driver",
  //               attributes: ["dFirstName", "dLastName"],
  //             },
  //             {
  //               model: db.Vehicle,
  //               as: "vehicle",
  //               attributes: ["vNum"],
  //             },
  //             {
  //               model: db.Passenger,
  //               as: "passengers",
  //               attributes: ["pId"],
  //               through: { attributes: [], where: { status: 1 } },
  //             },
  //             {
  //               model: db.OriginDestination,
  //               as: "originLocation",
  //               attributes: ["id", "location"],
  //             },
  //             {
  //               model: db.OriginDestination,
  //               as: "destinationLocation",
  //               attributes: ["id", "location"],
  //             },
  //           ],
  //         },
  //         {
  //           model: db.TConvey,
  //           as: "convey",
  //           attributes: ["id", "convey_name", "convey_time"],
  //         },
  //         {
  //           model: db.PoliceRegistration,
  //           as: "approverOfficer",
  //           attributes: ["title", "firstName", "lastName", "designation"],
  //         },
  //       ],
  //       order: [["id", "ASC"]],
  //     });

  //     // ❌ NO TRIPS FOUND
  //     if (!approvedTrips.length) {
  //       return {
  //         success: true,
  //         message: `No approved trips found for today (checkpost ${targetCheckpostId})`,
  //         data: [],
  //         timestamp: new Date().toISOString(),
  //       };
  //     }

  //     // ================= FORMAT RESPONSE =================
  //     const formattedTrips = approvedTrips.map((trip) => {
  //       const officer = trip.approverOfficer;

  //       return {
  //         trip_id: trip.tId,
  //         origin_name: trip.trip?.originLocation?.location || null,
  //         destination_name: trip.trip?.destinationLocation?.location || null,
  //         vehicle_number: trip.trip?.vehicle?.vNum || null,
  //         date: trip.trip?.date || null,

  //         total_passengers: trip.trip?.passengers?.length || 0,

  //         driver_name: trip.trip?.driver
  //           ? `${trip.trip.driver.dFirstName} ${trip.trip.driver.dLastName}`
  //           : null,

  //         arr_time: trip.arrtime,
  //         checkpost_id: trip.checkpost_id,

  //         convey_name: trip.convey?.convey_name || null,
  //         convey_time: trip.convey?.convey_time || null,

  //         approved_by: officer
  //           ? `${officer.title ? officer.title + " " : ""}${
  //               officer.firstName
  //             } ${officer.lastName}`
  //           : null,

  //         approver_designation: officer?.designation || null,
  //       };
  //     });

  //     return {
  //       success: true,
  //       message: `Approved trips fetched for today (checkpost ${targetCheckpostId})`,
  //       data: formattedTrips,
  //       timestamp: new Date().toISOString(),
  //     };
  //   } catch (error) {
  //     console.error("Error fetching checkout trips:", error);
  //     return {
  //       success: false,
  //       message: "Failed to fetch checkout trips",
  //       error: error.message,
  //       timestamp: new Date().toISOString(),
  //     };
  //   }
  // }

  // AuthService.js

  static async updateCheckOutTrip(data) {
    try {
      // 1. Validation
      console.log("Updating checkout trip with data:", data);

      if (!data.tId || !data.checkpostId) {
        return {
          success: false,
          message: "tId and checkpostId are required to insert checkout trip.",
        };
      }

      // 2. Get today's date and current time
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const now = new Date();
      const currentTime = now.toTimeString().split(" ")[0]; // HH:mm:ss

      // 3. Insert into checkout_trip
      const newCheckout = await db.CheckoutTrip.create({
        tId: data.tId,
        checkpostid: data.checkpostId,
        checkoutdate: today,
        checkouttime: currentTime,
        status: data.status, // default 0 if not provided
        remarks: data.remarks || null,
        conveyid: data.runningConveyId || null,
      });

      console.log("✅ New checkout trip created:", newCheckout.toJSON());

      // 4. Update approve_trip -> set astatus = 3
      const [rowsUpdated] = await db.ApproveTrip.update(
        { astatus: 2 },
        {
          where: { tId: data.tId },
        },
      );

      if (rowsUpdated > 0) {
        console.log(`✅ ApproveTrip updated for tId=${data.tId}`);
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
      return {
        success: false,
        message: "Error updating checkout trip",
        error: error.message,
      };
    }
  }

  static async getProfileByUserId(userId) {
    try {
      console.log("Fetching profile for userId:", userId);
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
      console.log("Fetching Police profile for userId:", userId);

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
      console.log("recoedddd", record);

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
  // AuthService.js

  // AuthService.js
  // static async editTripDetailsByTripId(tripId) {
  //   try {
  //     console.log("Fetching Trip details for tripId:", tripId);

  //     const trip = await db.Trip.findOne({
  //       where: { tId: tripId },
  //       include: [
  //         {
  //           model: db.Passenger,
  //           as: "passengers",
  //           through: { attributes: [] },
  //           attributes: [
  //             "pId",
  //             "passengerName",
  //             "phoneNo",
  //             "age",
  //             "gender",
  //             "docType",
  //             "docId",
  //           ],
  //           through: {
  //             attributes: [], // hide junction fields
  //             where: { status: 1 }, // ✅ only passengers with status = 1
  //           },
  //         },
  //       ],
  //     });
  //     //console.log("rawwwwww", trip);

  //     if (!trip) {
  //       return {
  //         success: true,
  //         message: "No trip found for this tripId",
  //         timestamp: new Date().toISOString(),
  //         selecteddata: {
  //           success: true,
  //           message: "No trip found for this tripId",
  //           data: null,
  //         },
  //         availabledata: {},
  //       };
  //     }

  //     // 🔹 Selected Trip Data
  //     const cleanData = {
  //       tId: trip.tId,
  //       reg_id: trip.reg_id,
  //       vId: trip.vId,
  //       dId: trip.dId,
  //       origin: trip.origin,
  //       destination: trip.destination,
  //       date: trip.date,
  //       conveytime: trip.convoyTime,
  //       status: trip.status,
  //       isTourist: trip.isTourist,
  //       entrydatetime: trip.entrydatetime,
  //       updatedate: trip.updatedate,
  //       passengers: trip.passengers
  //         ? trip.passengers.map((p) => ({
  //             pId: p.pId,
  //             passengerName: p.passengerName,
  //             phoneNo: p.phoneNo,
  //             age: p.age,
  //             gender: p.gender,
  //             docType: p.docType,
  //             docId: p.docId,
  //           }))
  //         : [],
  //     };
  //     console.log("Clean Trip Data:", cleanData);

  //     const reg_id = trip.reg_id; // ✅ use this for filtering

  //     // 🔹 All available drivers for this reg_id
  //     const drivers = await db.Driver.findAll({
  //       include: [
  //         {
  //           model: db.DriverStatus,
  //           as: "sts",
  //           attributes: ["reg_id", "phNo"],
  //           where: { reg_id },
  //         },
  //       ],
  //       attributes: ["dId", "dFirstName", "dLastName", "licenseNo", "title"],
  //     });

  //     // 🔹 All available vehicles for this reg_id
  //     const vehicles = await db.Vehicle.findAll({
  //       include: [
  //         {
  //           model: db.VehicleStatus,
  //           as: "sts",
  //           attributes: ["reg_id"],
  //           where: { reg_id },
  //         },
  //       ],
  //       attributes: [
  //         "vId",
  //         "vNum",
  //         "vOwnName",
  //         "vCat",
  //         "otherCat",
  //         "ownershipType",
  //         "deptName",
  //         "vPurpose",
  //         "otherPurpose",
  //       ],
  //       order: [["vId", "DESC"]],
  //     });

  //     return {
  //       success: true,
  //       message: "Trip details updated successfully",
  //       timestamp: new Date().toISOString(),
  //       selecteddata: {
  //         success: true,
  //         message: "Trip details loaded successfully",
  //         data: cleanData,
  //       },
  //       availabledata: {
  //         drivers: {
  //           message: "Driver List Loaded successfully",
  //           driver: drivers,
  //         },
  //         vehicles: {
  //           message: "Vehicle List Loaded successfully",
  //           vehicle: vehicles,
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     console.error("Error in editTripDetailsByTripId service:", error);
  //     return {
  //       success: false,
  //       message: "Failed to fetch trip details",
  //       error: error.message,
  //       timestamp: new Date().toISOString(),
  //     };
  //   }
  // }
  // static async updateTripPolice(tripDataArray) {
  //   try {
  //     for (const item of tripDataArray) {
  //       const { payload } = item;
  //       if (!payload) continue;

  //       const { action, tId, pId, data } = payload;

  //       // ✅ Case 1: Trip update
  //       if (action === "updateTrip") {
  //         console.log("🛠️ updateTrip action detected");

  //         await Trip.update(
  //           {
  //             vId: data.vId,
  //             dId: data.dId,
  //             origin: data.origin,
  //             destination: data.destination,
  //             date: data.date,
  //             convoyTime: data.convoyTime,
  //           },
  //           { where: { tId } },
  //         );
  //       }
  //       // ✅ Case 2: Update Passenger
  //       else if (action === "updatePassenger") {
  //         console.log("✏️ updatePassenger action detected");
  //         await tripRelation.update({ status: 0 }, { where: { tId, pId } });

  //         const newPassenger = await Passenger.create({
  //           passengerName: data.name || data.passengerName,
  //           phoneNo: data.phone || data.phoneNo,
  //           age: data.age,
  //           gender: data.gender,
  //           docType: data.documentType || data.docType,
  //           docId: data.documentId || data.docId,
  //         });

  //         await tripRelation.create({
  //           tId: tId,
  //           pId: newPassenger.pId,
  //           status: 1,
  //         });
  //       }
  //       // ✅ Case 3: Add Passenger
  //       else if (action === "addPassenger") {
  //         console.log("🆕 addPassenger action detected");
  //         const newPassenger = await Passenger.create({
  //           passengerName: data.name || data.passengerName,
  //           phoneNo: data.phone || data.phoneNo,
  //           age: data.age,
  //           gender: data.gender,
  //           docType: data.documentType || data.docType,
  //           docId: data.documentId || data.docId,
  //         });

  //         await tripRelation.create({
  //           tId: tId,
  //           pId: newPassenger.pId,
  //           status: 1,
  //         });
  //       }
  //       // ✅ Case 4: Delete Passenger
  //       else if (action === "deletePassenger") {
  //         console.log("🗑️ deletePassenger action detected");
  //         await tripRelation.update({ status: 0 }, { where: { tId, pId } });
  //       }
  //     }

  //     return { success: true, message: "All payloads processed successfully" };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: "Failed to process tripData",
  //       error: error.message,
  //     };
  //   }
  // }

  static async editTripDetailsByTripId(tripId) {
    try {
      console.log("Fetching Trip details for tripId:", tripId);

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
        })),
      };

      console.log("Clean Trip Data:", cleanData);

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
    try {
      // 🔁 helper to normalize frontend payload (PascalCase / camelCase safe)
      const normalizePassengerData = (data = {}) => ({
        passengerName:
          data.name || data.passengerName || data.PassengerName || null,

        fatherName: data.fatherName || data.FatherName || null,

        phoneNo: data.phone || data.phoneNo || data.PhoneNo || null,

        age: data.age || data.Age || null,

        gender: data.gender || data.Gender || null,

        isForeigner: data.isForeigner === 1 ? 1 : 0,

        docType: data.docType || data.documentType || data.DocumentType || null,

        docId: data.docId || data.documentId || data.DocumentId || null,

        nationality: data.nationality || data.Nationality || null,

        visaNumber: data.visaNumber || data.VisaNo || null,

        residence: data.residence || data.Residence || null,
      });

      for (const item of tripDataArray) {
        const { payload } = item;
        if (!payload) continue;

        const { action, tId, pId, data } = payload;

        /* ============================
         CASE 1: UPDATE TRIP
      ============================ */
        if (action === "updateTrip") {
          console.log("🛠️ updateTrip action detected");

          await Trip.update(
            {
              vId: data.vId,
              dId: data.dId,
              origin: data.origin,
              destination: data.destination,
              date: data.date,
              convoyTime: data.convoyTime,

              // ✅ tourist flag fix
              isTourist: data.isTourist ?? undefined,
            },
            { where: { tId } },
          );
        } else if (action === "updatePassenger") {
          /* ============================
         CASE 2: UPDATE PASSENGER
      ============================ */
          console.log("✏️ updatePassenger action detected");

          // soft-disable old passenger relation
          await tripRelation.update({ status: 0 }, { where: { tId, pId } });

          const pdata = normalizePassengerData(data);

          const newPassenger = await Passenger.create({
            passengerName: pdata.passengerName,
            fatherName: pdata.fatherName,
            phoneNo: pdata.phoneNo,
            age: pdata.age,
            gender: pdata.gender,
            isForeigner: pdata.isForeigner,
            docType: pdata.docType,
            docId: pdata.docId,
            nationality: pdata.isForeigner ? pdata.nationality : null,
            visaNumber: pdata.isForeigner ? pdata.visaNumber : null,
            residence: pdata.residence,
          });

          await tripRelation.create({
            tId,
            pId: newPassenger.pId,
            status: 1,
          });
        } else if (action === "addPassenger") {
          /* ============================
         CASE 3: ADD PASSENGER
      ============================ */
          console.log("🆕 addPassenger action detected");

          const pdata = normalizePassengerData(data);

          const newPassenger = await Passenger.create({
            passengerName: pdata.passengerName,
            fatherName: pdata.fatherName,
            phoneNo: pdata.phoneNo,
            age: pdata.age,
            gender: pdata.gender,
            isForeigner: pdata.isForeigner,
            docType: pdata.docType,
            docId: pdata.docId,
            nationality: pdata.isForeigner ? pdata.nationality : null,
            visaNumber: pdata.isForeigner ? pdata.visaNumber : null,
            residence: pdata.residence,
          });

          await tripRelation.create({
            tId,
            pId: newPassenger.pId,
            status: 1,
          });
        } else if (action === "deletePassenger") {
          /* ============================
         CASE 4: DELETE PASSENGER
      ============================ */
          console.log("🗑️ deletePassenger action detected");

          await tripRelation.update({ status: 0 }, { where: { tId, pId } });
        }
      }

      return {
        success: true,
        message: "Trip and passenger details updated successfully",
      };
    } catch (error) {
      console.error("❌ updateTripPolice failed:", error);
      return {
        success: false,
        message: "Failed to update trip data",
        error: error.message,
      };
    }
  }

  static async updateProfile(profileData) {
    try {
      console.log("Updating profile with data:", profileData);

      const { userid, title, firstName, lastName, ownContact, ownAddress } =
        profileData;

      // ✅ Validate input
      if (!userid) {
        return {
          success: false,
          message: "User ID is required",
        };
      }

      // ✅ Find existing registration record
      const registration = await db.Registration.findOne({
        where: { userId: userid },
      });

      if (!registration) {
        return {
          success: false,
          message: "Profile not found for the given user ID",
        };
      }

      // ✅ Update the profile
      await registration.update({
        title,
        firstName,
        lastName,
        ownContact,
        ownAddress,
      });

      // ✅ Return success message
      return {
        success: true,
        message: "Profile updated successfully ✅",
        updatedData: registration.toSafeObject(),
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      return {
        success: false,
        message: "Error updating profile",
        error: error.message,
      };
    }
  }

  static async updatePoliceProfile(profileData) {
    try {
      console.log("Updating police profile  data:", profileData);

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
      console.log("Received userid:", userid);
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

      console.log("Fetching approved counts for checkpostid:", checkpostid);
      console.log("Kolkata current date:", kolkataDate);

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

      console.log("Approved counts fetched:", approvedCounts);

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

      console.log("Current date and time fetched (Kolkata):", {
        date,
        time,
        locale,
      });

      return { date, time, timestamp: now.toISOString(), locale };
    } catch (error) {
      console.error("AuthService.getCurrentDateAndTime error:", error);
      throw new Error("Failed to get current date and time");
    }
  }

  static async deleteVehicle(vehicleData) {
    try {
      console.log("Deleting vehicle with data:", vehicleData);

      // ✅ Handle both object and direct ID input
      const vehicleId =
        typeof vehicleData === "object" ? vehicleData.vehicleId : vehicleData;

      if (!vehicleId) {
        return { success: false, message: "Vehicle ID is required" };
      }

      // ✅ Soft delete: mark vehicle as inactive (status = 0)
      const [updatedCount] = await db.Vehicle.update(
        { status: 0 },
        {
          where: {
            vId: vehicleId,
            status: 1, // Only delete if active
          },
        },
      );

      if (updatedCount === 0) {
        return {
          success: false,
          message: "Vehicle not found or already deleted",
        };
      }

      return {
        success: true,
        message: "✅ Vehicle deleted successfully (status set to 0)",
      };
    } catch (error) {
      console.error("💥 Error deleting vehicle:", error);
      return {
        success: false,
        message: "Error deleting vehicle",
        error: error.message,
      };
    }
  }
  // ✅ Soft delete driver (set status = 0 instead of hard delete)
  static async deleteDriver(driverData) {
    try {
      console.log("Deleting driver with data:", driverData);

      // ✅ Handle both object and direct ID input
      const driverId =
        typeof driverData === "object" ? driverData.driverId : driverData;

      if (!driverId) {
        return { success: false, message: "Driver ID is required" };
      }

      // ✅ Soft delete: mark driver as inactive (dStatus = "inactive")
      const [updatedCount] = await db.Driver.update(
        { dStatus: "inactive" },
        {
          where: {
            dId: driverId,
            dStatus: "active", // Only deactivate if active
          },
        },
      );

      if (updatedCount === 0) {
        return {
          success: false,
          message: "Driver not found or already inactive",
        };
      }

      return {
        success: true,
        message: "✅ Driver deleted successfully (status set to 'inactive')",
      };
    } catch (error) {
      console.error("💥 Error deleting driver:", error);
      return {
        success: false,
        message: "Error deleting driver",
        error: error.message,
      };
    }
  }
  static async getCheckOutReport(params) {
    try {
      const whereClause = {};

      // Filter by Checkpost ID
      if (params.checkpostid !== undefined) {
        whereClause.checkpostid = params.checkpostid;
      }

      // Filter by Status
      if (params.status !== undefined) {
        whereClause.status = params.status;
      }

      // Filter by Date (checkoutdate)
      if (params.checkoutdate !== undefined) {
        whereClause.checkoutdate = params.checkoutdate;
      }

      // Only fetch normal convoy (<= 99)
      whereClause.conveyid = {
        [Op.lte]: 99,
      };

      const approveWhere = {};
      if (
        params.conveyId !== undefined &&
        params.conveyId !== null &&
        params.conveyId !== ""
      ) {
        approveWhere.convey_id = params.conveyId;
      }
      console.log("wherease", whereClause);

      // If conveyId is undefined or null, approveWhere remains empty, meaning no filter

      // Fetch with associations
      const checkOutTrips = await db.CheckoutTrip.findAll({
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
            ],
          },
          {
            model: db.ApproveTrip,
            as: "approveTrip",
            required: !!params.conveyId,
            where: Object.keys(approveWhere).length ? approveWhere : undefined, // Only apply when conveyId is given
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
      });

      // ✅ Reshape response into nested JSON
      const formatted = checkOutTrips.map((trip) => {
        return {
          id: trip.id,
          tId: trip.tId,
          checkoutdate: trip.checkoutdate,
          checkouttime: trip.checkouttime,
          status: trip.status,
          remarks: trip.remarks,

          // ✅ Nested Checkpost Details
          checkpostDetails: trip.checkpostLocation
            ? {
                id: trip.checkpostLocation.id,
                location: trip.checkpostLocation.location,
              }
            : null,

          // ✅ Nested ApproveTrip Details
          approveDetails: trip.approveTrip
            ? {
                id: trip.approveTrip.id,
                tId: trip.approveTrip.tId,
                arrdate: trip.approveTrip.arrdate,
                arrtime: trip.approveTrip.arrtime,
                remarks: trip.approveTrip.remarks,
                astatus: trip.approveTrip.astatus,
                convey: trip.approveTrip.convey || null,
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

  // ✅ AuthService.getarrivalist (final corrected)
  static async getarrivalist(checkpost_id) {
    try {
      //const checkpost_id = 2; // ✅ Static checkpost ID
      //console.log("paramcheckpost", checkpost_id);
      const oppositeCheckpostId =
        checkpost_id === 1 ? 2 : checkpost_id === 2 ? 1 : null;

      const test =
        oppositeCheckpostId === 1
          ? "Jirkatang"
          : oppositeCheckpostId === 2
            ? "Middle Strait"
            : null;
      //console.log("targeed ceckpost", oppositeCheckpostId);
      //console.log("🛰️ Fetching running convoy for checkpost:", checkpost_id);

      // ✅ Get current date in Kolkata timezone (YYYY-MM-DD)
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
        console.log(
          `⚠️ No running convoy found for checkpost ${oppositeCheckpostId} on ${currentDate}`,
        );
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

      console.log(
        "✅ Running convoy details fetched successfully:",
        conveyDetails,
      );

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
      console.log(
        `✅ Found ${totalTrips} approved trips for opposite checkpost ${oppositeCheckpostId}`,
      );

      console.log(
        `✅ Found ${approvedTrips.length} approved trips for convoy ${runningConvey.conveyid}`,
      );

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

      console.log("✅ Final Response JSON:", JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error("❌ Error in getarrivalist service:", error);
      throw new Error("Failed to fetch arrival list");
    }
  }

  static async deletetrip(tripData) {
    try {
      console.log("🗑️ Deleting trip with data:", tripData);

      // ✅ Handle both object and direct ID input
      const tripId =
        typeof tripData === "object"
          ? tripData.tId || tripData.tripId
          : tripData;

      if (!tripId) {
        return { success: false, message: "Trip ID is required" };
      }

      // ✅ Soft delete: mark trip as inactive (status = 0)
      const [updatedCount] = await db.Trip.update(
        { status: 0 },
        {
          where: {
            tId: tripId,
            status: { [db.Sequelize.Op.ne]: 0 }, // only if not already deleted
          },
        },
      );

      if (updatedCount === 0) {
        return {
          success: false,
          message: "Trip not found or already deleted",
        };
      }

      return {
        success: true,
        message: "✅ Trip deleted successfully (status set to 0)",
      };
    } catch (error) {
      console.error("💥 Error deleting trip:", error);
      return {
        success: false,
        message: "Error deleting trip",
        error: error.message,
      };
    }
  }
  //-----------Trip Verification------------

  static async tripVerify(data) {
    try {
      console.log(
        "📩 Trip verification request received with data (AuthService):",
        data,
      );

      // 1️⃣ Find the trip record
      const trip = await db.Trip.findOne({ where: { tId: data.tId } });

      if (!trip) {
        throw new Error("Trip not found");
      }

      //2️⃣ Update verification status
      await trip.update({
        verifiystatus: data.buttonId,
      });

      await db.VerifiedTrip.create({
        tripId: data.tId,
        verifiedby: data.verifiedby || null, // optional
        remarks: data.remarks || null,
        status: data.astatus,
      });

      //✅ MySQL trigger will automatically update 'verifiedtime' when verifiystatus changes

      console.log(
        `✅ Trip ${data.tId} verification status updated to: ${data.buttonId}`,
      );

      return {
        message: "Trip verification updated successfully",
        trip,
      };
    } catch (error) {
      console.error("❌ Trip verification failed:", error.message);
      throw new Error(error.message || "Trip verification failed");
    }
  }

  // static async getVerifiedTripDetails({ checkpostid }) {
  //   try {
  //     console.log("📥 Fetching verified trips for checkpost:", checkpostid);

  //     const trips = await db.Trip.findAll({
  //       include: [
  //         {
  //           model: db.VerifiedTrip,
  //           as: "verifiedDetails",
  //           attributes: ["vdate", "vtime", "remarks", "status"],
  //           where: { status: 1 }, // ✅ verified trips only
  //           required: true, // INNER JOIN
  //           include: [
  //             {
  //               model: db.PoliceRegistration,
  //               as: "verifiedOfficer",
  //               attributes: [
  //                 "reg_id",
  //                 "title",
  //                 "firstName",
  //                 "lastName",
  //                 "designation",
  //               ],
  //             },
  //           ],
  //         },
  //         {
  //           model: db.OriginDestination,
  //           as: "originLocation",
  //           attributes: ["location"],
  //         },
  //         {
  //           model: db.OriginDestination,
  //           as: "destinationLocation",
  //           attributes: ["location"],
  //         },
  //         {
  //           model: db.Driver,
  //           as: "driver",
  //           attributes: ["dFirstName", "dLastName", "licenseNo"],
  //         },
  //         {
  //           model: db.Vehicle,
  //           as: "vehicle",
  //           attributes: ["vNum"],
  //         },
  //       ],
  //       order: [["entrydatetime", "DESC"]],
  //     });

  //     return { trips };
  //   } catch (error) {
  //     console.error("❌ Failed to fetch verified trips:", error.message);
  //     throw new Error(error.message || "Failed to fetch verified trips");
  //   }
  // }
  static async getVerifiedTripDetails({ checkpostid, convey }) {
    try {
      console.log("📥 Fetching verified trips for checkpost:", checkpostid);
      console.log("📥 Fetching verified trips for convey:", convey);
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
      throw new Error(error.message || "Failed to fetch verified trips");
    }
  }

  // ================= TODAY'S TRIP DETAILS =================
  // static async getTodaysTripDetails() {
  //   try {
  //     const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  //     const rows = await db.ApproveTrip.findAll({
  //       where: {
  //         checkpost_id: 1,
  //         astatus: 1,
  //         arrdate: today,
  //       },
  //       order: [["arrtime", "ASC"]],
  //     });

  //     return rows;
  //   } catch (error) {
  //     console.error("Error fetching today's trip details:", error.message);
  //     throw new Error(error.message || "Failed to fetch today's trip details");
  //   }
  // }

  // static async getTodaysTripDetails(checkpostid) {
  //   try {
  //     const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  //     //TEMPORARY LOG TO CONFIRM QUERY INPUTS
  //     console.log("🔍 Today:", today);
  //     console.log("🔍 Checkpost:", checkpostid);

  //     const rows = await db.ApproveTrip.findAll({
  //       where: {
  //         checkpost_id: checkpostid,
  //         astatus: 1,
  //         arrdate: today,
  //       },
  //       order: [["arrtime", "ASC"]],
  //     });

  //     return rows;
  //   } catch (error) {
  //     console.error("Service error:", error.message);
  //     throw error;
  //   }
  // }
  //   static async getTodaysTripDetails({ checkpostid, today }) {
  //   return await db.ApproveTrip.findAll({
  //     where: {
  //       checkpost_id: checkpostid,
  //       astatus: 1,
  //       arrdate: today,
  //     },
  //     attributes: [
  //       "id",
  //       "tId",
  //       "arrdate",
  //       "arrtime",
  //       "convey_id",
  //       "checkpost_id",
  //       "remarks",
  //       "astatus",
  //       "approveby",
  //     ],
  //     order: [["arrtime", "ASC"]],
  //   });
  // }

  // static async getTodaysTripDetails({ checkpostid, today }) {
  //   return await db.ApproveTrip.findAll({
  //     where: {
  //       checkpost_id: checkpostid,
  //       astatus: 1,
  //       arrdate: today,
  //     },
  //     attributes: [
  //       "convey_id",
  //       [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "tripCount"],
  //     ],
  //     group: ["convey_id"],
  //     order: [["convey_id", "ASC"]],
  //     raw: true,
  //   });
  // }

  // Today's Trip details
  static async todayConvoyTrips(payload) {
    const { fn, col, where, Op, Sequelize } = require("sequelize");

    /* =========================
     1️⃣ DATE HANDLING
     ========================= */

    let today = null;

    if (payload?.date) {
      if (typeof payload.date === "string") {
        // handles "2026-01-09" and ISO strings
        today = payload.date.split("T")[0];
      } else if (typeof payload.date === "object" && payload.date.date) {
        // handles { date: "2026-01-09" }
        today = payload.date.date;
      }
    }

    if (!today) {
      today = new Date().toISOString().split("T")[0];
    }

    /* =========================
     2️⃣ CHECKPOST ID (UNIFIED)
     ========================= */

    const checkpostId = payload?.checkpostId || payload?.checkpost_id || null;

    console.log("FINAL DATE USED:", today);
    console.log("CHECKPOST ID:", checkpostId);

    /* =========================
     3️⃣ CONVEY CONTROL (START / END TIME)
     ========================= */

    const conveyControlWhere = { date: today };

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
      where: { date: today },
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
      [Op.and]: [where(fn("DATE", col("approvedTrips.arrdate")), today)],
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

      const verification = verificationMap[c.id] || {
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

    return {
      message: "Today's convoy statistics fetched successfully",
      convoys: result,
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

      console.log("✅ Checkout started:", checkout.toJSON());

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

      console.log("⛔ Checkout stopped:", runningCheckout.toJSON());

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

      console.log(`✅ Checkout rows found: ${rows.length}`);

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

      console.log("🚗 Vehicle Counts:", vehicleCounts);
      console.log("👨 Male:", totalMale);
      console.log("👩 Female:", totalFemale);
      console.log("🧒 Child:", totalChild);
      console.log("🧍 Total Passengers:", totalPassengers);

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
      throw new Error(error.message || "Failed to fetch checkout report");
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

      console.log("🔥 FREEZE SERVICE CALLED");
      console.log("Requested PoliceUser ID:", policeId);
      console.log("Requested by:", loggedInUser?.reg_id);

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
      await PoliceUser.update({ status: 0 }, { where: { id: policeId } });

      // 3️⃣ Freeze police registration
      await PoliceRegistration.update(
        { status: 0 },
        { where: { userId: policeId } },
      );

      console.log("✅ POLICE FROZEN:", policeId);

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

      console.log("🔥 FREEZE SERVICE CALLED");
      console.log("Requested PoliceUser ID:", policeId);
      console.log("Requested by:", loggedInUser?.reg_id);

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

      console.log("✅ POLICE unFROZEN:", policeId);

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
      console.log("🔥 DELETE POLICE SERVICE");
      console.log("Police ID:", policeId);
      console.log("Requested by:", loggedInUser?.reg_id);

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
      console.log("✅ AuthService.getSpReport() called");

      // ✅ USE SELECTED DATE OR TODAY
      const reportDate =
        selecteddate && /^\d{4}-\d{2}-\d{2}$/.test(selecteddate)
          ? selecteddate
          : new Date().toISOString().split("T")[0];

      console.log("📅 Report date:", reportDate);

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
        });
      };

      // 🔹 Check problem count
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
          attributes: ["tId"], // ✅ ONLY trip id
          raw: true,
        });

        const tripIds = rows.map((r) => r.tId);

        console.log("🆔 Arrived Trip IDs:", tripIds);

        return tripIds;
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

        console.log("🧍 Total Arrived Passengers:", passengerCount);
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

        console.log("🧍 Arrival Passenger Count:", passengerCount);

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

      console.log("🆔 Jirkatang Trip IDs:", jirkatangTripIds);
      console.log("🆔 Middle Strait Trip IDs:", middleStraitTripIds);

      // 🔹 Get arrival passenger totals
      const jirkatangArrivalPassengers =
        await getArrivalPassengerTotal(jirkatangTripIds);

      const middleStraitArrivalPassengers =
        await getArrivalPassengerTotal(middleStraitTripIds);

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
            },
            attributes: ["tId", "date", "status", "verifiystatus"],
            include: [
              {
                model: db.Driver,
                as: "driver", // ✅ alias MATCH
                required: false, // ✅ don't block trip rows
                attributes: ["title", "dFirstName", "dLastName"],
              },
              {
                model: db.Vehicle,
                as: "vehicle", // ✅ alias MATCH
                required: false, // ✅ don't block trip rows
                attributes: ["vNum", "Vcat"], // ✅ vehicle number only
              },
              {
                model: db.ApproveTrip,
                as: "approveDetails",
                required: false, // important: don't block if no record
                attributes: ["remarks", "astatus", "approveby"],
              },
            ],
          });

        case "DEPARTURE":
          return await db.ApproveTrip.findAll({
            where: {
              arrdate: date,
              astatus: { [Op.ne]: 0 }, // ✅ APPROVED / DEPARTED
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

        case "NON_ARRIVAL":
          return await db.CheckoutTrip.findAll({
            where: {
              checkoutdate: date,
              status: 0, // ✅ NON-ARRIVAL
              checkpostid: checkpostId === 1 ? 1 : { [Op.ne]: 1 },
            },
            include: [
              {
                model: db.Trip,
                as: "trip", // ⚠️ MUST MATCH ASSOCIATION
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
              status: 2, // ✅ ISSUE OCCURRED
              checkpostid: checkpostId === 1 ? 1 : { [Op.ne]: 1 },
            },
            include: [
              {
                model: db.Trip,
                as: "trip", // ⚠️ must match association
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
              status: 0, // ✅ CLOSED CONVOY
              checkpostid: checkpostId, // ✅ FIXED
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

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
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
}

module.exports = AuthService;
