
class UpdateTripDTO {
  constructor(payload = {}) {

    console.log("UpdateTripDTO payload:", payload);
    this.action = payload.action;
    this.tId = payload.tId;
    this.pId = payload.pId;
    this.data = payload.data ?? {};
    this.errors = [];
    this.normalizedPassenger = null;
  }

  hasUnsafeCharacters(value) {
    return (
      /[<>]/.test(value) ||
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)
    );
  }

  isPositiveInteger(value) {
    return (
      (typeof value === "number" ||
        (typeof value === "string" && /^\d+$/.test(value))) &&
      Number.isSafeInteger(Number(value)) &&
      Number(value) > 0
    );
  }

  isValidText(value, maxLength = 300) {
    return (
      typeof value === "string" &&
      value.trim().length > 0 &&
      value.length <= maxLength &&
      !this.hasUnsafeCharacters(value)
    );
  }

  isValidOptionalText(value, maxLength = 300) {
    return (
      value === undefined ||
      value === null ||
      value === "" ||
      (typeof value === "string" &&
        value.length <= maxLength &&
        !this.hasUnsafeCharacters(value))
    );
  }

  normalizePassenger(data = {}) {
    const read = (...values) =>
      values.find((value) => value !== undefined && value !== null);

    const normalizeFlag = (value) => {
      if ([1, "1", true].includes(value)) return 1;
      if ([0, "0", false].includes(value)) return 0;
      return value;
    };

    return {
      passengerName: read(data.name, data.passengerName, data.PassengerName),
      fatherName: read(data.fatherName, data.FatherName),
      phoneNo: read(data.phone, data.phoneNo, data.PhoneNo),
      age: read(data.age, data.Age),
      gender: read(data.gender, data.Gender),
      isForeigner: normalizeFlag(
        read(data.isForeigner, data.IsForeigner),
      ),
      docType: read(data.docType, data.documentType, data.DocumentType),
      docId: read(
        data.docId,
        data.documentId,
        data.DocumentId,
        data.passportNo,
      ),
      nationality: read(data.nationality, data.Nationality),
      visaNumber: read(data.visaNumber, data.VisaNo, data.visaNo),
      residence: read(data.residence, data.Residence),
      lastStayInAndaman: read(
        data.lastStayInAndaman,
        data.LastStayInAndaman,
      ),
      isIslander: normalizeFlag(
        read(data.isIslander, data.IsIslander),
      ),
    };
  }

  validateTripUpdate() {
    const data = this.data;

    const allowedFields = [
      "vId",
      "dId",
      "origin",
      "destination",
      "date",
      "convoyTime",
      "remarks",
      "isTourist",
      "isTouristTrip",
      "specialType",
    ];

    const fields = Object.keys(data);

    if (fields.length === 0) {
      this.errors.push("At least one trip field is required");
      return;
    }

    if (fields.some((field) => !allowedFields.includes(field))) {
      this.errors.push("Unsupported trip field");
      return;
    }

    if (data.vId !== undefined && !this.isPositiveInteger(data.vId)) {
      this.errors.push("Invalid vehicle ID");
    }

    if (data.dId !== undefined && !this.isPositiveInteger(data.dId)) {
      this.errors.push("Invalid driver ID");
    }

    if (
      data.origin !== undefined &&
      !/^\d$/.test(String(data.origin))
    ) {
      this.errors.push("Invalid origin");
    }

    if (
      data.destination !== undefined &&
      !/^\d$/.test(String(data.destination))
    ) {
      this.errors.push("Invalid destination");
    }

    if (
      data.origin !== undefined &&
      data.destination !== undefined &&
      String(data.origin) === String(data.destination)
    ) {
      this.errors.push("Origin and destination must be different");
    }

    if (data.date !== undefined) {
      if (
        typeof data.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
      ) {
        this.errors.push("Date must use YYYY-MM-DD format");
      } else {
        const date = new Date(`${data.date}T00:00:00.000Z`);

        if (
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== data.date
        ) {
          this.errors.push("Invalid trip date");
        }
      }
    }

    if (
      data.convoyTime !== undefined &&
      !/^\d{1,2}$/.test(String(data.convoyTime))
    ) {
      this.errors.push("Invalid convoy time");
    }

    const touristValue =
      data.isTourist !== undefined
        ? data.isTourist
        : data.isTouristTrip;

    if (
      touristValue !== undefined &&
      ![0, 1, "0", "1", true, false].includes(touristValue)
    ) {
      this.errors.push("Invalid tourist trip value");
    }

    if (
      data.specialType !== undefined &&
      data.specialType !== null &&
      data.specialType !== "" &&
      !this.isPositiveInteger(data.specialType)
    ) {
      this.errors.push("Invalid special trip type");
    }

    if (
      data.remarks !== undefined &&
      data.remarks !== null &&
      (typeof data.remarks !== "string" ||
        data.remarks.length > 10000 ||
        this.hasUnsafeCharacters(data.remarks))
    ) {
      this.errors.push(
        "Remarks contain HTML tags, unsafe characters, or exceed 10000 characters",
      );
    }
  }

  validatePassenger() {
    const p = this.normalizePassenger(this.data);
    this.normalizedPassenger = p;

    const namePattern = /^[A-Za-z\s.'-]+$/;
    const phonePattern = /^\d{10}$/;
    const genderPattern = /^(Male|Female|Other)$/;
    const addressPattern = /^[A-Za-z0-9\s.,'\/#()&-]+$/;
    const documentPattern = /^[A-Za-z0-9]+$/;
    const nationalityPattern = /^[A-Za-z\s.'-]+$/;
    const allowedDocTypes = ["PAN", "AADHAAR", "PASSPORT"];

    if (
      !this.isValidText(p.passengerName, 100) ||
      !namePattern.test(p.passengerName || "")
    ) {
      this.errors.push("Invalid passenger name");
    }

    if (
      !this.isValidText(p.fatherName, 100) ||
      !namePattern.test(p.fatherName || "")
    ) {
      this.errors.push("Invalid father name");
    }

    if (
      ![stringValue(p.phoneNo)].some((value) =>
        phonePattern.test(value),
      )
    ) {
      this.errors.push("Phone number must contain exactly 10 digits");
    }

    if (
      p.age === undefined ||
      p.age === null ||
      !/^\d{1,3}$/.test(String(p.age)) ||
      Number(p.age) > 120
    ) {
      this.errors.push("Age must be between 0 and 120");
    }

    if (!genderPattern.test(String(p.gender ?? ""))) {
      this.errors.push("Invalid gender");
    }

    if (![0, 1].includes(p.isForeigner)) {
      this.errors.push("Invalid foreign passenger flag");
    }

    if (![0, 1].includes(p.isIslander)) {
      this.errors.push("Invalid islander flag");
    }

    if (
      !this.isValidText(p.residence, 300) ||
      !addressPattern.test(p.residence || "")
    ) {
      this.errors.push("Invalid residence");
    }

    if (
      !this.isValidOptionalText(p.lastStayInAndaman, 300) ||
      (p.lastStayInAndaman &&
        !addressPattern.test(p.lastStayInAndaman))
    ) {
      this.errors.push("Invalid last stay in Andaman");
    }

    if (p.isForeigner === 1) {
      if (p.docType !== "PASSPORT") {
        this.errors.push("Foreign passengers must use a passport");
      }

      if (
        !this.isValidText(p.docId, 30) ||
        !documentPattern.test(p.docId || "")
      ) {
        this.errors.push("Invalid passport number");
      }

      if (
        !this.isValidText(p.nationality, 60) ||
        !nationalityPattern.test(p.nationality || "")
      ) {
        this.errors.push("Invalid nationality");
      }

      if (
        !this.isValidText(p.visaNumber, 30) ||
        !documentPattern.test(p.visaNumber || "")
      ) {
        this.errors.push("Invalid visa number");
      }

      if (
        !this.isValidText(p.lastStayInAndaman, 300) ||
        !addressPattern.test(p.lastStayInAndaman || "")
      ) {
        this.errors.push("Last stay in Andaman is required for foreigners");
      }
    } else {
      if (!allowedDocTypes.includes(p.docType)) {
        this.errors.push("Invalid Indian passenger document type");
      }

      if (
        !this.isValidText(p.docId, 4) ||
        !/^[A-Za-z0-9]{4}$/.test(p.docId || "")
      ) {
        this.errors.push(
          "Indian passenger document ID must be 4 alphanumeric characters",
        );
      }
    }
  }

  validate() {
    this.errors = [];

    if (
      !["updateTrip", "addPassenger", "updatePassenger", "deletePassenger"]
        .includes(this.action)
    ) {
      this.errors.push("Invalid update action");
      return this.getResult();
    }

    if (
      !(
        (typeof this.tId === "string" ||
          typeof this.tId === "number") &&
        String(this.tId).trim().length > 0 &&
        String(this.tId).length <= 50
      )
    ) {
      this.errors.push("Invalid trip ID");
    }

    if (
      ["updatePassenger", "deletePassenger"].includes(this.action) &&
      !this.isPositiveInteger(this.pId)
    ) {
      this.errors.push("Valid passenger ID is required");
    }

    if (
      !this.data ||
      typeof this.data !== "object" ||
      Array.isArray(this.data)
    ) {
      this.errors.push("Data must be an object");
      return this.getResult();
    }

    if (this.action === "updateTrip") {
      this.validateTripUpdate();
    }

    if (["addPassenger", "updatePassenger"].includes(this.action)) {
      this.validatePassenger();
    }

    return this.getResult();
  }

  getResult() {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      action: this.action,
      tId: this.tId,
      pId: this.pId,
      data: this.data,
      normalizedPassenger: this.normalizedPassenger,
    };
  }
}

function stringValue(value) {
  return value === undefined || value === null ? "" : String(value);
}

module.exports = UpdateTripDTO;
