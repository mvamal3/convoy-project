const express = require("express");
const AuthController = require("../controllers/authController");
const svgCaptcha = require("svg-captcha");
const crypto = require("crypto");
const csrfProtection = require("../middleware/csrfProtection");

const {
  authenticate,
  authenticateToken,
  authenticatePoliceToken,
  authenticateAdmin,
  authenticatePoliceOrAdmin,
  authenticateAny,
} = require("../middleware/auth");
const {
  authLimiter,
  refreshLimiter,
  highLimitApiLimiter,
  createAccountLimiter,
} = require("../middleware/rateLimiter");

const router = express.Router();

// Citizen or police (trip editing is shared by both)
const authenticateUserOrPolice = authenticate("user", "police");

// ==================== Public: CAPTCHA, CSRF, login ====================

router.get("/captcha", (req, res) => {
const captcha = svgCaptcha.create({
  size: 6,
  noise: 3,
  color: true,
  background: "#1e40af",
  charPreset: "23456789",
  width: 120,
  height: 40,
});

  // Keep the answer only on the server.
  req.session.captcha = captcha.text;
  req.session.captchaTime = Date.now();

  // Prevent the browser from caching the CAPTCHA.
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");

  // Save the session before returning the image.
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({
        message: "Unable to generate CAPTCHA",
      });
    }

    res.type("svg").send(captcha.data);
  });
});

router.get("/csrf-token", (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");

  req.session.csrfToken = token;

  res.set("Cache-Control", "no-store");

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Unable to initialize CSRF protection",
      });
    }

    res.json({ csrfToken: token });
  });
});

router.post("/login", authLimiter, csrfProtection, AuthController.login);
router.post("/Policelogin", authLimiter, csrfProtection, AuthController.loginPolice);
router.post("/Adminlogin", authLimiter, csrfProtection, AuthController.loginAdmin);

// The refresh token is read from an httpOnly cookie, so require CSRF token
router.post("/refresh-token", refreshLimiter, csrfProtection, AuthController.refreshToken);
router.post("/logout", authenticateAny, AuthController.logout);
router.get("/session", authenticateAny, AuthController.getSession);

// ==================== Public: citizen registration ====================

router.post("/register", createAccountLimiter, csrfProtection, AuthController.registerNew);
router.post("/verify-citizen-otp", authLimiter, csrfProtection, AuthController.otpVerification);
router.get("/getDistrict", AuthController.getDistrict);
router.post("/getSubDistrict", AuthController.getSubDistrict);
router.post("/getVillage", AuthController.getVillage);

// ==================== Citizen ====================

router.get("/profile", authenticateToken, AuthController.profile);
router.post("/getuserprofile", authenticateToken, AuthController.getuserprofile);
router.post("/update-profile", authenticateToken, AuthController.updateProfile);

router.post("/driver-registration", authenticateToken, AuthController.registerDriver);
router.post("/delete-driver", authenticateToken, AuthController.deleteDriver);
router.post("/driverstatus", authenticateToken, AuthController.driverstatus);
router.post("/get-driver-list", authenticateToken, AuthController.getDriveListbyRegId);
router.get("/getlicense", authenticateToken, AuthController.getByLicense);
router.get("/getdriver", authenticateToken, AuthController.getByMobilenumber);

router.post("/vehicle-new", authenticateToken, AuthController.registerVehicle);
router.post("/delete-vehicle", authenticateToken, AuthController.deleteVehicle);
router.post("/vehiclestatus", authenticateToken, AuthController.vehiclestatus);
router.get("/get-vehicle-list", authenticateToken, AuthController.getVehicleListbyRegId);

router.post("/trip-new", authenticateToken, AuthController.newtrip);
router.post("/spl-trip-new", authenticateToken, AuthController.splnewtrip);
router.post("/delete-trip", authenticateToken, AuthController.deletetrip);
router.get("/get-trip-details", authenticateToken, AuthController.getTripDetailsbyRegId);
router.post("/get-trip-details-citizen", authenticateToken, AuthController.getTripDetailsbyRegIdCitizen);
router.post("/get-trip-details-by-tId-user", authenticateToken, AuthController.getTripDetailsbyTripId);
router.get("/get-trip-details-Spl-convoy", authenticateToken, AuthController.getSplConvoyTripDetailsbyRegId);

// ==================== Citizen and police ====================

// Citizens are limited to their own trips inside the controller
router.post("/edittripdetails", authenticateUserOrPolice, AuthController.editTripDetails);
router.post("/update-trip", authenticateUserOrPolice, AuthController.updateTripPolice);

// ==================== Any signed-in account ====================

router.get("/get-all_origin_destination", authenticateAny, AuthController.getOriginDestination);
router.post("/get-convey-time", authenticateAny, AuthController.getConveyTimeByLocId);
router.post("/get-convey-details", authenticateAny, AuthController.getConveyDetails);
router.post("/getstopconvey", authenticateAny, AuthController.getStopConvey);
router.get("/getcurrentdateandtime", authenticateAny, AuthController.getcurrentdateandtime);
router.post("/get-nationality", authenticateAny, AuthController.getNationality);

// ==================== Police ====================

router.post("/getppoliceprofile", authenticatePoliceOrAdmin, AuthController.getPoliceProfile);

router.post("/get-trip-details-by-tId", authenticatePoliceOrAdmin, AuthController.getTripDetailsbyTripId);
router.post("/get-trip-details-by-dt", authenticatePoliceToken, AuthController.getTripDetailsbydt);
router.post("/get-Pending-trip-details-by-dt", authenticatePoliceToken, AuthController.getPendingTripDetailsbydt);
router.post("/get-all-Approve-pending-rejected-trip-details", authenticatePoliceToken, AuthController.getApproeveTripDetails);
router.post("/get-all-Approve-trip-details", authenticatePoliceToken, AuthController.getallApproeveTripDetails);
router.post("/get-all-Approve-Rejected-Pending-trip-details", authenticatePoliceToken, AuthController.getallApproeveRejectedPendingTripDetails);
router.post("/get-all-trip-details", authenticatePoliceToken, AuthController.getTripDetails);
router.post("/get-trips-by-filters", authenticatePoliceToken, AuthController.tripfilterdata);
router.post("/get-all-details-by-tripid", authenticatePoliceToken, AuthController.getAllDetailsByTripId);
router.post("/get-Verified-trip-details", authenticatePoliceToken, AuthController.getallVerifiedTrips);
router.post("/getapprovecount", authenticatePoliceToken, AuthController.getapprovecount);

router.post("/trip-verify", authenticatePoliceToken, AuthController.tripVerify);
router.post("/trip-approval", authenticatePoliceToken, AuthController.tripApproval);

router.post("/start-convoy", authenticatePoliceToken, AuthController.addConveyControl);
router.post("/stop-convoy", authenticatePoliceToken, AuthController.stopConveyControl);
router.post("/getrunningconvey", authenticatePoliceToken, AuthController.getRunningConvey);

router.post("/start-checkout", authenticatePoliceToken, AuthController.startcheckout);
router.post("/get-running-checkout", authenticatePoliceToken, AuthController.getRunningCheckout);
router.post("/stop-checkout", authenticatePoliceToken, AuthController.stopcheckout);
router.post("/getcheckouttrip", authenticatePoliceToken, AuthController.getCheckOutTrip);
router.post("/getSpecialConvoycheckouttrip", authenticatePoliceToken, AuthController.getspecialConvoyCheckOutTrip);
router.post("/update-checkout-trip", authenticatePoliceToken, AuthController.updateCheckOutTrip);

router.post("/getarrivallist", authenticatePoliceToken, AuthController.getarrivalist);
router.post("/convey-wise-report", authenticatePoliceToken, highLimitApiLimiter, AuthController.getconveywiseReport);
router.post("/get-all-today-convey-reports", authenticatePoliceToken, AuthController.getAllTodayConveyReports);
router.post("/getcheckoutreport", authenticatePoliceToken, AuthController.getCheckOutReport);
router.post("/specialgetcheckoutreport", authenticatePoliceToken, AuthController.getSpecialCheckOutReport);
router.post("/generate-checkout-report", authenticatePoliceToken, AuthController.generateCheckoutReport);
router.post("/get-special-convoy-report", authenticatePoliceToken, AuthController.getSpecialConvoyReport);
router.post("/get-sp-report", authenticatePoliceToken, AuthController.getSpReport);
router.post("/sp/trip-details", authenticatePoliceToken, AuthController.getSpTripDetails);

router.post("/todays-trip-details", authenticatePoliceOrAdmin, highLimitApiLimiter, AuthController.getTodayConvoyTrips);

// ==================== Admin ====================

router.post("/policeregister", authenticateAdmin, AuthController.registerPolice);
router.post("/update-police-profile", authenticateAdmin, AuthController.updatePoliceProfile);
router.post("/change-police-password", authenticateAdmin, AuthController.changePolicePassword);
router.post("/delete-police-user", authenticateAdmin, AuthController.deletePoliceUser);
router.post("/freeze-police-user", authenticateAdmin, AuthController.freezePoliceUser);
router.post("/Unfreeze-police-user", authenticateAdmin, AuthController.unfreezePoliceUser);
router.post("/get-frozen-police-users", authenticateAdmin, AuthController.getFrozenPoliceUsers);
router.post("/get-registered-police", authenticateAdmin, AuthController.getRegisteredPolice);
router.post("/get-police-designation", authenticateAdmin, AuthController.getPoliceDesignation);
router.get("/get-all_origin_destination_Police", authenticateAdmin, AuthController.getOriginDestination);

module.exports = router;
