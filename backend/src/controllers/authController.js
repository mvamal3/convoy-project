const AuthService = require("../services/authService");
const BaseResponseDTO = require("../dto/response/BaseResponseDTO");
const db = require("../models"); // make sure index.js in /models returns db with initialized models
const {
  REFRESH_COOKIE,
  setRefreshCookie,
  clearAuthCookies,
} = require("../utils/authSession");
const { AUDIT_ACTIONS, audit, actorFrom } = require("../utils/auditLog");

////new dto
const GetTripDetailsByDateRequestDTO = require("../dto/request/new/GetTripDetailsByDateRequestDTO");
//const GetAllApproveTripRequestDTO = require("../dto/request/GetAllApproveTripRequestDTO");

class AuthController {

// Put the refresh token in an httpOnly cookie and return only the
// access token and user details in the JSON body.
static sendSession(res, { user, tokens }, message, accountType) {
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error("Invalid login token response");
  }

  setRefreshCookie(res, tokens.refreshToken);

  return res.status(200).json(
    BaseResponseDTO.success(
      {
        accountType,
        user,
        tokens: {
          accessToken: tokens.accessToken,
          tokenType: "Bearer",
        },
      },
      message
    )
  );
}

// Citizens and scs may only touch their own trips; other police and admin are not limited.
static isTripOwnerOnly(req) {
  return req.accountType === "user" || req.user.role === "scs";
}

static async canAccessTrips(req, tIds) {
  if (!AuthController.isTripOwnerOnly(req)) return true;
  return AuthService.userOwnsTrips(req.user.id, tIds);
}

// A trip edit may only set a vehicle and driver linked to the same account.
static async canUseVehiclesAndDrivers(req, items) {
  if (!AuthController.isTripOwnerOnly(req)) return true;

  for (const item of items) {
    const { action, data } = item?.payload || {};
    if (
      action === "updateTrip" &&
      !(await AuthService.userOwnsVehicleAndDriver(req.user.id, data?.vId, data?.dId))
    ) {
      return false;
    }
  }
  return true;
}

static sendLoginError(res, error) {
  // Account lockout and similar messages that are safe to show
  if (error.expose) {
    return res.status(error.status).json(BaseResponseDTO.error(error.message));
  }

  if (
    error.message ===
      "Invalid or expired CAPTCHA. Please refresh and try again." ||
    error.message ===
      "CAPTCHA session missing. Please refresh CAPTCHA."
  ) {
    return AuthController.sendError(res, error);
  }

  if (
    error.message === "Invalid credentials" ||
    error.message === "Unauthorized admin access"
  ) {
    return res.status(401).json(
      BaseResponseDTO.error("Invalid credentials")
    );
  }

  console.error("Login error:", error.message);

  return res.status(400).json(
    BaseResponseDTO.error("Unable to process login")
  );
}

static async login(req, res) {
  try {
    const result = await AuthService.login(req.body, req);
    return AuthController.sendSession(res, result, "Login successful", "user");
  } catch (error) {
    return AuthController.sendLoginError(res, error);
  }
}


  static async registerNew(req, res) {
    try {
      const result = await AuthService.registerNew(req.body);
      res
        .status(201)
        .json(BaseResponseDTO.success(result, "Registration successful"));
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  //driver_tbl registration
  static async registerDriver(req, res) {
    try {
      //console.log("Registering new driver with data:", req.body);

      const result = await AuthService.registerDriver(req.body, req.user.id);
      res
        .status(201)
        .json(
          BaseResponseDTO.success(result, "Driver registration successful"),
        );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  // Soft-delete a driver or vehicle owned by the caller
  static async deleteDriver(req, res) {
    return AuthController.deleteOwned(res, req.body?.dId, "Driver", (id) =>
      AuthService.deleteDriver(id, req.user.id),
    );
  }

  static async deleteVehicle(req, res) {
    return AuthController.deleteOwned(res, req.body?.vId, "Vehicle", (id) =>
      AuthService.deleteVehicle(id, req.user.id),
    );
  }

  static async deletetrip(req, res) {
    return AuthController.deleteOwned(res, req.body?.tId, "Trip", (id) =>
      AuthService.deletetrip(id, req.user.id),
    );
  }

  static async deleteOwned(res, id, label, remove) {
    if (!id || typeof id === "object") {
      return res.status(400).json(BaseResponseDTO.error(`${label} ID is required`));
    }
    try {
      if (!(await remove(id))) {
        return res.status(404).json(BaseResponseDTO.error(`${label} not found`));
      }
      return res.json(BaseResponseDTO.success(null, `${label} deleted successfully`));
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  //vehicle registration
  static async registerVehicle(req, res) {
    try {
      const result = await AuthService.registerVehicle(req.body, req.user.id);
      res
        .status(201)
        .json(
          BaseResponseDTO.success(result, "Vehicle registration successful"),
        );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

static async refreshToken(req, res) {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      return res.status(401).json(
        BaseResponseDTO.error("Refresh token required")
      );
    }

    const result = await AuthService.refreshToken(refreshToken);

    return AuthController.sendSession(
      res,
      {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
      "Token refreshed successfully",
      result.accountType
    );
  } catch (error) {
    clearAuthCookies(res);

    return res.status(401).json(
      BaseResponseDTO.error("Invalid or expired refresh token")
    );
  }
}


  //--------------------------------------

  //get_driver_list_by_regId
  static async getDriveListbyRegId(req, res) {
    try {
      const result = await AuthService.getDriveListbyRegId(
        req.body,
        req.user.id,
      );
      res.json(
        BaseResponseDTO.success(result, "Driver List Loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  //---------------------------------------

  //get_vehicle_list_by_regId
  static async getVehicleListbyRegId(req, res) {
    try {
      const result = await AuthService.getVehicleListbyRegId(
        req.query,
        req.user.id,
      );
      res.json(
        BaseResponseDTO.success(result, "Vehicle List Loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  //-----------------------------------

  // Get Destrict-----------------------
  static async getDistrict(req, res) {
    try {
      const result = await AuthService.getDistrict(req.body);
      //throw Error('No districts found in database');
      res.json(
        BaseResponseDTO.success(result, "District List Loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  //-----------------------------------------

  // Get SubDestrict-----------------------
  static async getSubDistrict(req, res) {
    try {
      const result = await AuthService.getSubDistrict(req.body.district_code);
      res.json(
        BaseResponseDTO.success(result, "SubDistrict Loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  //-------------------------------------------

  // Get Villages-----------------------
  static async getVillage(req, res) {
    try {
      const result = await AuthService.getVillage(req.body.subdistrict_code);
      res.json(
        BaseResponseDTO.success(result, "Vehicle List Loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  //------------------------------------

  //Create new Trip
  static async newtrip(req, res) {
    try {
      const result = await AuthService.newtrip(req.body, req.user.id);
      res.json(BaseResponseDTO.success(result, "Trip Created Successfully"));
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  //Create spl new Trip
  static async splnewtrip(req, res) {
    try {
      const result = await AuthService.splnewtrip(req.body, req.user.id);
      res.json(
        BaseResponseDTO.success(result, "Special Trip Created Successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  //get nationality

  static async getNationality(req, res) {
    try {
      const result = await AuthService.getNationality();
      res.json(
        BaseResponseDTO.success(result, "Nationality list loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  //--------------------------------
  //get_trip_details_by_RegId
  static async getTripDetailsbyRegId(req, res) {
    try {
      const result = await AuthService.getTripDetailsbyRegId(
        req.body,
        req.user.id,
      );
      res.json(
        BaseResponseDTO.success(result, "Trip Details Loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  //-------------------------

  static async getTripDetailsbyRegIdCitizen(req, res) {
    try {
      const result = await AuthService.getTripDetailsbyRegIdCItizen(
        req.body,
        req.user.id,
      );
      res.json(
        BaseResponseDTO.success(result, "Trip Details Loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  //get_trip_details_by_tId
  static async getTripDetailsbyTripId(req, res) {
    try {
      if (!(await AuthController.canAccessTrips(req, [req.body?.tId]))) {
        return res.status(403).json(BaseResponseDTO.error("Access denied"));
      }

      const result = await AuthService.getTripDetailsbyTripId(req.body);
      res.json(
        BaseResponseDTO.success(result, "Trip Details Loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  //-------------------------

  //get tripdetails by date

  static async getTripDetailsbydt(req, res) {
    try {
      const dto = new GetTripDetailsByDateRequestDTO(req.body);

      const result = await AuthService.getTripDetailsbydt(dto);

      res.json(BaseResponseDTO.success(result, "Trip Details by date"));
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  //---------------------------------getPendingTripDetailsbydt

  //get Pending tripdetails by date
  static async getPendingTripDetailsbydt(req, res) {
    try {
      const result = await AuthService.getPendingTripDetailsbydt(req.body);
      res.json(BaseResponseDTO.success(result, "Pending Trip Details by date"));
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  //-------trip approval / verification--------------------
  static async tripApproval(req, res) {
    try {
      const result = await AuthService.tripApproval(
        req.body,
        req.user.registration?.reg_id,
      );
      return res.json(BaseResponseDTO.success(result, "Trip Approved Successfully"));
    } catch (error) {
      return AuthController.sendError(res, error, "Trip approval failed");
    }
  }

  static async tripVerify(req, res) {
    try {
      const result = await AuthService.tripVerify(
        req.body,
        req.user.registration?.reg_id,
      );
      return res.json(BaseResponseDTO.success(result, "Trip Verified Successfully"));
    } catch (error) {
      return AuthController.sendError(res, error, "Trip verification failed");
    }
  }

  //---------------------------------

  static async getallVerifiedTrips(req, res) {
    try {

      const checkpostid = req.body?.locationid || null;
      const convey = req.body?.selectedconvoy || null;

      // console.log(
      //   "🔍 Fetching veri0000000ied trips for checkpost ID:",
      //   checkpostid
      // );

      const result = await AuthService.getVerifiedTripDetails({
        checkpostid,
        convey,
      });

      return res.json(
        BaseResponseDTO.success(result, "Verified trips fetched successfully"),
      );
    } catch (error) {
      console.error("❌ Verified Trip fetch failed:", error.message);

      return AuthController.sendError(res, error);
    }
  }
  //==========================

  static async profile(req, res) {
    try {
      const UserResponseDTO = require("../dto/response/UserResponseDTO");
      const userResponse = new UserResponseDTO(req.user);
      res.json(
        BaseResponseDTO.success(userResponse, "Profile retrieved successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  static async getTripDetails(req, res) {
    try {
      // req.body contains { checkpostid: someValue }
      const params = req.body;
      const result = await AuthService.getallTripDetails(params);
      //console.log("Trip details fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "All Trip Details"));
    } catch (error) {
      console.error("Error fetching trip details:", error);
      return AuthController.sendError(res, error);
    }
  }
  static async getuserprofile(req, res) {
    try {
      // Citizens can only read their own profile
      const result = await AuthService.getProfileByUserId(req.user.id);
      res.json(BaseResponseDTO.success(result, "User Profile Details"));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async updatePoliceProfile(req, res) {
    try {
      const result = await AuthService.updatePoliceProfile(req.body);

      if (result.success) {
        // ✅ Send success message and data
        res.json(BaseResponseDTO.success(result.updatedData, result.message));
      } else {
        // ❌ Handle cases like missing userId or not found
        res.status(400).json(BaseResponseDTO.error(result.message));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json(BaseResponseDTO.error("Internal server error"));
    }
  }
  static async updateProfile(req, res) {
    try {
      // Citizens can only update their own profile
      const result = await AuthService.updateProfile({
        ...req.body,
        userid: String(req.user.id),
      });

      if (result.success) {
        // ✅ Send success message and data
        res.json(BaseResponseDTO.success(result.updatedData, result.message));
      } else {
        // ❌ Handle cases like missing userId or not found
        res.status(400).json(BaseResponseDTO.error(result.message));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json(BaseResponseDTO.error("Internal server error"));
    }
  }
  static async getPoliceProfile(req, res) {
    try {
      // Police officers can only read their own profile; admins can read any
      const userId =
        req.accountType === "admin" ? req.body?.userId : req.user.id;
      const result = await AuthService.getPoliceProfileByUserId(userId);
      res.json(BaseResponseDTO.success(result, "User Profile Details"));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async editTripDetails(req, res) {
    try {
      // req.body contains { tripId: someValue, ...updateData }
      const { tripId } = req.body;

      if (!(await AuthController.canAccessTrips(req, [tripId]))) {
        return res.status(403).json(BaseResponseDTO.error("Access denied"));
      }

      const result = await AuthService.editTripDetailsByTripId(tripId);
      res.json(
        BaseResponseDTO.success(result, "Trip details updated successfully"),
      );
    } catch (error) {
      console.error("Error updating trip details:", error);
      return AuthController.sendError(res, error);
    }
  }
  
static async updateTripPolice(req, res) {
  try {
    const tIds = Array.isArray(req.body)
      ? req.body.map((item) => item?.payload?.tId)
      : [];

    if (
      !(await AuthController.canAccessTrips(req, tIds)) ||
      !(await AuthController.canUseVehiclesAndDrivers(req, req.body))
    ) {
      return res.status(403).json(BaseResponseDTO.error("Access denied"));
    }

    const result = await AuthService.updateTripPolice(req.body);

    // IMPORTANT: Do not wrap a failed service result as success.
    if (!result || result.success !== true) {
      return res.status(400).json({
        success: false,
        message: result?.message || "Invalid format",
        errors: result?.errors || [],
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message || "Trip police updated successfully",
    });
  } catch (error) {
    console.error("Error updating trip police:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update trip",
    });
  }
}


  static async getCheckOutReport(req, res) {
    try {
      // req.body contains { checkpostid: someValue }
      const params = req.body;
      const result = await AuthService.getCheckOutReport(params);
      res.json(BaseResponseDTO.success(result, "Check out Details"));
    } catch (error) {
      console.error("Error fetching check out details:", error);
      return AuthController.sendError(res, error);
    }
  }
  static async getSpecialCheckOutReport(req, res) {
    try {
      // req.body contains { checkpostid: someValue }
      const params = req.body;
      const result = await AuthService.splconvoygetCheckOutReport(params);
      res.json(BaseResponseDTO.success(result, "Check out Details"));
    } catch (error) {
      console.error("Error fetching check out details:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async getApproeveTripDetails(req, res) {
    try {
      const filters = {
        ...req.body,
        page: req.body.page ? parseInt(req.body.page, 10) : 1,
        limit: req.body.limit ? parseInt(req.body.limit, 10) : 10,
      };

      const result = await AuthService.getallApproveTripDetails(filters); // Updated to use getAllFilterdata
      // console.log("Trip details fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "All Trip Details"));
    } catch (error) {
      console.error("Error fetching trip details:", error);
      return AuthController.sendError(res, error);
    }
  }

  //=---------------get all aprve rip detsila

  static async getallApproeveTripDetails(req, res) {
    try {
      const filters = {
        ...req.body,
        page: req.body.page ? parseInt(req.body.page, 10) : 1,
        limit: req.body.limit ? parseInt(req.body.limit, 10) : 10,
      };

      const result = await AuthService.getallApproveTrip(filters); // Updated to use getAllFilterdata
      //console.log("Trip details fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "All Trip Details"));
    } catch (error) {
      console.error("Error fetching trip details:", error);
      return AuthController.sendError(res, error);
    }
  }
  //update for backend pagination
  static async getallApproeveRejectedPendingTripDetails(req, res) {
    try {
      const filters = {
        ...req.body,
        page: req.body.page ? parseInt(req.body.page, 10) : 1,
        limit: req.body.limit ? parseInt(req.body.limit, 10) : 10,
      };

      const result =
        await AuthService.getallApproeveRejectedPendingTripDetails(filters); // Updated to use getAllFilterdata
      //console.log("Trip details fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "All Trip Details"));
    } catch (error) {
      console.error("Error fetching trip details:", error);
      return AuthController.sendError(res, error);
    }
  }

  // Today's Trip Details
  static async getTodayConvoyTrips(req, res) {
    try {
      const payload = req.body.payload || req.body;


      const result = await AuthService.todayConvoyTrips(payload);

      return res.json(
        BaseResponseDTO.success(
          result,
          "Convoy trip details fetched successfully",
        ),
      );
    } catch (error) {
      console.error("❌ getTodayConvoyTrips error:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async freezePoliceUser(req, res) {
    try {
      // console.log("🟡 CONTROLLER USER:", req.user);

      const result = await AuthService.freezePoliceUser(req.body, req.user);

      return res.json({
        success: true,
        message: "Freeze request received",
        data: result,
      });
    } catch (error) {
      console.error("Freeze Police Controller Error:", error);
      return AuthController.sendError(res, error, "Freeze failed");
    }
  }
  static async unfreezePoliceUser(req, res) {
    try {
      // console.log("🟡 CONTROLLER USER:", req.user);

      const result = await AuthService.unfreezePoliceUser(req.body, req.user);

      return res.json({
        success: true,
        message: "Unfreeze request received",
        data: result,
      });
    } catch (error) {
      console.error("Unfreeze Police Controller Error:", error);
      return AuthController.sendError(res, error, "Unfreeze failed");
    }
  }

  static async changePolicePassword(req, res) {
    try {
      const { userid, password } = req.body;

      if (!userid || !password) {
        return res.status(400).json({
          success: false,
          message: "User ID and password are required",
        });
      }

      const result = await AuthService.changePolicePassword({
        userid,
        password,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("❌ changePolicePassword error:", error);

      return AuthController.sendError(res, error, "Failed to update password");
    }
  }

  //---------------------------------
  //filter search data
  static async tripfilterdata(req, res) {
    try {
      const result = await AuthService.getAllFilterdata(req.body);
      res.json(BaseResponseDTO.success(result, "All Trip Details"));
    } catch (error) {
      console.error("Error fetching trip details:", error);
      return AuthController.sendError(res, error);
    }
  }
  static async getOriginDestination(req, res) {
    try {
      const result = await AuthService.getAllOriginDestination(); // ✅ no req.body needed
      //console.log("Origin/Destination records fetched successfully:", result);
      res.json(
        BaseResponseDTO.success(result, "All Origin/Destination Records"),
      );
    } catch (error) {
      console.error("Error fetching origin/destination records:", error);
      return AuthController.sendError(res, error);
    }
  }

  ////////get registered police rdetails

  static async getRegisteredPolice(req, res) {
    try {
      const result = await AuthService.getRegisteredPolice();
      //console.log("Registered police details fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "Registered police details"));
    } catch (error) {
      console.error("Error fetching registered police details:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async getFrozenPoliceUsers(req, res) {
    try {
      const result = await AuthService.getFreezPolice();
      // console.log("Freezed police details fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "Freezed police details"));
    } catch (error) {
      console.error("Error fetching freezed  police details:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async deletePoliceUser(req, res) {
    try {
      const { policeId } = req.body;


      if (!policeId) {
        return res.status(400).json({
          success: false,
          message: "policeId is required",
        });
      }

      const result = await AuthService.deletePoliceUser(policeId, req.user);

      return res.json({
        success: true,
        message: "Police user deleted successfully",
        data: result,
      });
    } catch (error) {
      console.error("Delete Police Controller Error:", error);
      return AuthController.sendError(res, error, "Delete failed");
    }
  }

  static async getConveyTimeByLocId(req, res) {
    try {
      const { loc_id } = req.body;

      if (!loc_id) {
        return res
          .status(400)
          .json(BaseResponseDTO.error("loc_id is required"));
      }

      const result = await AuthService.getConveyTimeByLocId(loc_id);

      res.json(
        BaseResponseDTO.success(result, "Convey time fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching convey time:", error);
      return AuthController.sendError(res, error);
    }
  }
  ///////////registerPolice
  static async registerPolice(req, res) {
    try {
      const result = await AuthService.registerPolice(req.body);
      res
        .status(201)
        .json(
          BaseResponseDTO.success(result, "Police registration successful"),
        );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  ///////////Police login
  
  
static async loginPolice(req, res) {
  try {
    const result = await AuthService.loginPolice(req.body, req);
    return AuthController.sendSession(res, result, "Police login successful", "police");
  } catch (error) {
    return AuthController.sendLoginError(res, error);
  }
}


  //////////////Admin login
  static async loginAdmin(req, res) {
    try {
      const result = await AuthService.loginAdmin(req.body, req);
      return AuthController.sendSession(res, result, "Admin login successful", "admin");
    } catch (error) {
      return AuthController.sendLoginError(res, error);
    }
  }

  ///////current session (user, police and admin)
  // The frontend calls this before showing any signed-in page, so a
  // replayed or revoked token never results in a signed-in view.
  static async getSession(req, res) {
    try {
      const account = await AuthService.findSessionAccount(
        req.accountType,
        req.user.id,
      );

      if (!account) {
        return res
          .status(401)
          .json(BaseResponseDTO.error("Invalid or expired token"));
      }

      return res.json(
        BaseResponseDTO.success(
          {
            accountType: req.accountType,
            user: AuthService.sessionUser(req.accountType, account),
          },
          "Session is valid",
        ),
      );
    } catch (error) {
      console.error("Session check error:", error.message);
      return res
        .status(401)
        .json(BaseResponseDTO.error("Invalid or expired token"));
    }
  }

  ///////logout (user, police and admin)
  static async logout(req, res) {
    try {
      await AuthService.logout(req.accountType, req.user.id);
      await audit(req, { ...actorFrom(req), action: AUDIT_ACTIONS.LOGOUT });
    } catch (error) {
      console.error("Logout error:", error.message);
    }

    clearAuthCookies(res);

    if (req.session) {
      req.session.destroy(() => {});
    }

    res.json(BaseResponseDTO.success(null, "Logout successful"));
  }

  static async getconveywiseReport(req, res) {
    try {
      const result = await AuthService.conveywise(req.body);
      res.json(
        BaseResponseDTO.success(
          result,
          "Convey wise report fetched successfully",
        ),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
  static async otpVerification(req, res) {
    try {
      const result = await AuthService.verifyCitizenOtp(req.body, req);
      res.json(BaseResponseDTO.success(result, "OTP verification successful"));
    } catch (error) {
      AuthController.sendSafeError(res, error, "OTP verification failed");
    }
  }

  // Send an error's message only when it is meant for the client.
  static sendSafeError(res, error, fallback) {
    if (error.expose) {
      return res.status(error.status).json(BaseResponseDTO.error(error.message));
    }
    if (
      error.message ===
        "Invalid or expired CAPTCHA. Please refresh and try again." ||
      error.message === "CAPTCHA session missing. Please refresh CAPTCHA."
    ) {
      return AuthController.sendError(res, error);
    }
    console.error(`${fallback}:`, error.message);
    return res.status(500).json(BaseResponseDTO.error(fallback));
  }

  // Error reply for the business endpoints. Messages from httpError() and
  // plain `new Error("...")` thrown by the services are shown (400);
  // database and runtime errors (Error subclasses) get a generic 500.
  static sendError(res, error, fallback = "Request failed") {
    if (error.expose) {
      return res.status(error.status).json(BaseResponseDTO.error(error.message));
    }
    if (error.constructor === Error && error.message) {
      return res.status(400).json(BaseResponseDTO.error(error.message));
    }
    console.error(`${fallback}:`, error);
    return res.status(500).json(BaseResponseDTO.error(fallback));
  }

  // ==================== Account security ====================

  static async resendOtp(req, res) {
    try {
      const result = await AuthService.resendRegistrationOtp(req.body, req);
      res.json(BaseResponseDTO.success(null, result.message));
    } catch (error) {
      AuthController.sendSafeError(res, error, "Unable to send OTP");
    }
  }

  static async forgotPassword(req, res) {
    try {
      const result = await AuthService.requestPasswordReset(req.body, req);
      res.json(BaseResponseDTO.success(null, result.message));
    } catch (error) {
      AuthController.sendSafeError(res, error, "Unable to send OTP");
    }
  }

  static async resetPassword(req, res) {
    try {
      const result = await AuthService.resetPassword(req.body, req);
      res.json(BaseResponseDTO.success(null, result.message));
    } catch (error) {
      AuthController.sendSafeError(res, error, "Unable to reset password");
    }
  }

  // Changing the password ends every session, so clear this one's cookies.
  static async changeOwnPassword(req, res) {
    try {
      const result = await AuthService.changeOwnPassword(req, req.body);
      clearAuthCookies(res);
      res.json(BaseResponseDTO.success(null, result.message));
    } catch (error) {
      AuthController.sendSafeError(res, error, "Unable to change password");
    }
  }

  static async listCitizens(req, res) {
    try {
      const result = await AuthService.listCitizens(req.body);
      res.json(BaseResponseDTO.success(result, "Citizens fetched"));
    } catch (error) {
      AuthController.sendSafeError(res, error, "Unable to fetch citizens");
    }
  }

  static async freezeCitizen(req, res) {
    try {
      const result = await AuthService.setCitizenFrozen(req.body, true);
      res.json(BaseResponseDTO.success(result, result.message));
    } catch (error) {
      AuthController.sendSafeError(res, error, "Unable to freeze citizen");
    }
  }

  static async unfreezeCitizen(req, res) {
    try {
      const result = await AuthService.setCitizenFrozen(req.body, false);
      res.json(BaseResponseDTO.success(result, result.message));
    } catch (error) {
      AuthController.sendSafeError(res, error, "Unable to unfreeze citizen");
    }
  }

  static async unlockAccount(req, res) {
    try {
      const result = await AuthService.unlockAccount(req.body);
      res.json(BaseResponseDTO.success(result, result.message));
    } catch (error) {
      AuthController.sendSafeError(res, error, "Unable to unlock account");
    }
  }

  static async getAuditLogs(req, res) {
    try {
      const result = await AuthService.getAuditLogs(req.body);
      res.json(BaseResponseDTO.success(result, "Audit log fetched"));
    } catch (error) {
      AuthController.sendSafeError(res, error, "Unable to fetch audit log");
    }
  }
  static async getConveyDetails(req, res) {
    try {
      const { checkpostid } = req.body; // extract only the ID
      const result = await AuthService.getConveyDetails(checkpostid);

      res.json(
        BaseResponseDTO.success(result, "Convey details fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching convey details:", error);
      return AuthController.sendError(res, error);
    }
  }
  static async getAllTodayConveyReports(req, res) {
    try {
      const { Date, locationid } = req.body; // extract from request body

      const result = await AuthService.getAllTodayConveyReports({
        Date,
        locationid,
      });


      res.json(
        BaseResponseDTO.success(
          result,
          "All today's convey reports fetched successfully",
        ),
      );
    } catch (error) {
      console.error("Error fetching all today's convey reports:", error);
      return AuthController.sendError(res, error);
    }
  }
  static async getAllDetailsByTripId(req, res) {
    try {
      const { tripId } = req.body;
      const result = await AuthService.getAllDetailsByTripId(tripId);
      res.json(
        BaseResponseDTO.success(result, "Trip details fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching trip details:", error);
      return AuthController.sendError(res, error);
    }
  }
  static async addConveyControl(req, res) {
    try {
      const result = await AuthService.addConveyControl(req.body);

      if (!result.success) {
        // ❌ Service returned failure, send error response
        return res
          .status(400)
          .json(BaseResponseDTO.error(result.message, result.data || null));
      }

      // ✅ Service returned success
      res.json(BaseResponseDTO.success(result.data, result.message));
    } catch (error) {
      console.error("Error adding convey control:", error);
      return AuthController.sendError(res, error, "Failed to add convey control");
    }
  }
  static async getRunningConvey(req, res) {
    try {
      const { checkpost_id } = req.body;

      const result = await AuthService.getCurrentRunningConvey(checkpost_id);

      if (!result) {
        return res.json(
          BaseResponseDTO.error("No running convey is there"), // custom message
        );
      }

      res.json(
        BaseResponseDTO.success(result, "Running convey fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching running convey:", error);
      return AuthController.sendError(res, error);
    }
  }
  static async getStopConvey(req, res) {
    try {
      const { checkpost_id, date } = req.body; // Parse both checkpost_id and date

      // Pass both checkpost_id and date to your service function
      const result = await AuthService.getStopConvey(checkpost_id, date);

      if (!result) {
        return res.json(BaseResponseDTO.error("No stopped convey is there"));
      }

      res.json(
        BaseResponseDTO.success(result, "Stopped convey fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching stopped convey:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async getarrivalist(req, res) {
    try {
      // ✅ Read from request body
      const { checkpostid } = req.body;


      // ✅ Call service with checkpostid
      const result = await AuthService.getarrivalist(checkpostid);

      if (!result) {
        return res.json(
          BaseResponseDTO.error("No running convey found for today"),
        );
      }


      return res.json(
        BaseResponseDTO.success(result, "Running convey fetched successfully"),
      );
    } catch (error) {
      console.error("❌ Error in getarrivalist controller:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async stopConveyControl(req, res) {
    try {
      const result = await AuthService.stopConveyControl(req.body);

      if (!result.success) {
        // ❌ Service returned failure, send error response
        return res
          .status(400)
          .json(BaseResponseDTO.error(result.message, result.data || null));
      }

      // ✅ Service returned success
      res.json(BaseResponseDTO.success(result.data, result.message));
    } catch (error) {
      console.error("Error Stop convey control:", error);
      return AuthController.sendError(res, error, "Failed to stop convey control");
    }
  }

  static async getapprovecount(req, res) {
    try {
      const { checkpostid } = req.body;
      const result = await AuthService.getApprovedCountByConvey(checkpostid);
      res.json(
        BaseResponseDTO.success(result, "Approve count fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching approve count:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async getcurrentdateandtime(req, res) {
    try {
      const result = await AuthService.getCurrentDateAndTime();
      res.json(
        BaseResponseDTO.success(
          result,
          "Current date and time fetched successfully",
        ),
      );
    } catch (error) {
      console.error("Error fetching current date and time:", error);
      return AuthController.sendError(res, error);
    }
  }
  static async getCheckOutTrip(req, res) {
    try {
      const { checkpostid } = req.body;
      const result = await AuthService.getCheckOutTrip(checkpostid);
      res.json(
        BaseResponseDTO.success(
          result,
          "Check-out trip details fetched successfully",
        ),
      );
    } catch (error) {
      console.error("Error fetching check-out trip details:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async getspecialConvoyCheckOutTrip(req, res) {
    try {
      const { checkpostid } = req.body;
      const result =
        await AuthService.getspecialConvoyCheckOutTrip(checkpostid);
      res.json(
        BaseResponseDTO.success(
          result,
          "Check-out trip details fetched successfully",
        ),
      );
    } catch (error) {
      console.error("Error fetching check-out trip details:", error);
      return AuthController.sendError(res, error);
    }
  }

  static async updateCheckOutTrip(req, res) {
    try {
      const result = await AuthService.updateCheckOutTrip(req.body);

      if (!result.success) {
        // ❌ Service returned failure, send error response
        return res
          .status(400)
          .json(BaseResponseDTO.error(result.message, result.data || null));
      }

      // ✅ Service returned success
      res.json(BaseResponseDTO.success(result.data, result.message));
    } catch (error) {
      console.error("Error updating check-out trip:", error);
      return AuthController.sendError(res, error, "Failed to update check-out trip");
    }
  }

  static async startcheckout(req, res) {
    try {
      // console.log("▶ Start Checkout Payload:", req.body);

      const result = await AuthService.startcheckout(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json(BaseResponseDTO.error(result.message, result.data || null));
      }

      return res.json(BaseResponseDTO.success(result.data, result.message));
    } catch (error) {
      console.error("❌ Start checkout error:", error);
      return AuthController.sendError(res, error, "Failed to start checkout");
    }
  }

  static async getRunningCheckout(req, res) {
    try {
      const { checkpostid } = req.body;

      if (!checkpostid) {
        return res
          .status(400)
          .json(BaseResponseDTO.error("checkpostid is required"));
      }

      const result = await AuthService.getRunningCheckout(checkpostid);

      if (!result.success) {
        return res.status(500).json(BaseResponseDTO.error(result.message));
      }

      return res.json(BaseResponseDTO.success(result.data, result.message));
    } catch (error) {
      console.error("❌ getRunningCheckout error:", error);
      return res
        .status(500)
        .json(BaseResponseDTO.error("Internal server error"));
    }
  }
  static async stopcheckout(req, res) {
    try {
      // console.log("▶ Start Checkout Payload:", req.body);

      const result = await AuthService.stopcheckout(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json(BaseResponseDTO.error(result.message, result.data || null));
      }

      return res.json(BaseResponseDTO.success(result.data, result.message));
    } catch (error) {
      console.error("❌ Stop checkout error:", error);
      return AuthController.sendError(res, error, "Failed to stop checkout");
    }
  }
  static async generateCheckoutReport(req, res) {
    try {
      const { conveyid, checkpostid } = req.body;


      if (!conveyid || !checkpostid) {
        return res.status(400).json({
          success: false,
          message: "conveyid and checkpostid are required",
        });
      }

      const report = await AuthService.generateCheckoutReport({
        conveyid,
        checkpostid,
      });

      return res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error("❌ generateCheckoutReport error:", error);
      return AuthController.sendError(res, error, "Failed to generate checkout report");
    }
  }

  static async getPoliceDesignation(req, res) {
    try {
      const data = await AuthService.getDesignations();

      return res.status(200).json({
        success: true,
        data,
        message: "Designations fetched successfully",
      });
    } catch (error) {
      console.error("AuthController.getDesignations error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch designations",
      });
    }
  }

  static async getSpReport(req, res) {
    try {
      const { date } = req.body; // 👈 READ DATE FROM BODY
      const report = await AuthService.getSpReport(date);

      return res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error("❌ getSpReport error:", error);
      return AuthController.sendError(res, error, "Failed to generate SP report");
    }
  }

  static async getSpTripDetails(req, res) {
    try {
      const data = await AuthService.getSpTripDetails(req.body);
      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  //////get spl convoy report
  static async getSplConvoyTripDetailsbyRegId(req, res) {
    try {
      const result = await AuthService.getSplConvoyTripDetailsbyRegId(
        req.body,
        req.user.id,
      );
      res.json(
        BaseResponseDTO.success(result, "Trip Details Loaded successfully"),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }

  //////////police spl convoy report
  static async getSpecialConvoyReport(req, res) {
    try {
      const result = await AuthService.getSpecialConvoyReport(req.body);
      res.json(
        BaseResponseDTO.success(
          result,
          "Special Convoy Report fetched successfully",
        ),
      );
    } catch (error) {
      return AuthController.sendError(res, error);
    }
  }
}
module.exports = AuthController;
