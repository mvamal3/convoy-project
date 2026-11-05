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

describe("duplicate vehicle numbers", () => {
  const vehicle = {
    vOwnName: "Asha",
    vNum: "an-01 m9003",
    vCat: "Car",
    ownershipType: "Private",
    vPurpose: "Passenger",
    vSeating: 4,
  };

  test("same user with the number active is refused", async () => {
    jest.spyOn(db.Registration, "findOne").mockResolvedValue({ get: () => "REG_A" });
    const count = jest.spyOn(db.VehicleStatus, "count").mockResolvedValue(1);
    const create = jest.spyOn(db.Vehicle, "create");

    await expect(AuthService.registerVehicle(vehicle, 1)).rejects.toMatchObject({
      status: 409,
      expose: true,
    });
    expect(create).not.toHaveBeenCalled();
    expect(count.mock.calls[0][0].where).toEqual({ reg_id: "REG_A" });
    expect(count.mock.calls[0][0].include[0].where.status).toBe(1);
  });

  test("no active match is saved", async () => {
    jest.spyOn(db.Registration, "findOne").mockResolvedValue({ get: () => "REG_A" });
    jest.spyOn(db.VehicleStatus, "count").mockResolvedValue(0);
    jest.spyOn(db.VehicleStatus, "create").mockResolvedValue({});
    const create = jest.spyOn(db.Vehicle, "create").mockResolvedValue({ vId: 5 });

    await AuthService.registerVehicle(vehicle, 1);
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe("duplicate driver licenses", () => {
  const driver = {
    licenseNo: "an-01/2020",
    title: "Mr",
    dFirstName: "Ravi",
    dLastName: "Kumar",
    son_of: "Mohan",
    residence_of: "Port Blair",
    gender: "Male",
    phNo: "9876543210",
  };

  test("same user with the license active is refused", async () => {
    jest.spyOn(db.Registration, "findOne").mockResolvedValue({ get: () => "REG_A" });
    const count = jest.spyOn(db.DriverStatus, "count").mockResolvedValue(1);
    const create = jest.spyOn(db.Driver, "create");

    await expect(AuthService.registerDriver(driver, 1)).rejects.toMatchObject({
      status: 409,
      expose: true,
    });
    expect(create).not.toHaveBeenCalled();
    expect(count.mock.calls[0][0].where).toEqual({ reg_id: "REG_A" });
    expect(count.mock.calls[0][0].include[0].where.dStatus).toBe("active");
  });

  test("no active match is saved", async () => {
    jest.spyOn(db.Registration, "findOne").mockResolvedValue({ get: () => "REG_A" });
    jest.spyOn(db.DriverStatus, "count").mockResolvedValue(0);
    jest.spyOn(db.DriverStatus, "create").mockResolvedValue({});
    jest.spyOn(db.sequelize, "transaction").mockImplementation((work) => work({}));
    const create = jest.spyOn(db.Driver, "create").mockResolvedValue({ dId: 5 });

    await AuthService.registerDriver(driver, 1);
    expect(create).toHaveBeenCalledTimes(1);
  });
});

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

describe("special convoy route", () => {
  const JWTConfig = require("../src/config/jwt");
  const { authenticateScs } = require("../src/middleware/auth");

  const callAs = async (typ, role) => {
    jest.spyOn(JWTConfig, "verifyAccessToken").mockReturnValue({ typ, userId: "u1", tv: 0 });
    const account = { isActive: 1, isFrozen: 0, status: 1, role, tokenVersion: 0 };
    jest.spyOn(db.User, "findByPk").mockResolvedValue(account);
    jest.spyOn(db.PoliceUser, "findByPk").mockResolvedValue(account);

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await authenticateScs({ headers: { authorization: "Bearer x" } }, res, next);
    return { next, res };
  };

  test.each([["user", "scs"], ["police", "scs"]])("%s account with role %s is allowed", async (typ, role) => {
    const { next } = await callAs(typ, role);
    expect(next).toHaveBeenCalled();
  });

  test.each([["user", "user"], ["police", "police"]])("%s account with role %s is refused", async (typ, role) => {
    const { next, res } = await callAs(typ, role);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("trip editing", () => {
  const AuthController = require("../src/controllers/authController");

  const runUpdate = async (req, body) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const update = jest.spyOn(AuthService, "updateTripPolice").mockResolvedValue({ success: true });
    await AuthController.updateTripPolice({ ...req, body }, res);
    return { res, update };
  };
  const scs = { accountType: "police", user: { id: "p1", role: "scs" } };
  const police = { accountType: "police", user: { id: "p2", role: "police" } };
  const citizen = { accountType: "user", user: { id: "u1", role: "user" } };
  const edit = { payload: { action: "updateTrip", tId: "T1", data: { vId: 9, dId: 7 } } };

  test("scs in the police table cannot edit a trip it does not own", async () => {
    const owns = jest.spyOn(AuthService, "userOwnsTrips").mockResolvedValue(false);
    const { res, update } = await runUpdate(scs, [edit]);
    expect(owns).toHaveBeenCalledWith("p1", ["T1"]);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(update).not.toHaveBeenCalled();
  });

  test("other police can still edit any trip", async () => {
    const owns = jest.spyOn(AuthService, "userOwnsTrips");
    const { update } = await runUpdate(police, [edit]);
    expect(owns).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });

  test("own trip with another user's vehicle is refused", async () => {
    jest.spyOn(AuthService, "userOwnsTrips").mockResolvedValue(true);
    jest.spyOn(AuthService, "regIdOf").mockResolvedValue("REG_A");
    jest.spyOn(db.VehicleStatus, "count").mockResolvedValue(0);
    jest.spyOn(db.DriverStatus, "count").mockResolvedValue(1);
    const { res, update } = await runUpdate(citizen, [edit]);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(update).not.toHaveBeenCalled();
  });

  test("own trip with own vehicle and driver is saved", async () => {
    jest.spyOn(AuthService, "userOwnsTrips").mockResolvedValue(true);
    jest.spyOn(AuthService, "regIdOf").mockResolvedValue("REG_A");
    const vehicle = jest.spyOn(db.VehicleStatus, "count").mockResolvedValue(1);
    jest.spyOn(db.DriverStatus, "count").mockResolvedValue(1);
    const { update } = await runUpdate(citizen, [edit]);
    expect(vehicle.mock.calls[0][0].where).toEqual({ vId: 9, reg_id: "REG_A" });
    expect(update).toHaveBeenCalled();
  });
});

describe("IST date", () => {
  afterEach(() => jest.useRealTimers());

  test("convoy started at 01:30 IST records the Indian date, not yesterday", async () => {
    jest.useFakeTimers({ now: new Date("2026-11-04T20:00:00Z"), doNotFake: ["nextTick", "setImmediate"] });
    jest.spyOn(db.ConveyControl, "findOne").mockResolvedValue(null);
    const create = jest.spyOn(db.ConveyControl, "create").mockResolvedValue({});

    await AuthService.addConveyControl({ checkpost_id: 1, convey_id: 1 });
    expect(create.mock.calls[0][0].date).toBe("2026-11-05");
  });
});

describe("locked trips", () => {
  const { Op } = require("sequelize");
  const message = "Only pending trips dated today or later can be edited";
  const edit = (data) => [{ payload: { action: "updateTrip", tId: "T1", data } }];

  test("approved, rejected and past trips cannot be edited", async () => {
    const count = jest.spyOn(db.Trip, "count").mockResolvedValue(1);
    const tx = jest.spyOn(db.sequelize, "transaction");

    const result = await AuthService.updateTripPolice(edit({ vId: 9 }));
    expect(result).toMatchObject({ success: false, message });

    const where = count.mock.calls[0][0].where;
    expect(where.tId).toEqual(["T1"]);
    expect(where[Op.or][0].status[Op.ne]).toBe("1");
    expect(where[Op.or][1]).toEqual({ verifiystatus: 3 });
    expect(where[Op.or][2].date[Op.lt]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tx).not.toHaveBeenCalled();
  });

  test("a pending trip cannot be moved to a past date", async () => {
    jest.spyOn(db.Trip, "count").mockResolvedValue(0);
    const tx = jest.spyOn(db.sequelize, "transaction");

    const result = await AuthService.updateTripPolice(edit({ date: "2020-01-01" }));
    expect(result).toMatchObject({ success: false, message });
    expect(tx).not.toHaveBeenCalled();
  });

  test("a pending trip dated in the future can be edited", async () => {
    jest.spyOn(db.Trip, "count").mockResolvedValue(0);
    const tx = { commit: jest.fn(), rollback: jest.fn(), finished: false };
    jest.spyOn(db.sequelize, "transaction").mockResolvedValue(tx);
    const update = jest.spyOn(db.Trip, "update").mockResolvedValue([1]);

    const result = await AuthService.updateTripPolice(edit({ date: "2999-01-01" }));
    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalled();
  });

  test("approved and rejected trips cannot be deleted", async () => {
    ownerOf("REG_B");
    const update = jest.spyOn(db.Trip, "update").mockResolvedValue([0]);

    await AuthService.deletetrip("T1", 2);
    const where = update.mock.calls[0][1].where;
    expect(where.status[Op.notIn]).toEqual([0, 2, 3]);
    expect(where.verifiystatus[Op.ne]).toBe(3);
  });
});

describe("new trip ownership", () => {
  const trip = {
    declarationAccepted: true,
    vId: 9,
    dId: 7,
    origin: 1,
    destination: 2,
    date: "2026-11-10",
    convoyTime: "5",
    Passengers: [],
  };

  beforeEach(() => {
    jest.spyOn(db.Registration, "findOne").mockResolvedValue({ get: () => "REG_A", reg_id: "REG_A" });
    jest.spyOn(db.DriverStatus, "count").mockResolvedValue(1);
  });

  test("another user's vehicle is refused", async () => {
    jest.spyOn(db.VehicleStatus, "count").mockResolvedValue(0);
    const create = jest.spyOn(db.Trip, "create");

    await expect(AuthService.newtrip(trip, 1)).rejects.toMatchObject({ status: 403, expose: true });
    expect(create).not.toHaveBeenCalled();
  });

  test("another user's vehicle on the return leg is refused", async () => {
    const vehicles = jest.spyOn(db.VehicleStatus, "count").mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    const create = jest.spyOn(db.Trip, "create");

    await expect(
      AuthService.newtrip(
        { ...trip, isReturn: true, returnDate: "2026-11-11", returnConvoyTime: "6", returnTripData: { vId: 99 } },
        1,
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(vehicles.mock.calls[1][0].where.vId).toBe(99);
    expect(create).not.toHaveBeenCalled();
  });
});

describe("emergency convoy limit", () => {
  const special = (specialType) => ({
    vId: 9,
    dId: 7,
    origin: 1,
    destination: 2,
    date: "2026-11-10",
    convoyTime: "10:00",
    specialType,
    Passengers: [],
  });

  test("199 is the last emergency number", async () => {
    jest.spyOn(db.Registration, "findOne").mockResolvedValue({ get: () => "REG_A" });
    jest.spyOn(db.ConveyControl, "findOne").mockResolvedValue({ conveyid: 199 });
    const create = jest.spyOn(db.ConveyControl, "create");

    await expect(AuthService.splnewtrip(special(100), 1)).rejects.toMatchObject({
      status: 409,
      message: "Emergency convoy limit reached for today",
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("trip approval needs a running convoy", () => {
  const runApproval = async (convoyTime, running) => {
    const tx = { commit: jest.fn(), rollback: jest.fn() };
    jest.spyOn(db.sequelize, "transaction").mockResolvedValue(tx);
    jest.spyOn(db.Trip, "findOne").mockResolvedValue({ convoyTime, update: jest.fn() });
    const lookup = jest.spyOn(AuthService, "getCurrentRunningConvey").mockResolvedValue(running);
    const create = jest.spyOn(db.ApproveTrip, "create").mockResolvedValue({});
    jest.spyOn(db.VerifiedTrip, "create").mockResolvedValue({});
    return { lookup, create, tx };
  };
  const body = { tId: "T1", buttonId: 2, astatus: 1, convey_id: 77, checkpost_id: 8 };

  test("normal trip without a running convoy is refused", async () => {
    const { create, tx } = await runApproval("5", null);
    await expect(AuthService.tripApproval(body, "REG_P1", 1)).rejects.toMatchObject({
      status: 409,
      message: "No running convoy found",
    });
    expect(create).not.toHaveBeenCalled();
    expect(tx.rollback).toHaveBeenCalled();
  });

  test("uses the officer's checkpost and the running convoy, not the request body", async () => {
    const { lookup, create } = await runApproval("5", { conveyid: 3 });
    await AuthService.tripApproval(body, "REG_P1", 1);
    expect(lookup).toHaveBeenCalledWith(1);
    expect(create.mock.calls[0][0]).toMatchObject({ convey_id: 3, checkpost_id: 1 });
  });

  test("special convoy does not need a running convoy", async () => {
    const { lookup, create } = await runApproval(205, null);
    await AuthService.tripApproval(body, "REG_P1", 1);
    expect(lookup).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].convey_id).toBe(205);
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
