const AuthService = require("../services/authService");
const BaseResponseDTO = require("../dto/response/BaseResponseDTO");
const { CaptchaGenerator } = require("captcha-canvas");
const db = require("../models"); // make sure index.js in /models returns db with initialized models

class AuthController {
  static async login(req, res) {
    try {
      const result = await AuthService.login(req.body, req);
      console.log("Login successful for user:", result);
      res.json(BaseResponseDTO.success(result, "Login successful"));
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  static async register(req, res) {
    try {
      console.log("Registering new user with data:", req.body);
      const result = await AuthService.register(req.body);
      res
        .status(201)
        .json(BaseResponseDTO.success(result, "Registration successful"));
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  ///////////registerPolice
  static async policeregisterNew(req, res) {
    try {
      console.log("Registering new user with data:", req.body);
      const result = await AuthService.registerNew(req.body);
      res
        .status(201)
        .json(BaseResponseDTO.success(result, "Registration successful"));
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  //===============Driver Status Registration================
  static async driverstatus(req, res) {
    try {
      console.log("Registering driver status with data:", req.body);
      const result = await AuthService.driverstatus(req.body);
      res
        .status(201)
        .json(
          BaseResponseDTO.success(
            result,
            "Driver status registration successful",
          ),
        );
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }
  //===========================vehicle status registration=============
  static async vehiclestatus(req, res) {
    try {
      console.log("Registering vehicle status with data:", req.body);
      const result = await AuthService.vehiclestatus(req.body);
      res
        .status(201)
        .json(
          BaseResponseDTO.success(
            result,
            "Vehicle status registration successful",
          ),
        );
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }
  //===================================================================

  static async registerNew(req, res) {
    try {
      console.log("Registering new user with data:", req.body);
      const result = await AuthService.registerNew(req.body);
      res
        .status(201)
        .json(BaseResponseDTO.success(result, "Registration successful"));
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  //===================getbyLicense========================
  static async getByLicense(req, res) {
    try {
      const { license } = req.query;

      if (!license) {
        return res
          .status(400)
          .json(BaseResponseDTO.error("License number is required"));
      }

      console.log("Fetching user by license:", license);

      const result = await AuthService.getByLicense(license);

      if (!result) {
        return res.status(404).json(BaseResponseDTO.error("User not found"));
      }

      res.json(BaseResponseDTO.success(result, "User fetched successfully"));
    } catch (error) {
      console.error("Error fetching user by license:", error);
      res
        .status(500)
        .json(BaseResponseDTO.error("Server error: " + error.message));
    }
  }

  //=======================getByMobilenumber==============================
  static async getByMobilenumber(req, res) {
    try {
      let mobile = req.body.Mobilenumber;
      console.log(
        "11111111111111111111111111111111111111111111111111111getByMobilenumber called with mobile:",
        mobile,
      );

      if (!mobile) {
        return res
          .status(400)
          .json(BaseResponseDTO.error("Mobile number is required"));
      }

      // console.log('Fetching user by mobile number:', mobile);

      const result = await AuthService.getByMobilenumber(mobile);

      if (!result) {
        return res.status(404).json(BaseResponseDTO.error("User not found"));
      }

      res.json(BaseResponseDTO.success(result, "User fetched successfully"));
    } catch (error) {
      console.error("Error fetching user by mobile number:", error);
      res
        .status(500)
        .json(BaseResponseDTO.error("Server error: " + error.message));
    }
  }
  //=============================================================================

  //driver_tbl registration
  static async registerDriver(req, res) {
    try {
      console.log("Registering new driver with data:", req.body);

      const result = await AuthService.registerDriver(req.body, req.user.id);
      res
        .status(201)
        .json(
          BaseResponseDTO.success(result, "Driver registration successful"),
        );
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }
  //driver delete
  static async deleteDriver(req, res) {
    try {
      const { dId } = req.body;
      console.log("Deleting driver with dId:", dId);

      if (!dId) {
        return res
          .status(400)
          .json(BaseResponseDTO.error("Driver ID is required"));
      }

      const result = await AuthService.deleteDriver(dId);

      if (!result) {
        return res.status(404).json(BaseResponseDTO.error("Driver not found"));
      }

      res.json(BaseResponseDTO.success(result, "Driver deleted successfully"));
    } catch (error) {
      res
        .status(500)
        .json(BaseResponseDTO.error("Server error: " + error.message));
    }
  }

  //vehicle delete
  static async deleteVehicle(req, res) {
    try {
      //console.log("Deleting vehicle with data:", req.body);
      const { vId } = req.body;

      if (!vId) {
        return res
          .status(400)
          .json(BaseResponseDTO.error("Vehicle ID is required"));
      }

      const result = await AuthService.deleteVehicle(vId);

      if (!result) {
        return res.status(404).json(BaseResponseDTO.error("Vehicle not found"));
      }

      res.json(BaseResponseDTO.success(result, "Vehicle deleted successfully"));
    } catch (error) {
      res
        .status(500)
        .json(BaseResponseDTO.error("Server error: " + error.message));
    }
  }

  //vehicle registration
  static async registerVehicle(req, res) {
    try {
      // console.log('Registering new vehicle with data:', req.body);
      // console.log(req.user.id);
      const result = await AuthService.registerVehicle(req.body, req.user.id);
      res
        .status(201)
        .json(
          BaseResponseDTO.success(result, "Vehicle registration successful"),
        );
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  //vehicle delete
  static async deleteVehicle(req, res) {
    try {
      //console.log("Deleting vehicle with data:", req.body);
      const { vId } = req.body;

      if (!vId) {
        return res
          .status(400)
          .json(BaseResponseDTO.error("Vehicle ID is required"));
      }

      const result = await AuthService.deleteVehicle(vId);

      if (!result) {
        return res.status(404).json(BaseResponseDTO.error("Vehicle not found"));
      }

      res.json(BaseResponseDTO.success(result, "Vehicle deleted successfully"));
    } catch (error) {
      res
        .status(500)
        .json(BaseResponseDTO.error("Server error: " + error.message));
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.json(BaseResponseDTO.success(result, "Token refreshed successfully"));
    } catch (error) {
      res.status(401).json(BaseResponseDTO.error(error.message));
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
      res.status(401).json(BaseResponseDTO.error(error.message));
    }
  }
  //---------------------------------------

  //get_vehicle_list_by_regId
  static async getVehicleListbyRegId(req, res) {
    try {
      const result = await AuthService.getVehicleListbyRegId(
        req.body,
        req.user.id,
      );
      res.json(
        BaseResponseDTO.success(result, "Vehicle List Loaded successfully"),
      );
    } catch (error) {
      res.status(401).json(BaseResponseDTO.error(error.message));
    }
  }
  //-----------------------------------

  // Get Destrict-----------------------
  static async getDistrict(req, res) {
    try {
      //throw Error('No districts found in database');
      //console.log(req.bod);
      const result = await AuthService.getDistrict(req.body);
      //throw Error('No districts found in database');
      res.json(
        BaseResponseDTO.success(result, "District List Loaded successfully"),
      );
    } catch (error) {
      res.status(401).json(BaseResponseDTO.error(error.message));
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
      res.status(401).json(BaseResponseDTO.error(error.message));
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
      res.status(401).json(BaseResponseDTO.error(error.message));
    }
  }

  //------------------------------------

  //Create new Trip
  static async newtrip(req, res) {
    try {
      const result = await AuthService.newtrip(req.body, req.user.id);
      res.json(BaseResponseDTO.success(result, "Trip Created Successfully"));
    } catch (error) {
      res.status(401).json(BaseResponseDTO.error(error.message));
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
      res.status(401).json(BaseResponseDTO.error(error.message));
    }
  }

  //--------------------------------
  //-----------------delete trip
  static async deletetrip(req, res) {
    try {
      //console.log("Deleting vehicle with data:", req.body);
      const { tId } = req.body;

      if (!tId) {
        return res
          .status(400)
          .json(BaseResponseDTO.error("Trip ID is required"));
      }

      const result = await AuthService.deletetrip(tId);

      if (!result) {
        return res.status(404).json(BaseResponseDTO.error("Trip not found"));
      }

      res.json(BaseResponseDTO.success(result, "Trip deleted successfully"));
    } catch (error) {
      res
        .status(500)
        .json(BaseResponseDTO.error("Server error: " + error.message));
    }
  }

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
      res.status(401).json(BaseResponseDTO.error(error.message));
    }
  }
  //-------------------------

  //get_trip_details_by_tId
  static async getTripDetailsbyTripId(req, res) {
    try {
      const result = await AuthService.getTripDetailsbyTripId(req.body);
      res.json(
        BaseResponseDTO.success(result, "Trip Details Loaded successfully"),
      );
    } catch (error) {
      res.status(401).json(BaseResponseDTO.error(error.message));
    }
  }
  //-------------------------

  //get tripdetails by date
  static async getTripDetailsbydt(req, res) {
    try {
      const result = await AuthService.getTripDetailsbydt(req.body);
      res.json(BaseResponseDTO.success(result, "Trip Details by date"));
    } catch (error) {
      res.status(401).json(BaseResponseDTO.error(error.message));
    }
  }
  //---------------------------------getPendingTripDetailsbydt

  //get Pending tripdetails by date
  static async getPendingTripDetailsbydt(req, res) {
    try {
      const result = await AuthService.getPendingTripDetailsbydt(req.body);
      res.json(BaseResponseDTO.success(result, "Pending Trip Details by date"));
    } catch (error) {
      res.status(401).json(BaseResponseDTO.error(error.message));
    }
  }
  //-------get tip approval--------------------
  static async tripApproval(req, res) {
    try {
      console.log("Trip approval request received with data:", req.body);

      const result = await AuthService.tripApproval(req.body);

      return res.json(
        BaseResponseDTO.success(result, "Trip Approved Successfully"),
      );
    } catch (error) {
      console.error("Trip approval failed:", error.message);

      return res
        .status(500) // changed from 401
        .json(BaseResponseDTO.error(error.message || "Trip approval failed"));
    }
  }

  //--------------------------Trip Verify---------------------
  static async tripVerify(req, res) {
    try {
      console.log("Trip Verification request received with data:", req.body);

      const result = await AuthService.tripVerify(req.body);

      return res.json(
        BaseResponseDTO.success(result, "Trip Verified Successfully"),
      );
    } catch (error) {
      console.error("Trip Verification failed:", error.message);

      return res
        .status(500) // changed from 401
        .json(
          BaseResponseDTO.error(error.message || "Trip verification failed"),
        );
    }
  }

  //---------------------------------

  static async getallVerifiedTrips(req, res) {
    try {
      console.log("📥 Verified Trip list request received");

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

      return res
        .status(500)
        .json(
          BaseResponseDTO.error(
            error.message || "Failed to fetch verified trips",
          ),
        );
    }
  }
  //==========================

  static async logout(req, res) {
    try {
      await AuthService.logout(req.user.id);
      res.json(BaseResponseDTO.success(null, "Logout successful"));
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  static async profile(req, res) {
    try {
      const UserResponseDTO = require("../dto/response/UserResponseDTO");
      const userResponse = new UserResponseDTO(req.user);
      res.json(
        BaseResponseDTO.success(userResponse, "Profile retrieved successfully"),
      );
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }
  // //get tripdetails by date
  // static async getTripDetails(res) {
  //   try {
  //     const result = await AuthService.getallTripDetails();
  //     //console.log("Trip details fetched successfully:", result);
  //     res.json(BaseResponseDTO.success(result, "Trip Details by date"));
  //   } catch (error) {
  //     res.status(401).json(BaseResponseDTO.error(error.message));
  //   }
  // }
  static async getTripDetails(req, res) {
    try {
      // req.body contains { checkpostid: someValue }
      const params = req.body;
      const result = await AuthService.getallTripDetails(params);
      //console.log("Trip details fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "All Trip Details"));
    } catch (error) {
      console.error("Error fetching trip details:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }
  static async getuserprofile(req, res) {
    try {
      // req.body contains { id: someValue }
      const { userId } = req.body;
      const result = await AuthService.getProfileByUserId(userId);
      console.log("User profile fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "User Profile Details"));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      const result = await AuthService.updateProfile(req.body);

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
      // req.body contains { id: someValue }
      const { userId } = req.body;
      const result = await AuthService.getPoliceProfileByUserId(userId);
      console.log("User profile fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "User Profile Details"));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }

  static async editTripDetails(req, res) {
    try {
      // req.body contains { tripId: someValue, ...updateData }
      const { tripId } = req.body;
      const result = await AuthService.editTripDetailsByTripId(tripId);
      console.log("Trip details updated successfully:", result);
      res.json(
        BaseResponseDTO.success(result, "Trip details updated successfully"),
      );
    } catch (error) {
      console.error("Error updating trip details:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }
  static async updateTripPolice(req, res) {
    try {
      console.log("entire bdy", req.body);
      const result = await AuthService.updateTripPolice(req.body);
      res.json(
        BaseResponseDTO.success(result, "Trip police updated successfully"),
      );
    } catch (error) {
      console.error("Error updating trip police:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }

  static async getCheckOutReport(req, res) {
    try {
      // req.body contains { checkpostid: someValue }
      const params = req.body;
      const result = await AuthService.getCheckOutReport(params);
      console.log("Check out report fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "Check out Details"));
    } catch (error) {
      console.error("Error fetching check out details:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }

  // Today's Trip Details
  //   static async getTodaysTripDetails(req, res) {
  //   try {
  //     const db = require("../models");

  //     // Today date in YYYY-MM-DD (matches DATEONLY)
  //     const today = new Date().toISOString().split("T")[0];

  //     // You can later make checkpost_id dynamic
  //     const checkpostId = 1;

  //     const result = await db.ApproveTrip.findAll({
  //       where: {
  //         checkpost_id: checkpostId,
  //         astatus: 1,
  //         arrdate: today,
  //       },
  //       include: [
  //         { model: db.Trip, as: "trip" },
  //         { model: db.TConvey, as: "convey" },
  //         { model: db.OriginDestination, as: "checkpost" },
  //         { model: db.PoliceRegistration, as: "approverOfficer" },
  //       ],
  //       order: [["arrtime", "ASC"]],
  //     });

  //     return res.json(
  //       BaseResponseDTO.success(result, "Today's Trip Details fetched successfully")
  //     );
  //   } catch (error) {
  //     console.error("Error fetching today's trip details:", error);
  //     return res
  //       .status(500)
  //       .json(BaseResponseDTO.error(error.message));
  //   }
  // }

  // ================= TODAY'S TRIP DETAILS =================
  // static async getTodaysTripDetails(req, res) {
  //   try {
  //     const data = await AuthService.getTodaysTripDetails();

  //     return res.json(
  //       BaseResponseDTO.success(
  //         data,
  //         "Today's Trip Details fetched successfully"
  //       )
  //     );
  //   } catch (error) {
  //     console.error("Today's Trip Details Error:", error.message);
  //     return res
  //       .status(500)
  //       .json(BaseResponseDTO.error(error.message));
  //   }
  // }

  //   static async getTodaysTripDetails(req, res) {
  //   try {
  //     const checkpostid = 1; // for now (can be dynamic later)

  //     const result = await AuthService.getTodaysTripDetails(checkpostid);

  //     return res.json({
  //       success: true,
  //       data: result,
  //     });
  //   } catch (error) {
  //     console.error("Error in getTodaysTripDetails:", error.message);
  //     return res.status(500).json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // }

  // static async getTodaysTripDetails(req, res, next) {
  //   try {
  //     const { checkpostid } = req.body;

  //     if (!checkpostid) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "checkpostid is required",
  //       });
  //     }

  //     const data = await AuthService.getTodaysTripDetails({
  //       checkpostid,
  //     });

  //     return res.json({
  //       success: true,
  //       data,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async getTodayConvoyTrips(req, res) {
    try {
      const payload = req.body.payload || req.body;

      console.log("Fetching convoy trips");
      console.log("Payload received:", payload);

      const result = await AuthService.todayConvoyTrips(payload);

      return res.json(
        BaseResponseDTO.success(
          result,
          "Convoy trip details fetched successfully",
        ),
      );
    } catch (error) {
      console.error("❌ getTodayConvoyTrips error:", error);
      return res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  static async freezePoliceUser(req, res) {
    try {
      // console.log("🟡 CONTROLLER BODY:", req.body);
      // console.log("🟡 CONTROLLER USER:", req.user);

      const result = await AuthService.freezePoliceUser(req.body, req.user);

      return res.json({
        success: true,
        message: "Freeze request received",
        data: result,
      });
    } catch (error) {
      console.error("Freeze Police Controller Error:", error);
      return res.status(500).json({
        success: false,
        message: "Freeze failed",
        error: error.message,
      });
    }
  }
  static async unfreezePoliceUser(req, res) {
    try {
      // console.log("🟡 CONTROLLER BODY:", req.body);
      // console.log("🟡 CONTROLLER USER:", req.user);

      const result = await AuthService.unfreezePoliceUser(req.body, req.user);

      return res.json({
        success: true,
        message: "Unfreeze request received",
        data: result,
      });
    } catch (error) {
      console.error("Unfreeze Police Controller Error:", error);
      return res.status(500).json({
        success: false,
        message: "Freeze failed",
        error: error.message,
      });
    }
  }
  static async getTodaysTripDetails(req, res) {
    try {
      const checkpostid = 1; // fixed for now
      const today = new Date().toISOString().split("T")[0];

      const data = await AuthService.getTodaysTripDetails({
        checkpostid,
        today,
      });

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
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

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update password",
      });
    }
  }

  //---------------------------------
  //filter search data
  static async tripfilterdata(req, res) {
    try {
      const result = await AuthService.getAllFilterdata(req.body);
      console.log("Trip details fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "All Trip Details"));
    } catch (error) {
      console.error("Error fetching trip details:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }

  static async getFrozenPoliceUsers(req, res) {
    try {
      const result = await AuthService.getFreezPolice();
      // console.log("Freezed police details fetched successfully:", result);
      res.json(BaseResponseDTO.success(result, "Freezed police details"));
    } catch (error) {
      console.error("Error fetching freezed  police details:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }

  static async deletePoliceUser(req, res) {
    try {
      const { policeId } = req.body;

      console.log("🗑️ Delete Police Request:", policeId);

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
      return res.status(500).json({
        success: false,
        message: "Delete failed",
        error: error.message,
      });
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
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }
  ///////////registerPolice
  static async registerPolice(req, res) {
    try {
      console.log("Registering new police user with data:", req.body);
      const result = await AuthService.registerPolice(req.body);
      res
        .status(201)
        .json(
          BaseResponseDTO.success(result, "Police registration successful"),
        );
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  ///////////Police login
  static async loginPolice(req, res) {
    try {
      const result = await AuthService.loginPolice(req.body, req);
      console.log("Police login successful for user:", result);
      res.json(BaseResponseDTO.success(result, "Police login successful"));
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  //////////////Admin login
  static async loginAdmin(req, res) {
    try {
      const result = await AuthService.loginAdmin(req.body, req);
      res.json(BaseResponseDTO.success(result, "Admin login successful"));
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }

  ///////logout
  static async logout(req, res) {
    try {
      if (req.user?.userId) {
        // Remove refresh token for all user tables
        await Promise.all([
          db.Admin?.update(
            { refreshToken: null },
            { where: { id: req.user.userId } },
          ),
          db.PoliceUser?.update(
            { refreshToken: null },
            { where: { id: req.user.userId } },
          ),
          db.User?.update(
            { refreshToken: null },
            { where: { id: req.user.userId } },
          ),
        ]);
      }

      req.session.destroy(() => {});
      res.clearCookie("connect.sid");

      res.json({ success: true });
    } catch (err) {
      res.json({ success: true });
    }
  }

  static async getconveywiseReport(req, res) {
    try {
      const result = await AuthService.conveywise(req.body);
      console.log("Convey wise report fetched successfully:", result);
      res.json(
        BaseResponseDTO.success(
          result,
          "Convey wise report fetched successfully",
        ),
      );
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }
  static async otpVerification(req, res) {
    try {
      const result = await AuthService.verifyCitizenOtp(req.body);
      console.log("OTP verification successful:", result);
      res.json(BaseResponseDTO.success(result, "OTP verification successful"));
    } catch (error) {
      res.status(400).json(BaseResponseDTO.error(error.message));
    }
  }
  static async adminlogin(req, res) {
    try {
      const { userid, password } = req.body;
      const result = await AuthService.adminlogin({ userid, password });

      if (!result.success) {
        return res.status(401).json(result); // 401 Unauthorized for bad creds
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Controller admin login error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
  static async getConveyDetails(req, res) {
    try {
      const { checkpostid } = req.body; // extract only the ID
      const result = await AuthService.getConveyDetails(checkpostid);

      console.log("Convey details fetched successfully:", result);
      res.json(
        BaseResponseDTO.success(result, "Convey details fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching convey details:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }
  static async getAllTodayConveyReports(req, res) {
    try {
      const { Date, locationid } = req.body; // extract from request body

      const result = await AuthService.getAllTodayConveyReports({
        Date,
        locationid,
      });

      console.log("All today's convey reports fetched successfully:", result);

      res.json(
        BaseResponseDTO.success(
          result,
          "All today's convey reports fetched successfully",
        ),
      );
    } catch (error) {
      console.error("Error fetching all today's convey reports:", error);
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res
        .status(500)
        .json(
          BaseResponseDTO.error("Failed to add convey control", error.message),
        );
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
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res.status(500).json(BaseResponseDTO.error(error.message));
    }
  }

  static async getarrivalist(req, res) {
    try {
      // ✅ Read from request body
      const { checkpostid } = req.body;

      console.log(
        "🛰️ Incoming request for arrival list, checkpost_id:",
        checkpostid,
      );

      // ✅ Call service with checkpostid
      const result = await AuthService.getarrivalist(checkpostid);

      if (!result) {
        console.log(
          "⚠️ No running convey found for today at checkpost:",
          checkpostid,
        );
        return res.json(
          BaseResponseDTO.error("No running convey found for today"),
        );
      }

      console.log("✅ Running convey fetched successfully:", result);

      return res.json(
        BaseResponseDTO.success(result, "Running convey fetched successfully"),
      );
    } catch (error) {
      console.error("❌ Error in getarrivalist controller:", error);
      return res.status(500).json(BaseResponseDTO.error(error.message));
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
      res
        .status(500)
        .json(
          BaseResponseDTO.error("Failed to stop convey control", error.message),
        );
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
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res.status(500).json(BaseResponseDTO.error(error.message));
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
      res
        .status(500)
        .json(
          BaseResponseDTO.error(
            "Failed to update check-out trip",
            error.message,
          ),
        );
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
      return res
        .status(500)
        .json(BaseResponseDTO.error("Failed to start checkout", error.message));
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
      return res
        .status(500)
        .json(BaseResponseDTO.error("Failed to stop checkout", error.message));
    }
  }
  static async generateCheckoutReport(req, res) {
    try {
      const { conveyid, checkpostid } = req.body;

      console.log("Generating checkout report for:", { conveyid, checkpostid });

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
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate checkout report",
      });
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
      console.log("datata", date);
      const report = await AuthService.getSpReport(date);

      return res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error("❌ getSpReport error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate SP report",
      });
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
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = AuthController;
