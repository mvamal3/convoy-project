const express = require("express");
const AuthController = require("../controllers/authController");
const svgCaptcha = require("svg-captcha");

const {
  authenticateToken,
  authenticatePoliceToken,
} = require("../middleware/auth");
const {
  authLimiter,
  highLimitApiLimiter,
  createAccountLimiter,
  passwordResetLimiter,
} = require("../middleware/rateLimiter");

const router = express.Router();
// CAPTCHA endpoint
router.get("/captcha", (req, res) => {
  const captchaText = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in session
  req.session.captcha = captchaText;
  req.session.captchaTime = Date.now();
  console.log("req.session.captcha", req.session.captcha);
  console.log("SESSION ID:", req.sessionID);

  // Return as JSON with text and instructions to create client-side
  res.json({
    success: true,
    text: captchaText,
    // Return instructions to create captcha client-side
    instructions: {
      backgroundColor: "#1e40af", // Blue
      textColor: "#ffffff", // White
      fontSize: "24px",
      fontFamily: "'Courier New', monospace",
      width: 120,
      height: 40,
    },
  });
});
// Apply auth rate limiter to login endpoint
router.post("/login", authLimiter, AuthController.login);

// Apply create account rate limiter to registration createAccountLimiter
router.post("/register", AuthController.registerNew);

// Apply create account rate limiter to registration createAccountLimiter
router.post("/policeregister", AuthController.registerPolice);

//////////police login
router.post("/Policelogin", AuthController.loginPolice);

//////////////logout
router.post("/logout", AuthController.logout);

//router.post("/checkauth", authenticatePoliceToken, AuthController.checkAuth);

////////////Admin Login
router.post("/Adminlogin", AuthController.loginAdmin);

//Apply create Driver_tbl rate limiter to registration
router.post(
  "/driver-registration",
  authenticateToken,
  AuthController.registerDriver,
);

router.post("/delete-driver", authenticateToken, AuthController.deleteDriver); // Assuming this is for driver delete

//vehicle
router.post("/vehicle-new", authenticateToken, AuthController.registerVehicle); // Assuming this is for vehicle registration
router.post("/delete-vehicle", authenticateToken, AuthController.deleteVehicle); // Assuming this is for vehicle delete

router.post("/trip-new", authenticateToken, AuthController.newtrip);

router.post("/spl-trip-new", authenticateToken, AuthController.splnewtrip);

router.post("/delete-trip", authenticateToken, AuthController.deletetrip); // Assuming this is for vehicle delete

// Apply auth rate limiter to token refresh

router.post("/refresh-token", authLimiter, AuthController.refreshToken);
router.post("/driverstatus", authenticateToken, AuthController.driverstatus);
router.post("/vehiclestatus", AuthController.vehiclestatus);
router.get("/getlicense", AuthController.getByLicense);
router.get("/getdriver", AuthController.getByMobilenumber);
router.get(
  "/get-driver-list",
  authenticateToken,
  AuthController.getDriveListbyRegId,
);
router.get(
  "/get-vehicle-list",
  authenticateToken,
  AuthController.getVehicleListbyRegId,
);
router.get("/getDistrict", AuthController.getDistrict);
router.post("/getSubDistrict", AuthController.getSubDistrict);
router.post("/getVillage", AuthController.getVillage);
router.get(
  "/get-trip-details",
  authenticateToken,
  AuthController.getTripDetailsbyRegId,
);
router.post("/get-trip-details-by-tId", AuthController.getTripDetailsbyTripId);
// router.post("/get-trip-details-by-tId", AuthController.getTripDetailsbyTripId);

router.post(
  "/get-trip-details-by-tId-user",
  authenticateToken,
  AuthController.getTripDetailsbyTripId,
);
router.post(
  "/get-trip-details-by-dt",
  authenticatePoliceToken,
  AuthController.getTripDetailsbydt,
);

router.post(
  "/get-Pending-trip-details-by-dt",
  authenticatePoliceToken,
  AuthController.getPendingTripDetailsbydt,
);

router.post(
  "/get-all-Approve-pending-rejected-trip-details",
  AuthController.getApproeveTripDetails,
);
// router.post(
//   "/get-all-Approve-trip-details",
//   authenticatePoliceToken,
//   AuthController.getallApproeveTripDetails
// );
router.post(
  "/get-all-Approve-trip-details",
  AuthController.getallApproeveTripDetails,
);

router.post(
  "/get-all-trip-details",
  authenticatePoliceToken,
  AuthController.getTripDetails,
);
router.post(
  "/get-trips-by-filters",
  authenticatePoliceToken,
  AuthController.tripfilterdata,
);

router.post("/trip-verify", authenticatePoliceToken, AuthController.tripVerify);

router.post(
  "/trip-approval",
  authenticatePoliceToken,
  AuthController.tripApproval,
);
router.get("/get-all_origin_destination", AuthController.getOriginDestination);
router.get(
  "/get-all_origin_destination_Police",
  AuthController.getOriginDestination,
);
router.post(
  "/convey-wise-report",
  authenticatePoliceToken,
  highLimitApiLimiter, // ✅ apply high-limit
  AuthController.getconveywiseReport,
);
router.post(
  "/get-all-today-convey-reports",
  AuthController.getAllTodayConveyReports,
);
router.post("/get-all-details-by-tripid", AuthController.getAllDetailsByTripId);

router.post("/get-convey-time", AuthController.getConveyTimeByLocId);
router.post("/verify-citizen-otp", AuthController.otpVerification);
router.post("/get-convey-details", AuthController.getConveyDetails);
router.get(
  "/get-vehicle-list",
  authenticateToken,
  AuthController.getVehicleListbyRegId,
);

router.post(
  "/start-convoy",
  authenticatePoliceToken,
  AuthController.addConveyControl,
);

router.post(
  "/stop-convoy",
  // authenticatePoliceToken,
  AuthController.stopConveyControl,
);
router.post(
  "/getrunningconvey",
  // authenticatePoliceToken,
  AuthController.getRunningConvey,
);
router.post(
  "/getstopconvey",
  // authenticatePoliceToken,
  AuthController.getStopConvey,
);
router.post(
  "/getcheckouttrip",
  //authenticatePoliceToken,
  AuthController.getCheckOutTrip,
);
router.post(
  "/getSpecialConvoycheckouttrip",
  //authenticatePoliceToken,
  AuthController.getspecialConvoyCheckOutTrip,
);

router.post(
  "/update-checkout-trip",
  authenticatePoliceToken,
  AuthController.updateCheckOutTrip,
);

router.post(
  "/getcheckoutreport",
  // authenticatePoliceToken,
  AuthController.getCheckOutReport,
);

router.post(
  "/getuserprofile",
  // authenticatePoliceToken,
  AuthController.getuserprofile,
);
router.post(
  "/getppoliceprofile",
  // authenticatePoliceToken,
  AuthController.getPoliceProfile,
);

router.post(
  "/edittripdetails",
  // authenticatePoliceToken,
  AuthController.editTripDetails,
);
router.post("/update-trip", AuthController.updateTripPolice);

router.post(
  "/update-profile",
  // authenticatePoliceToken,
  AuthController.updateProfile,
);

router.post(
  "/update-police-profile",
  // authenticatePoliceToken,
  AuthController.updatePoliceProfile,
);

router.post(
  "/getapprovecount",
  authenticatePoliceToken,
  AuthController.getapprovecount,
);
router.get(
  "/getcurrentdateandtime",
  // authenticatePoliceToken,
  AuthController.getcurrentdateandtime,
);

router.post("/admin", AuthController.adminlogin);

router.post("/getarrivallist", AuthController.getarrivalist);

router.post(
  "/get-Verified-trip-details",
  authenticatePoliceToken,
  AuthController.getallVerifiedTrips,
);

router.post(
  "/start-checkout",
  authenticatePoliceToken,
  AuthController.startcheckout,
);
router.post(
  "/get-running-checkout",
  authenticatePoliceToken,
  AuthController.getRunningCheckout,
);

router.post(
  "/stop-checkout",
  authenticatePoliceToken,
  AuthController.stopcheckout,
);

// // Today's Trip Details
//router.post("/todays-trip-details", AuthController.getTodaysTripDetails);
// router.post(
//   "/todays-trip-details",
//   AuthController.getTodaysTripDetails
// );

router.post(
  "/todays-trip-details",
  highLimitApiLimiter,
  AuthController.getTodayConvoyTrips,
);

router.post(
  "/change-police-password",
  // ✅ REQUIRED
  AuthController.changePolicePassword,
);

router.post("/freeze-police-user", AuthController.freezePoliceUser);

router.post("/Unfreeze-police-user", AuthController.unfreezePoliceUser);

router.post("/get-frozen-police-users", AuthController.getFrozenPoliceUsers);
router.post("/get-registered-police", AuthController.getRegisteredPolice);

router.post("/generate-checkout-report", AuthController.generateCheckoutReport);

router.post("/delete-police-user", AuthController.deletePoliceUser);
router.post("/get-police-designation", AuthController.getPoliceDesignation);

router.post("/get-sp-report", AuthController.getSpReport);
router.post("/sp/trip-details", AuthController.getSpTripDetails);

router.post("/get-nationality", AuthController.getNationality);

// Apply password reset limiter (if you implement password reset)
// router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
// router.post('/reset-password', passwordResetLimiter, AuthController.resetPassword);

// No special rate limiting for authenticated routes (uses general limiter)
router.post("/logout", authenticateToken, AuthController.logout);
router.get("/profile", authenticateToken, AuthController.profile);

module.exports = router;
