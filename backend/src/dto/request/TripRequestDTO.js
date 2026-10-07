class TripRequestDTO {
  constructor(data = {}) {
    /* ================= TRIP FIELDS ================= */

    this.reg_id = data.reg_id;

    this.vId = data.vId;
    this.dId = data.dId;

    this.origin = data.origin;
    this.destination = data.destination;

    this.date = data.date;
    this.convoyTime = data.convoyTime;

    this.specialType = data.specialType ?? null;

    this.remarks = data.remarks ?? null;

    // Tourist flag (1 = yes, 0 = no)
    this.isTourist =
      data.isTouristTrip === 1 || data.isTouristTrip === "1"
        ? 1
        : 0;

    this.isReturn =
      data.isReturn === true ||
      data.isReturn === 1 ||
      data.isReturn === "1";

    // Keep existing behavior
    this.returnDate = data.returnDate || null;
    this.returnConvoyTime = data.returnConvoyTime || null;
    this.returnType = data.returnType || "same";
    this.returnTripData = data.returnTripData || {};

    /* ================= PASSENGERS ================= */

    this.Passengers = this.normalizePassengers(data.Passengers);
    this.returnPassengers = this.normalizePassengers(
      data.returnPassengers
    );
  }

  /* =========================================================
     CHECK HTML / CONTROL CHARACTERS
     ========================================================= */

  containsUnsafeCharacters(value) {
    if (value === null || value === undefined) {
      return false;
    }

    const str = String(value);

    // HTML characters and control characters
    return (
      /[<>]/.test(str) ||
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(str)
    );
  }

  /* =========================================================
     PASSENGER NORMALIZATION
     ========================================================= */

  normalizePassengers(passengers) {
    return Array.isArray(passengers)
      ? passengers.map((p) => {
          const isForeigner =
            p.isForeigner === 1 ||
            p.isForeigner === "1"
              ? 1
              : 0;

          return {
            PassengerName:
              p.PassengerName ?? p.name,

            FatherName:
              p.FatherName ??
              p.fatherName ??
              null,

            PhoneNo:
              p.PhoneNo ??
              p.phone,

            Age:
              p.Age ??
              p.age,

            Gender:
              p.Gender ??
              p.gender,

            isForeigner,

            docType:
              p.docType ??
              p.documentType ??
              (isForeigner === 1
                ? "PASSPORT"
                : null),

            docId:
              p.docId ??
              p.documentId ??
              p.passportNo ??
              null,

            Nationality:
              p.Nationality ??
              p.nationality ??
              null,

            VisaNo:
              p.VisaNo ??
              p.visaNo ??
              null,

            Residence:
              p.Residence ??
              p.residence ??
              null,

            LastStayInAndaman:
              p.LastStayInAndaman ??
              p.lastStayInAndaman ??
              null,

            isIslander:
              p.isIslander === 1 ||
              p.isIslander === "1"
                ? 1
                : 0,
          };
        })
      : [];
  }

  /* =========================================================
     VALIDATION
     ========================================================= */

  validate() {
    const errors = [];

    /* ---------- Patterns ---------- */

    // Passenger name
    const namePattern = /^[A-Za-z\s]+$/;

    // Phone
    const phonePattern = /^\d{10}$/;

    // Gender
    const genderPattern =
      /^(Male|Female|Other)$/;

    // Indian last 4 characters of ID
    const indianDocIdPattern =
      /^[A-Za-z0-9]{4}$/;

    // Passport
    const passportPattern =
      /^[A-Za-z0-9]+$/;

    // Nationality
    const nationalityPattern =
      /^[A-Za-z\s]+$/;

    // Visa number
    const visaPattern =
      /^[A-Za-z0-9]+$/;

    // Residence / Last Stay
    // Allows normal address characters
   const addressPattern =
  /^[A-Za-z0-9\s.,'\/#()&-]+$/;

    /* =========================================================
       TRIP VALIDATION
       ========================================================= */

    // vId
    if (
      this.vId === undefined ||
      this.vId === null ||
      this.vId === ""
    ) {
      errors.push(
        "Vehicle ID (vId) is required"
      );
    } else if (
      this.containsUnsafeCharacters(this.vId)
    ) {
      errors.push(
        "Vehicle ID contains invalid characters"
      );
    } else if (
      !/^\d+$/.test(String(this.vId))
    ) {
      errors.push(
        "Vehicle ID must be numeric"
      );
    }

    // dId
    if (
      this.dId === undefined ||
      this.dId === null ||
      this.dId === ""
    ) {
      errors.push(
        "Driver ID (dId) is required"
      );
    } else if (
      this.containsUnsafeCharacters(this.dId)
    ) {
      errors.push(
        "Driver ID contains invalid characters"
      );
    } else if (
      !/^\d+$/.test(String(this.dId))
    ) {
      errors.push(
        "Driver ID must be numeric"
      );
    }

    /* ---------- Origin ---------- */

    if (
      this.origin === undefined ||
      this.origin === null ||
      this.origin === ""
    ) {
      errors.push("Origin is required");
    } else if (
      this.containsUnsafeCharacters(this.origin)
    ) {
      errors.push(
        "Origin contains invalid characters"
      );
    } else if (
      !/^\d{1}$/.test(String(this.origin))
    ) {
      errors.push(
        "Origin must be exactly 1 digit"
      );
    }

    /* ---------- Destination ---------- */

    if (
      this.destination === undefined ||
      this.destination === null ||
      this.destination === ""
    ) {
      errors.push(
        "Destination is required"
      );
    } else if (
      this.containsUnsafeCharacters(
        this.destination
      )
    ) {
      errors.push(
        "Destination contains invalid characters"
      );
    } else if (
      !/^\d{1}$/.test(
        String(this.destination)
      )
    ) {
      errors.push(
        "Destination must be exactly 1 digit"
      );
    }

    // Origin and destination cannot be same
    if (
      this.origin !== undefined &&
      this.origin !== null &&
      this.destination !== undefined &&
      this.destination !== null &&
      String(this.origin) ===
        String(this.destination)
    ) {
      errors.push(
        "Origin and destination cannot be the same"
      );
    }

    /* ---------- Date ---------- */

    if (!this.date) {
      errors.push("Date is required");
    } else if (
      this.containsUnsafeCharacters(this.date)
    ) {
      errors.push(
        "Date contains invalid characters"
      );
    } else if (
      isNaN(Date.parse(this.date))
    ) {
      errors.push("Invalid date");
    }

    /* ---------- Convoy Time ---------- */

    if (
      this.convoyTime === undefined ||
      this.convoyTime === null ||
      this.convoyTime === ""
    ) {
      errors.push(
        "Convoy time is required"
      );
    } else if (
      this.containsUnsafeCharacters(
        this.convoyTime
      )
    ) {
      errors.push(
        "Convoy time contains invalid characters"
      );
    } else if (
      !/^\d{1,2}$/.test(
        String(this.convoyTime)
      )
    ) {
      errors.push(
        "Convoy time must contain maximum 2 digits"
      );
    }

    /* ---------- Special Type ---------- */

    if (
      this.specialType !== null &&
      this.specialType !== ""
    ) {
      if (
        this.containsUnsafeCharacters(
          this.specialType
        )
      ) {
        errors.push(
          "Special type contains invalid characters"
        );
      } else if (
        !/^\d+$/.test(
          String(this.specialType)
        )
      ) {
        errors.push(
          "Special type must be numeric"
        );
      }
    }

    /* ---------- Remarks ---------- */

    if (
      this.remarks !== null &&
      this.remarks !== ""
    ) {
      if (
        this.containsUnsafeCharacters(
          this.remarks
        )
      ) {
        errors.push(
          "Remarks contain invalid characters"
        );
      }

      if (
        String(this.remarks).length > 10000
      ) {
        errors.push(
          "Remarks must not exceed 10000 characters"
        );
      }
    }

    /* ---------- Tourist ---------- */

    if (
      ![0, 1].includes(this.isTourist)
    ) {
      errors.push(
        "isTourist must be 0 or 1"
      );
    }

    /* =========================================================
       PASSENGERS
       ========================================================= */

    if (!Array.isArray(this.Passengers)) {
      errors.push(
        "Passengers must be an array"
      );
    } else {
      this.validatePassengers(
        this.Passengers,
        "Passenger",
        errors,
        {
          namePattern,
          phonePattern,
          genderPattern,
          indianDocIdPattern,
          passportPattern,
          nationalityPattern,
          visaPattern,
          addressPattern,
        }
      );
    }

    /* =========================================================
       RETURN TRIP
       ========================================================= */

    if (this.isReturn) {
      if (!this.returnDate) {
        errors.push(
          "Return date is required"
        );
      } else if (
        this.containsUnsafeCharacters(
          this.returnDate
        )
      ) {
        errors.push(
          "Return date contains invalid characters"
        );
      } else if (
        isNaN(Date.parse(this.returnDate))
      ) {
        errors.push(
          "Invalid return date"
        );
      }

      if (
        this.returnConvoyTime === undefined ||
        this.returnConvoyTime === null ||
        this.returnConvoyTime === ""
      ) {
        errors.push(
          "Return convoy time is required"
        );
      } else if (
        this.containsUnsafeCharacters(
          this.returnConvoyTime
        )
      ) {
        errors.push(
          "Return convoy time contains invalid characters"
        );
      } else if (
        !/^\d{1,2}$/.test(
          String(this.returnConvoyTime)
        )
      ) {
        errors.push(
          "Return convoy time must contain maximum 2 digits"
        );
      }

      // Same current returnType behavior.
      // No additional returnType validation added.

      // Same current returnTripData behavior.
      // No additional validation added.

      /* ---------- Return Passengers ---------- */

      if (
        !Array.isArray(
          this.returnPassengers
        )
      ) {
        errors.push(
          "Return passengers must be an array"
        );
      } else {
        this.validatePassengers(
          this.returnPassengers,
          "ReturnPassenger",
          errors,
          {
            namePattern,
            phonePattern,
            genderPattern,
            indianDocIdPattern,
            passportPattern,
            nationalityPattern,
            visaPattern,
            addressPattern,
          }
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /* =========================================================
     PASSENGER VALIDATION
     ========================================================= */

  validatePassengers(
    passengers,
    prefixName,
    errors,
    patterns
  ) {
    passengers.forEach((p, index) => {
      const prefix =
        `${prefixName}[${index}]`;

      /* ---------- Passenger Name ---------- */

      if (
        !p.PassengerName ||
        !String(p.PassengerName).trim()
      ) {
        errors.push(
          `${prefix}: Name is required`
        );
      } else if (
        this.containsUnsafeCharacters(
          p.PassengerName
        )
      ) {
        errors.push(
          `${prefix}: Name contains invalid characters`
        );
      } else if (
        !patterns.namePattern.test(
          String(p.PassengerName)
        )
      ) {
        errors.push(
          `${prefix}: Name must contain alphabets and spaces only`
        );
      }

      /* ---------- Father Name ---------- */

      if (
        !p.FatherName ||
        !String(p.FatherName).trim()
      ) {
        errors.push(
          `${prefix}: Father name is required`
        );
      } else if (
        this.containsUnsafeCharacters(
          p.FatherName
        )
      ) {
        errors.push(
          `${prefix}: Father name contains invalid characters`
        );
      } else if (
        !patterns.namePattern.test(
          String(p.FatherName)
        )
      ) {
        errors.push(
          `${prefix}: Father name must contain alphabets and spaces only`
        );
      }

      /* ---------- Phone ---------- */

      if (
        !p.PhoneNo ||
        !String(p.PhoneNo).trim()
      ) {
        errors.push(
          `${prefix}: Phone number is required`
        );
      } else if (
        this.containsUnsafeCharacters(
          p.PhoneNo
        )
      ) {
        errors.push(
          `${prefix}: Phone number contains invalid characters`
        );
      } else if (
        !patterns.phonePattern.test(
          String(p.PhoneNo)
        )
      ) {
        errors.push(
          `${prefix}: Phone must be exactly 10 digits`
        );
      }

      /* ---------- Age ---------- */

      if (
        p.Age === undefined ||
        p.Age === null ||
        p.Age === ""
      ) {
        errors.push(
          `${prefix}: Age is required`
        );
      } else if (
        this.containsUnsafeCharacters(p.Age)
      ) {
        errors.push(
          `${prefix}: Age contains invalid characters`
        );
      } else if (
        !/^\d{1,3}$/.test(
          String(p.Age)
        ) ||
        Number(p.Age) > 120
      ) {
        errors.push(
          `${prefix}: Age must be between 0 and 120`
        );
      }

      /* ---------- Gender ---------- */

      if (
        !p.Gender ||
        !String(p.Gender).trim()
      ) {
        errors.push(
          `${prefix}: Gender is required`
        );
      } else if (
        this.containsUnsafeCharacters(
          p.Gender
        )
      ) {
        errors.push(
          `${prefix}: Gender contains invalid characters`
        );
      } else if (
        !patterns.genderPattern.test(
          String(p.Gender)
        )
      ) {
        errors.push(
          `${prefix}: Invalid gender`
        );
      }

      /* ---------- isForeigner ---------- */

      if (
        ![0, 1].includes(p.isForeigner)
      ) {
        errors.push(
          `${prefix}: isForeigner must be 0 or 1`
        );
        return;
      }

      /* =====================================================
         INDIAN PASSENGER
         ===================================================== */

      if (p.isForeigner === 0) {
        /* ---------- Is Islander ---------- */

        if (
          ![0, 1].includes(
            p.isIslander
          )
        ) {
          errors.push(
            `${prefix}: isIslander must be 0 or 1`
          );
        }

        /* ---------- Residence ---------- */

        if (
          !p.Residence ||
          !String(p.Residence).trim()
        ) {
          errors.push(
            `${prefix}: Residence is required`
          );
        } else if (
          this.containsUnsafeCharacters(
            p.Residence
          )
        ) {
          errors.push(
            `${prefix}: Residence contains invalid characters`
          );
        } else if (
          String(p.Residence).length > 300
        ) {
          errors.push(
            `${prefix}: Residence must not exceed 300 characters`
          );
        } else if (
          !patterns.addressPattern.test(
            String(p.Residence)
          )
        ) {
          errors.push(
            `${prefix}: Residence contains invalid characters`
          );
        }

        /* ---------- Last Stay ---------- */

        if (
          p.LastStayInAndaman &&
          this.containsUnsafeCharacters(
            p.LastStayInAndaman
          )
        ) {
          errors.push(
            `${prefix}: Last Stay in Andaman contains invalid characters`
          );
        } else if (
          p.LastStayInAndaman &&
          String(
            p.LastStayInAndaman
          ).length > 300
        ) {
          errors.push(
            `${prefix}: Last Stay in Andaman must not exceed 300 characters`
          );
        } else if (
          p.LastStayInAndaman &&
          !patterns.addressPattern.test(
            String(
              p.LastStayInAndaman
            )
          )
        ) {
          errors.push(
            `${prefix}: Last Stay in Andaman contains invalid characters`
          );
        }

        /* ---------- Document Type ---------- */

        if (!p.docType) {
          errors.push(
            `${prefix}: Document type is required`
          );
        } else if (
          ![
            "PAN",
            "AADHAAR",
            "PASSPORT",
          ].includes(p.docType)
        ) {
          errors.push(
            `${prefix}: Invalid document type`
          );
        }

        /* ---------- Document ID ---------- */

        if (
          !p.docId ||
          !String(p.docId).trim()
        ) {
          errors.push(
            `${prefix}: Document ID is required`
          );
        } else if (
          this.containsUnsafeCharacters(
            p.docId
          )
        ) {
          errors.push(
            `${prefix}: Document ID contains invalid characters`
          );
        } else if (
          !patterns.indianDocIdPattern.test(
            String(p.docId)
          )
        ) {
          errors.push(
            `${prefix}: Document ID must contain exactly 4 alphanumeric characters`
          );
        }
      }

      /* =====================================================
         FOREIGN PASSENGER
         ===================================================== */

      if (p.isForeigner === 1) {
        /* ---------- Residence ---------- */

        if (
          !p.Residence ||
          !String(p.Residence).trim()
        ) {
          errors.push(
            `${prefix}: Residence is required`
          );
        } else if (
          this.containsUnsafeCharacters(
            p.Residence
          )
        ) {
          errors.push(
            `${prefix}: Residence contains invalid characters`
          );
        } else if (
          String(p.Residence).length > 300
        ) {
          errors.push(
            `${prefix}: Residence must not exceed 300 characters`
          );
        } else if (
          !patterns.addressPattern.test(
            String(p.Residence)
          )
        ) {
          errors.push(
            `${prefix}: Residence contains invalid characters`
          );
        }

        /* ---------- Last Stay ---------- */

        if (
          !p.LastStayInAndaman ||
          !String(
            p.LastStayInAndaman
          ).trim()
        ) {
          errors.push(
            `${prefix}: Last Stay in Andaman is required`
          );
        } else if (
          this.containsUnsafeCharacters(
            p.LastStayInAndaman
          )
        ) {
          errors.push(
            `${prefix}: Last Stay in Andaman contains invalid characters`
          );
        } else if (
          String(
            p.LastStayInAndaman
          ).length > 300
        ) {
          errors.push(
            `${prefix}: Last Stay in Andaman must not exceed 300 characters`
          );
        } else if (
          !patterns.addressPattern.test(
            String(
              p.LastStayInAndaman
            )
          )
        ) {
          errors.push(
            `${prefix}: Last Stay in Andaman contains invalid characters`
          );
        }

        /* ---------- Document Type ---------- */

        if (
          p.docType !== "PASSPORT"
        ) {
          errors.push(
            `${prefix}: Foreigners must use PASSPORT`
          );
        }

        /* ---------- Passport Number ---------- */

        if (
          !p.docId ||
          !String(p.docId).trim()
        ) {
          errors.push(
            `${prefix}: Passport number is required`
          );
        } else if (
          this.containsUnsafeCharacters(
            p.docId
          )
        ) {
          errors.push(
            `${prefix}: Passport number contains invalid characters`
          );
        } else if (
          !patterns.passportPattern.test(
            String(p.docId)
          )
        ) {
          errors.push(
            `${prefix}: Passport number must be alphanumeric`
          );
        }

        /* ---------- Nationality ---------- */

        if (
          !p.Nationality ||
          !String(p.Nationality).trim()
        ) {
          errors.push(
            `${prefix}: Nationality is required`
          );
        } else if (
          this.containsUnsafeCharacters(
            p.Nationality
          )
        ) {
          errors.push(
            `${prefix}: Nationality contains invalid characters`
          );
        } else if (
          !patterns.nationalityPattern.test(
            String(p.Nationality)
          )
        ) {
          errors.push(
            `${prefix}: Nationality must contain alphabets and spaces only`
          );
        }

        /* ---------- Visa Number ---------- */

        if (
          !p.VisaNo ||
          !String(p.VisaNo).trim()
        ) {
          errors.push(
            `${prefix}: Visa number is required`
          );
        } else if (
          this.containsUnsafeCharacters(
            p.VisaNo
          )
        ) {
          errors.push(
            `${prefix}: Visa number contains invalid characters`
          );
        } else if (
          !patterns.visaPattern.test(
            String(p.VisaNo)
          )
        ) {
          errors.push(
            `${prefix}: Visa number must be alphanumeric`
          );
        }
      }
    }
  )}
}

module.exports = TripRequestDTO;
