class TripRequestDTO {
  constructor(data) {
    /* ================= TRIP FIELDS ================= */
    this.reg_id = data.reg_id;
    this.vId = data.vId;
    this.dId = data.dId;
    this.origin = data.origin;
    this.destination = data.destination;
    this.date = data.date;
    this.convoyTime = data.convoyTime;
    this.specialType = data.specialType || null;
    this.remarks = data.remarks || null;

    // Tourist flag (1 = yes, 0 = no)
    this.isTourist = data.isTouristTrip === 1 ? 1 : 0;

    this.isReturn = data.isReturn || false;
    this.returnDate = data.returnDate || null;
    this.returnConvoyTime = data.returnConvoyTime || null;
    this.returnType = data.returnType || "same";
    this.returnTripData = data.returnTripData || {};

    /* ================= PASSENGERS ================= */
    this.Passengers = this.normalizePassengers(data.Passengers);
    this.returnPassengers = this.normalizePassengers(data.returnPassengers);
  }

  normalizePassengers(passengers) {
    return Array.isArray(passengers)
      ? passengers.map((p) => {
          const isForeigner =
            p.isForeigner === 1 || p.isForeigner === "1" ? 1 : 0;

          return {
            PassengerName: p.PassengerName ?? p.name,
            FatherName: p.FatherName ?? p.fatherName ?? null,
            PhoneNo: p.PhoneNo ?? p.phone,
            Age: p.Age ?? p.age,
            Gender: p.Gender ?? p.gender,

            isForeigner,

            docType:
              p.docType ??
              p.documentType ??
              (isForeigner === 1 ? "PASSPORT" : null),
            docId: p.docId ?? p.documentId ?? p.passportNo ?? null,

            Nationality: p.Nationality ?? p.nationality ?? null,
            VisaNo: p.VisaNo ?? p.visaNo ?? null,
            Residence: p.Residence ?? p.residence ?? null,
          };
        })
      : [];
  }

  /* ================= VALIDATION ================= */
  validate() {
    const errors = [];

    const namePattern = /^[A-Za-z\s.'-]+$/;
    const phonePattern = /^\d{10}$/;
    const genderPattern = /^(Male|Female|Other)$/;
    const docIdPattern = /^[A-Za-z0-9]{4,20}$/;

    /* ---------- Trip validation ---------- */
    if (!this.vId) errors.push("Vehicle ID (vId) is required");
    if (!this.dId) errors.push("Driver ID (dId) is required");
    if (!this.origin) errors.push("Origin is required");
    if (!this.destination) errors.push("Destination is required");
    if (!this.date) errors.push("Date is required");
    if (!this.convoyTime) errors.push("Convoy time is required");

    if (![0, 1].includes(this.isTourist)) {
      errors.push("isTourist must be 0 or 1");
    }
    if (
      this.specialType !== null &&
      this.specialType !== "" &&
      ![100, 200].includes(Number(this.specialType))
    ) {
      errors.push("specialType must be 100 (Emergency) or 200 (VIP)");
    }

    /* ---------- Passenger validation ---------- */
    /* ---------- Passenger validation ---------- */

    /* ---------- Passenger validation ---------- */
    this.Passengers.forEach((p, index) => {
      const prefix = `Passenger[${index}]`;

      // Name
      if (!p.PassengerName?.trim()) {
        errors.push(`${prefix}: Name is required`);
      } else if (!namePattern.test(p.PassengerName)) {
        errors.push(`${prefix}: Name must contain alphabets only`);
      }

      // Father Name
      if (p.FatherName && !namePattern.test(p.FatherName)) {
        errors.push(`${prefix}: Father name must contain alphabets only`);
      }

      // Phone
      if (!p.PhoneNo?.trim()) {
        errors.push(`${prefix}: Phone number is required`);
      } else if (!phonePattern.test(p.PhoneNo)) {
        errors.push(`${prefix}: Phone must be 10 digits`);
      }

      // Age
      if (p.Age === undefined || p.Age === null) {
        errors.push(`${prefix}: Age is required`);
      } else if (isNaN(p.Age) || p.Age < 0 || p.Age > 120) {
        errors.push(`${prefix}: Age must be between 0 and 120`);
      }

      // Gender
      if (!p.Gender?.trim()) {
        errors.push(`${prefix}: Gender is required`);
      } else if (!genderPattern.test(p.Gender)) {
        errors.push(`${prefix}: Invalid gender`);
      }

      // Residence
      if (!p.Residence?.trim()) {
        errors.push(`${prefix}: Residence is required`);
      }

      /* ---------- Foreigner vs Indian ---------- */
      if (![0, 1].includes(p.isForeigner)) {
        errors.push(`${prefix}: isForeigner must be 0 or 1`);
      }

      if (p.isForeigner === 1) {
        if (p.docType !== "PASSPORT") {
          errors.push(`${prefix}: Foreigners must use PASSPORT`);
        }

        if (!p.docId?.trim()) {
          errors.push(`${prefix}: Passport number is required`);
        }

        if (!p.Nationality?.trim()) {
          errors.push(`${prefix}: Nationality is required`);
        }

        if (!p.VisaNo?.trim()) {
          errors.push(`${prefix}: Visa number is required`);
        }
      } else {
        if (!p.docType?.trim()) {
          errors.push(`${prefix}: Document type is required`);
        }

        if (!p.docId?.trim()) {
          errors.push(`${prefix}: Document ID is required`);
        } else if (!docIdPattern.test(p.docId)) {
          errors.push(`${prefix}: Invalid document ID format`);
        }
      }
    });
    // ✅ Return trip validation (ONLY ONCE)
    // ✅ Return validation

    if (this.isReturn) {
      if (!this.returnDate) {
        errors.push("Return date is required");
      }
      if (!this.returnConvoyTime) {
        errors.push("Return convoy time is required");
      }

      // 🔥 FIXED LOCATION
      if (this.returnType !== "same") {
        if (!this.returnPassengers.length) {
          errors.push("Return passengers required for modified return");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = TripRequestDTO;
