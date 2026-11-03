// Security rules from the VAPT audit. Models are mocked: no database needed.
process.env.SESSION_SECRET ||= "test-session-secret";
process.env.JWT_SECRET ||= "test-jwt-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
process.env.ALLOWED_ORIGINS ||= "http://localhost";

const db = require("../src/models");
const AuthService = require("../src/services/authService");
const { recordFailedLogin } = require("../src/utils/loginLockout");
const { verifyOtp } = require("../src/utils/otp");
const errorHandler = require("../src/middleware/errorHandler");
const config = require("../src/config/environment");

afterEach(() => jest.restoreAllMocks());

const ownerOf = (reg_id) =>
  jest.spyOn(db.Registration, "findOne").mockResolvedValue(reg_id ? { reg_id } : null);

describe("citizens can only delete their own records", () => {
  test("trip delete is limited to the caller's reg_id", async () => {
    ownerOf("REG_B");
    const update = jest.spyOn(db.Trip, "update").mockResolvedValue([0]);

    expect(await AuthService.deletetrip("TRIP_OF_A", 2)).toBe(false);
    expect(update.mock.calls[0][1].where).toMatchObject({ tId: "TRIP_OF_A", reg_id: "REG_B" });
  });

  test("driver of another account is not touched", async () => {
    ownerOf("REG_B");
    jest.spyOn(db.DriverStatus, "count").mockResolvedValue(0);
    const update = jest.spyOn(db.Driver, "update");

    expect(await AuthService.deleteDriver(7, 2)).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  test("vehicle of another account is not touched", async () => {
    ownerOf("REG_B");
    jest.spyOn(db.VehicleStatus, "count").mockResolvedValue(0);
    const update = jest.spyOn(db.Vehicle, "update");

    expect(await AuthService.deleteVehicle(9, 2)).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  test("own vehicle is deleted", async () => {
    ownerOf("REG_B");
    jest.spyOn(db.VehicleStatus, "count").mockResolvedValue(1);
    jest.spyOn(db.Vehicle, "update").mockResolvedValue([1]);

    expect(await AuthService.deleteVehicle(9, 2)).toBe(true);
  });
});

describe("trip approval", () => {
  test("rejects a status the UI never sends, before touching the DB", async () => {
    const tx = jest.spyOn(db.sequelize, "transaction");
    await expect(
      AuthService.tripApproval({ tId: "T1", buttonId: 99, astatus: 1 }, "REG_P1"),
    ).rejects.toMatchObject({ expose: true, message: "Invalid approval status" });
    expect(tx).not.toHaveBeenCalled();
  });
});

describe("login lockout", () => {
  // Fake account whose counter lives in "the database" (shared by requests)
  const fakeAccount = (store) => ({
    failedLoginAttempts: 0,
    async increment() { store.attempts += 1; },
    async reload() { this.failedLoginAttempts = store.attempts; },
    async save() { store.attempts = this.failedLoginAttempts; store.lockedUntil = this.lockedUntil; },
  });

  test("parallel wrong passwords all count and lock the account", async () => {
    const store = { attempts: 0 };
    const results = await Promise.all(
      Array.from({ length: config.LOCKOUT_MAX_ATTEMPTS }, () =>
        recordFailedLogin(fakeAccount(store)),
      ),
    );
    expect(results).toContain(true);
    expect(store.lockedUntil).toBeGreaterThan(Date.now());
  });
});

describe("OTP", () => {
  test("no guess is compared once the attempt limit is used up", async () => {
    jest.spyOn(db.AuthOtp, "findOne").mockResolvedValue({
      id: 1, otpHash: "x", expiresAt: Date.now() + 60000, attempts: 0,
    });
    // The conditional UPDATE matched no row: the limit was reached meanwhile
    jest.spyOn(db.AuthOtp, "update").mockResolvedValue([0]);
    const bcrypt = require("bcryptjs");
    const compare = jest.spyOn(bcrypt, "compare");

    expect(await verifyOtp("user", 1, "register", "123456")).toBe(false);
    expect(compare).not.toHaveBeenCalled();
  });
});

describe("error handler", () => {
  const run = (err) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.spyOn(console, "error").mockImplementation(() => {});
    errorHandler(err, {}, res);
    return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
  };

  test("hides database messages and stack traces", () => {
    const err = Object.assign(new Error("Unknown column 'x' in 'trip_tbl'"), {
      name: "SequelizeDatabaseError",
    });
    const { status, body } = run(err);
    expect(status).toBe(500);
    expect(body.message).toBe("Internal Server Error");
    expect(body.stack).toBeUndefined();
  });

  test("shows messages marked safe", () => {
    const { status, body } = run(Object.assign(new Error("Trip not found"), { expose: true, status: 404 }));
    expect(status).toBe(404);
    expect(body.message).toBe("Trip not found");
  });
});
