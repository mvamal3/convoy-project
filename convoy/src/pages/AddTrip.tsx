import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { formatDateDDMMYY, formatTimeHHMM } from "@/utils/dateUtils";

import {
  getDriverList,
  getVehicleList,
  getOriginDestinations,
  getConveyTimeByLocId,
  getCurrentDateTime1,
} from "@/contexts/GetApi";
import { useAuth } from "@/contexts/AuthContext";
import { handleAddTripAPI } from "@/contexts/PostApi";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import AddPassengerIndian from "@/components/passengers/AddPassengerIndian";
import AddPassengerForeigner from "@/components/passengers/AddPassengerForeigner";
const MySwal = withReactContent(Swal);

export default function AddTrip() {
  const { user, accessToken } = useAuth();
  const [vehicleList, setVehicleList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [conveyTimeList, setConveyTimeList] = useState([]);
  const [step, setStep] = useState(1);
  const [passengerSuccess, setPassengerSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [editIndex, setEditIndex] = useState(-1);
  const [vehicleSeating, setVehicleSeating] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [serverDate, setServerDate] = useState(null);
  const [isTouristTrip, setIsTouristTrip] = useState("");
  const [isForeigner, setIsForeigner] = useState("");
  const [isIslander, setIsIslander] = useState("");
<<<<<<< HEAD
=======
  const [isReturn, setIsReturn] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [returnConvoyTime, setReturnConvoyTime] = useState("");
  const [returnType, setReturnType] = useState("same"); // default same
  const [returnPassengers, setReturnPassengers] = useState([]);
  const [returnConveyList, setReturnConveyList] = useState([]);
  const [showReturnModal, setShowReturnModal] = useState(false);

>>>>>>> b2b3d2d (20042026 return trip completed)
  const [formData, setFormData] = useState({
    vId: "",
    dId: "",
    origin: "",
    destination: "",
    loc_id: "",
    date: "",
    convoyTime: "",
    Passengers: [],
  });

  // const [passenger, setPassenger] = useState({
  //   name: "",
  //   age: "",
  //   gender: "",
  //   phone: "",
  //   documentType: "",
  //   documentId: "",
  //   residence: "", // ✅ NEW
  // });
  console.log("User Type:", user?.usertype);
  const [passenger, setPassenger] = useState({
    title: "",
    name: "",
    fatherName: "",
    age: "",
    gender: "",
    phone: "",
    residence: "",
    // Indian
    documentType: "",
    documentId: "",
    // Foreigner
    passportNo: "",
    nationality: "",
    visaNo: "",
  });

  const getSeatRequiredCount = (passengers) => {
    return passengers.filter((p) => Number(p.age) > 12).length;
  };

<<<<<<< HEAD
=======
  const mapPassengerForPayload = (p) => {
    const isPassengerForeigner = Number(p.isForeigner) === 1;

    return {
      PassengerName: p.PassengerName ?? p.name,
      FatherName: p.FatherName ?? p.fatherName ?? null,
      Age: p.Age ?? p.age,
      Gender: p.Gender ?? p.gender,
      PhoneNo: p.PhoneNo ?? p.phone,
      isForeigner: isPassengerForeigner ? 1 : 0,
      docType:
        p.docType ??
        p.documentType ??
        (isPassengerForeigner ? "PASSPORT" : null),
      docId: p.docId ?? p.documentId ?? p.passportNo,
      Nationality: p.Nationality ?? p.nationality ?? null,
      VisaNo: p.VisaNo ?? p.visaNo ?? null,
      Residence: p.Residence ?? p.residence,
    };
  };

  const buildPassengerToSave = () => ({
    ...passenger,
    isForeigner: isForeigner === "yes" ? 1 : 0,
    documentType:
      isForeigner === "yes" ? "PASSPORT" : passenger.documentType,
  });

>>>>>>> b2b3d2d (20042026 return trip completed)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleRes = await getVehicleList(accessToken);
        const vehicles = vehicleRes?.data?.vehicle;
        setVehicleList(Array.isArray(vehicles) ? vehicles : []);

        const driverRes = await getDriverList(accessToken);
        const drivers = driverRes?.data?.driver;
        setDriverList(Array.isArray(drivers) ? drivers : []);

        const originDestRes = await getOriginDestinations(accessToken);
        console.log;
        setLocationList(Array.isArray(originDestRes) ? originDestRes : []);
      } catch (error) {
        setVehicleList([]);
        setDriverList([]);
        setLocationList([]);
      }
    };

    if (accessToken) fetchData();
  }, [accessToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "vId") {
      const selectedVehicle = vehicleList.find((v) => String(v.vId) === value);
      setVehicleSeating(
        selectedVehicle ? Number(selectedVehicle.vSeating) : null,
      );
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === "origin") {
      const selectedPlace = locationList.find(
        (place) => String(place.id) === value,
      );
      setFormData((prev) => ({
        ...prev,
        origin: value,
        loc_id: selectedPlace?.loc_id || "",
        destination: "",
        convoyTime: "",
        date: prev.date,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  useEffect(() => {
    const fetchConveyTimes = async () => {
      if (!accessToken || !formData.loc_id) {
        setConveyTimeList([]);
        return;
      }
      try {
        const res = await getConveyTimeByLocId(formData.loc_id, accessToken);
        setConveyTimeList(Array.isArray(res) ? res : []);
      } catch (error) {
        setConveyTimeList([]);
      }
    };
    fetchConveyTimes();
  }, [formData.loc_id, accessToken]);

<<<<<<< HEAD
=======
  useEffect(() => {
    const fetchReturnConvey = async () => {
      if (!accessToken || !formData.destination) {
        setReturnConveyList([]);
        return;
      }

      try {
        const selectedPlace = locationList.find(
          (place) => String(place.id) === String(formData.destination),
        );

        if (!selectedPlace?.loc_id) return;

        const res = await getConveyTimeByLocId(
          selectedPlace.loc_id,
          accessToken,
        );

        setReturnConveyList(Array.isArray(res) ? res : []);
      } catch {
        setReturnConveyList([]);
      }
    };

    if (isReturn) {
      setReturnConvoyTime(""); // 🔥 THIS LINE IS MISSING
      fetchReturnConvey();
    }
  }, [formData.destination, isReturn, accessToken]);

>>>>>>> b2b3d2d (20042026 return trip completed)
  // useEffect(() => {
  //   const fetchStoppedConveys = async () => {
  //     if (!accessToken || !formData.loc_id || !formData.date) {
  //       setStopConveyList([]);
  //       return;
  //     }
  //     try {
  //       const rawData = await getStopConveyDetails(
  //         accessToken,
  //         formData.loc_id,
  //         formData.date,
  //       );
  //       const stoppedIds = rawData
  //         .filter((c) => String(c.status) === "0")
  //         .map((c) => String(c.conveyid));
  //       setStopConveyList(stoppedIds);
  //     } catch {
  //       setStopConveyList([]);
  //     }
  //   };
  //   fetchStoppedConveys();
  // }, [formData.loc_id, formData.date, accessToken]);

  const getHourFromTimeString = (timeStr) => {
    if (!timeStr) return null;
    return parseInt(timeStr.split(":")[0], 10);
  };

  const getMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [hour, minute] = timeStr.split(":").map(Number);
    return hour * 60 + minute;
  };

  const serverMinutes = getMinutes(serverTime);
  const isToday = formData.date === serverDate;

  const availableConveyTimes = conveyTimeList.filter((ct) => {
    // Allow all until server time loads
    if (!serverDate || !serverTime) return true;

    // Restrict only for today
    if (isToday) {
      return getMinutes(ct.convey_time) > serverMinutes;
    }

    // Future dates
    return true;
  });

  useEffect(() => {
    const fetchServerTime = async () => {
      if (!accessToken) return;
      try {
        const currentTimeData = await getCurrentDateTime1(accessToken);
        setServerTime(currentTimeData?.time);
        setServerDate(currentTimeData?.date);
        console.log("Fetched server time:", currentTimeData?.time);
        console.log("Fetched server date:", currentTimeData?.date);
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };
    fetchServerTime();
  }, [accessToken]);

  const handleAddPassenger = () => {
    if (!isForeigner) {
      MySwal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please select whether passengers are Indian or Foreigner.",
      });
      return;
    }

    if (isForeigner === "no" && !isIslander) {
      MySwal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please specify whether the passenger is an Islander.",
      });
      return;
    }

    if (!formData.vId) {
      MySwal.fire({
        icon: "warning",
        title: "No Vehicle Selected",
        text: "Please select a vehicle before adding passengers.",
        confirmButtonText: "OK",
      });
      return;
    }

    if (vehicleSeating === null) {
      MySwal.fire({
        icon: "warning",
        title: "Vehicle Seating Unavailable",
        text: "Vehicle seating information is not available. Please select a vehicle.",
        confirmButtonText: "OK",
      });
      return;
    }

    const phonePattern = /^\d{10}$/;
    const namePattern = /^[A-Za-z\s.'-]+$/;
    const docIdPattern = /^[A-Za-z0-9]{4}$/;
    const age = Number(passenger.age);

    let passengerToSave = {
      ...passenger,
      isForeigner: isForeigner === "yes" ? 1 : 0, // ✅ PER PASSENGER
    };

    /* 🔹 FORCE PASSPORT FOR FOREIGNERS */
    if (isForeigner === "yes") {
      passengerToSave.documentType = "PASSPORT";
    }

    /* 🇮🇳 Indian Validation */
    if (isForeigner === "no") {
      if (
        !passenger.name ||
        !passenger.age ||
        !passenger.gender ||
        !passenger.phone ||
        !passenger.documentType ||
        !passenger.documentId ||
        !passenger.residence
      ) {
        MySwal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Please fill all Indian passenger fields.",
        });
        return;
      }
    }

    /* 🌍 Foreigner Validation */
    if (isForeigner === "yes") {
      if (
        !passenger.name ||
        !passenger.age ||
        !passenger.gender ||
        !passenger.phone ||
        !passenger.passportNo ||
        !passenger.nationality ||
        !passenger.visaNo ||
        !passenger.residence
      ) {
        MySwal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Please fill all Foreigner passenger fields.",
        });
        return;
      }
    }

    if (!phonePattern.test(passenger.phone)) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    if (!namePattern.test(passenger.name)) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a valid passenger name.",
      });
      return;
    }

    if (isNaN(age) || age <= 0 || age > 120) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a valid age.",
      });
      return;
    }

    if (isForeigner === "no" && !docIdPattern.test(passenger.documentId)) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Document ID must be exactly 4 characters.",
      });
      return;
    }

    /* 🔹 SEAT VALIDATION */
    let tempPassengers = [...formData.Passengers];

    if (editIndex !== -1) {
      tempPassengers[editIndex] = passengerToSave;
    } else {
      tempPassengers.push(passengerToSave);
    }

    const seatRequired = getSeatRequiredCount(tempPassengers);

    if (vehicleSeating !== null && seatRequired > vehicleSeating) {
      MySwal.fire({
        icon: "error",
        title: "Seating Limit Exceeded",
        text: `Adult passenger count exceeds vehicle seating capacity (${vehicleSeating}).`,
      });
      return;
    }

    /* 🔹 SAVE PASSENGER */
    if (editIndex === -1) {
      setFormData({
        ...formData,
        Passengers: [...formData.Passengers, passengerToSave],
      });
      setPassengerSuccess("Passenger added successfully!");
    } else {
      const updatedPassengers = [...formData.Passengers];
      updatedPassengers[editIndex] = passengerToSave;
      setFormData({
        ...formData,
        Passengers: updatedPassengers,
      });
      setPassengerSuccess("Passenger updated successfully!");
      setEditIndex(-1);
    }

    /* 🔹 RESET FORM */
    setPassenger(
      isForeigner === "yes"
        ? {
            title: "",
            name: "",
            fatherName: "",
            age: "",
            gender: "",
            phone: "",
            residence: "",
            documentType: "PASSPORT",
            documentId: "",
            passportNo: "",
            nationality: "",
            visaNo: "",
          }
        : {
            name: "",
            fatherName: "",
            age: "",
            gender: "",
            phone: "",
            residence: "",
            documentType: "",
            documentId: "",
          },
    );

    setTimeout(() => setPassengerSuccess(""), 3000);
  };
  const handleEditPassenger = (index) => {
    const p = formData.Passengers[index];

    setPassenger({
      ...p,
      documentType: p.documentType || "PASSPORT",
    });

    // ✅ restore islander dropdown
    if (p.isForeigner === 0) {
      setIsIslander(p.isIslander === 1 ? "yes" : "no");
    }

    setEditIndex(index);
  };

  const handleRemovePassenger = (index) => {
    const updatedPassengers = formData.Passengers.filter((_, i) => i !== index);
    setFormData({ ...formData, Passengers: updatedPassengers });
    if (editIndex === index) {
      setEditIndex(-1);
      setPassenger({
        name: "",
        age: "",
        gender: "",
        phone: "",
        documentType: "",
        documentId: "",
      });
    }
  };

  const selectedVehicle = vehicleList.find(
    (v) => String(v.vId) === String(formData.vId),
  );

  const handleNext = () => {
    if (!isTouristTrip) {
      MySwal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please select whether this is a Tourist Trip.",
      });
      return;
    }
    // Check if all mandatory fields in step 1 are filled
    const { vId, dId, origin, destination, date, convoyTime } = formData;
    if (!vId || !dId || !origin || !destination || !date || !convoyTime) {
      MySwal.fire({
        icon: "error",
        title: "Incomplete Trip Details",
        text: "Please fill all fields in Trip Details before proceeding.",
        confirmButtonText: "OK",
      });
      return; // do not move to next step
    }
    setStep((prev) => prev + 1);
  };
  const handleBack = () => setStep((prev) => prev - 1);

  const showTripRulesModal = async () => {
    const result = await MySwal.fire({
      title: "Declaration",
      width: "800px",
      icon: "info",
      showCloseButton: true,
      showCancelButton: false,
      confirmButtonText: "I Accept & Submit",
      confirmButtonColor: "#16a34a",
      allowOutsideClick: false,
      allowEscapeKey: false,
      focusConfirm: false,
      html: `
      <div class="text-left text-sm leading-6 max-h-[420px] overflow-y-auto pr-3">
        <ul class="list-disc pl-5 space-y-1">
          <li>
            I hereby declare that the above details are correct and true to the
            best of my knowledge.
          </li>
          <li>
            I have apprised the passengers of the prosecution to be taken under
            PAT Regulation.
          </li>
          <li>
            In the event of any information found to be incorrect, fraudulent or
            untrue, I undertake that I am liable for criminal prosecution.
          </li>
          <li>
            I agree to abide by the governing rules and especially the
            PAT Regulations.
          </li>
        </ul>

        <hr class="my-3 border-gray-300" />

        <label class="flex items-center gap-3 font-semibold">
          <input type="checkbox" id="acceptRules" class="w-4 h-4" />
          <span>I have read and accept the above declaration.</span>
        </label>
      </div>
    `,
      preConfirm: () => {
        const accepted = document.getElementById("acceptRules")?.checked;
        if (!accepted) {
          MySwal.showValidationMessage(
            "You must accept the declaration to submit the trip",
          );
          return false;
        }
        return true;
      },
    });

    return result.isConfirmed;
  };
<<<<<<< HEAD

  const handleSubmit = async () => {
=======
  // ✅ COMMON FUNCTION TO SUBMIT
  const submitTrip = (type = returnType, accepted = true) => {
    const payload = {
      vId: formData.vId,
      dId: formData.dId,
      origin: formData.origin,
      destination: formData.destination,
      date: formData.date,
      declarationAccepted: accepted,
      isTouristTrip: isTouristTrip === "yes" ? 1 : 0,
      convoyTime: formData.convoyTime,

      Passengers: formData.Passengers.map(mapPassengerForPayload),

      totalPax: formData.Passengers.length,

      // 🔁 RETURN PART
      isReturn,
      returnDate,
      returnConvoyTime,
      returnType: type,
      returnPassengers:
        type === "same" ? [] : returnPassengers.map(mapPassengerForPayload),
    };

    console.log("FINAL PAYLOAD:", payload);

    handleAddTripAPI(payload, accessToken, (response) => {
      if (response?.success && response?.data?.trip?.tId) {
        const tripId = response.data.trip.tId;
        const tripDate = response.data.trip.date;

        const formattedDate = formatDateDDMMYY(tripDate);
        const conveyname = response.data.trip.conveyTimeName;
        const conveytime = response.data.trip.conveyTimeValue;

        MySwal.fire({
          icon: "success",
          title: "Trip Created Successfully!",
          html: `
            <div>
              <p><strong>Trip ID:</strong> ${tripId}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Convey:</strong> ${conveyname}</p>
              <p><strong>Time:</strong> ${conveytime}</p>
            </div>
          `,
        }).then(() => {
          navigate(`/ManageTrip/ViewTrip/${tripId}`);
        });
      }

      // ✅ RESET FORM
      setFormData({
        vId: "",
        dId: "",
        origin: "",
        destination: "",
        loc_id: "",
        date: "",
        convoyTime: "",
        Passengers: [],
      });

      setStep(1);
      setEditIndex(-1);
      setVehicleSeating(null);
    });
  };

  const handleSubmit = async () => {
    // ✅ Basic validation
>>>>>>> b2b3d2d (20042026 return trip completed)
    if (
      !formData.vId ||
      !formData.dId ||
      !formData.origin ||
      !formData.destination ||
      !formData.date ||
      !formData.convoyTime
    ) {
      MySwal.fire({
        icon: "error",
        title: "Form Incomplete",
        text: "Please fill all trip details.",
<<<<<<< HEAD
        confirmButtonText: "OK",
      });
      return;
    }
    // if (formData.Passengers.length === 0) {
    //   MySwal.fire({
    //     icon: "error",
    //     title: "No Passengers",
    //     text: "Please add at least one passenger.",
    //     confirmButtonText: "OK",
    //   });
    //   return;
    // }
    //  RULES CHECK (NEW)
    const accepted = await showTripRulesModal();
    if (!accepted) return;

    const payload = {
      vId: formData.vId,
      dId: formData.dId,
      origin: formData.origin,
      destination: formData.destination,
      date: formData.date,
      declarationAccepted: accepted === true,
      isTouristTrip: isTouristTrip === "yes" ? 1 : 0,
      convoyTime: formData.convoyTime,
      Passengers: formData.Passengers.map((p) => ({
        PassengerName: p.name,
        FatherName: p.fatherName || null,
        Age: p.age,
        Gender: p.gender,
        PhoneNo: p.phone,
        isForeigner: p.isForeigner,
        docType: p.documentType,
        docId: p.documentId || p.passportNo,
        Nationality: p.nationality || null,
        VisaNo: p.visaNo || null,
        Residence: p.residence,
        PassengerPANId: "ABCDE1234F",
      })),
      totalPax: formData.Passengers.length,
    };
    console.log("latest", payload);
    handleAddTripAPI(payload, accessToken, (response) => {
      console.log("✅ API Response received:", response);

      if (response?.success && response?.data?.trip?.tId) {
        const tripId = response.data.trip.tId;
        const tripDate = response.data.trip.date;
        //console.log("ttatattaa");
        const formattedDate = formatDateDDMMYY(tripDate);
        const conveyname = response.data.trip.conveyTimeName;
        const conveytime = response.data.trip.conveyTimeValue;

        MySwal.fire({
          icon: "success",
          title: "Trip Created Successfully!",
          html: `
    <div>
      <p>
        <strong>Trip ID:</strong> ${tripId} |
        <strong>Date:</strong> ${formattedDate}
      </p>
      <p>
        <strong>Convey:</strong> ${conveyname} |
        <strong>Time:</strong> ${conveytime}
      </p>
    </div>
  `,
          confirmButtonText: "View Application",
        }).then(() => {
          navigate(`/ManageTrip/ViewTrip/${tripId}`);
        });
      } else {
        MySwal.fire({
          icon: "warning",
          title: "Trip Created, but ID missing",
          text: "Please check the trip list.",
          confirmButtonText: "OK",
        });
      }

      setFormData({
        vId: "",
        dId: "",
        origin: "",
        destination: "",
        loc_id: "",
        date: "",
        convoyTime: "",
        Passengers: [],
      });
      setStep(1);
      setEditIndex(-1);
      setVehicleSeating(null);
    });
  };
  // Convert server date (e.g., "2025-10-31") to a Date object
  // ✅ Use serverDate safely without timezone shift
=======
      });
      return;
    }

    // ✅ Return validation
    if (isReturn) {
      if (!returnDate || !returnConvoyTime) {
        MySwal.fire({
          icon: "error",
          title: "Return Journey Missing",
          text: "Please fill return date and convoy time",
        });
        return;
      }

      if (new Date(returnDate) < new Date(serverDate)) {
        MySwal.fire({
          icon: "error",
          title: "Invalid Return Date",
          text: "Return date cannot be before today",
        });
        return;
      }

      if (new Date(returnDate) < new Date(formData.date)) {
        MySwal.fire({
          icon: "error",
          title: "Invalid Return Date",
          text: "Return date must be after journey date",
        });
        return;
      }
    }

    // 🔥 STEP 1: Ask return type FIRST
    if (isReturn) {
      const result = await MySwal.fire({
        title: "Return Journey",
        text: "Are same passengers travelling in return?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes (Same)",
        cancelButtonText: "Modify",
      });

      if (result.isConfirmed) {
        // ✅ SAME → go to declaration
        const accepted = await showTripRulesModal();
        if (!accepted) return;

        submitTrip("same", accepted);
      } else {
        setReturnType("modified");

        // ✅ IMPORTANT: copy existing passengers
        setReturnPassengers([...formData.Passengers]);

        setShowReturnModal(true);
      }
    } else {
      // ✅ No return → declaration directly
      const accepted = await showTripRulesModal();
      if (!accepted) return;

      submitTrip("same", accepted);
    }
  };
  // const handleSubmit = async () => {
  //   // ✅ Basic validation
  //   if (
  //     !formData.vId ||
  //     !formData.dId ||
  //     !formData.origin ||
  //     !formData.destination ||
  //     !formData.date ||
  //     !formData.convoyTime
  //   ) {
  //     MySwal.fire({
  //       icon: "error",
  //       title: "Form Incomplete",
  //       text: "Please fill all trip details.",
  //     });
  //     return;
  //   }

  //   // ✅ Return validation
  //   if (isReturn) {
  //     if (!returnDate || !returnConvoyTime) {
  //       MySwal.fire({
  //         icon: "error",
  //         title: "Return Journey Missing",
  //         text: "Please fill return date and convoy time",
  //       });
  //       return;
  //     }

  //     if (new Date(returnDate) < new Date(serverDate)) {
  //       MySwal.fire({
  //         icon: "error",
  //         title: "Invalid Return Date",
  //         text: "Return date cannot be before today",
  //       });
  //       return;
  //     }

  //     if (new Date(returnDate) < new Date(formData.date)) {
  //       MySwal.fire({
  //         icon: "error",
  //         title: "Invalid Return Date",
  //         text: "Return date must be after journey date",
  //       });
  //       return;
  //     }
  //   }

  //   // ✅ RULES ACCEPTANCE FIRST
  //   const accepted = await showTripRulesModal();
  //   if (!accepted) return;

  //   // 🔥 RETURN LOGIC
  //   if (isReturn) {
  //     const result = await MySwal.fire({
  //       title: "Return Journey",
  //       text: "Are same passengers travelling in return?",
  //       icon: "question",
  //       showCancelButton: true,
  //       confirmButtonText: "Yes (Same)",
  //       cancelButtonText: "Modify",
  //     });

  //     if (result.isConfirmed) {
  //       setReturnType("same");
  //       submitTrip("same", accepted);
  //     } else {
  //       setReturnType("modified");
  //       setShowReturnModal(true);
  //     }
  //   } else {
  //     setReturnType("same");
  //     submitTrip("same", accepted);
  //   }
  // };

  // Convert server date (e.g., "2025-10-31") to a Date object
  // ✅ Use serverDate safely without timezone shift

>>>>>>> b2b3d2d (20042026 return trip completed)
  let minDate = "";
  let maxDate = "";

  if (serverDate) {
    const [year, month, day] = serverDate.split("-").map(Number);
    const today = new Date(year, month - 1, day); // exact server date, local time

    const maxDateObj = new Date(today);
    maxDateObj.setDate(today.getDate() + 7);

    const formatDate = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(date.getDate()).padStart(2, "0")}`;

    minDate = formatDate(today);
    maxDate = formatDate(maxDateObj);
  }

  useEffect(() => {
    if (location.state) {
      console.log("Pre-filling form with state:", location.state);
      setFormData((prev) => ({
        ...prev,
        ...location.state,
      }));
      // ✅ THIS WAS MISSING
      if (location.state.isTouristTrip) {
        setIsTouristTrip(location.state.isTouristTrip);
      }
      if (location.state.vehicleSeating !== undefined) {
        setVehicleSeating(location.state.vehicleSeating);
      }
      setStep(2);
    }
  }, [location.state]);

  const handleFileUpload = (e) => {
    if (isForeigner === "yes") {
      MySwal.fire({
        icon: "warning",
        title: "Excel Upload Disabled",
        text: "Passenger upload via Excel is allowed only for Indian passengers.",
      });
      e.target.value = null;
      return;
    }
    if (!isForeigner) {
      MySwal.fire({
        icon: "warning",
        title: "Select Passenger Type",
        text: "Please select Indian passengers before uploading.",
      });
      e.target.value = null;
      return;
    }

    if (!formData.vId) {
      e.target.value = null;
      MySwal.fire({
        icon: "warning",
        title: "No Vehicle Selected",
        text: "Please select a vehicle before uploading passengers.",
        confirmButtonText: "OK",
      });
      return;
    }
    if (vehicleSeating === null) {
      e.target.value = null;
      MySwal.fire({
        icon: "warning",
        title: "Vehicle Seating Unavailable",
        text: "Vehicle seating information is not available. Please select a vehicle.",
        confirmButtonText: "OK",
      });
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          e.target.value = null;
          MySwal.fire({
            icon: "error",
            title: "Empty or Invalid File",
            text: "Uploaded file is empty or invalid format.",
            confirmButtonText: "OK",
          });
          return;
        }

        const namePattern = /^[A-Za-z\s.'-]+$/;
        const phonePattern = /^\d{10}$/;
        const allowedDocs = [
          "PAN",
          "AADHAAR",
          "PASSPORT",
          "ISLANDERCARD",
          "OTHER",
        ];
        const allowedGenders = ["Male", "Female", "Other"];

        const validPassengers = [];
        const invalidPassengers = [];

        for (let p of jsonData) {
          const name = (p["Name"] || "").trim();
          const fatherName = (p["FatherName"] || "").trim();
          const age = Number(p["Age"]);
          const genderRaw = (p["Gender"] || "").trim();
          const gender =
            genderRaw.charAt(0).toUpperCase() +
            genderRaw.slice(1).toLowerCase();
          const phone = (p["Phone"] || "").toString().trim();
          const residence = (p["Residence"] || "").trim();

          const documentType = (p["DocumentType"] || "").trim().toUpperCase();
          const documentIdRaw = (p["DocumentId"] || "").toString().trim();
          const isIslanderVal = (p["IsIslander"] || "")
            .toString()
            .trim()
            .toLowerCase();

          const errors = [];

          if (!name) errors.push("Name required");
          if (!age || isNaN(age) || age < 0 || age > 120)
            errors.push("Valid Age required");

          if (!allowedGenders.includes(gender)) errors.push("Invalid Gender");

          if (!/^\d{10}$/.test(phone)) errors.push("Phone must be 10 digits");

          if (!residence) errors.push("Residence required");

          if (!allowedDocs.includes(documentType))
            errors.push("Invalid DocumentType");

          if (!documentIdRaw) errors.push("DocumentId required");

          if (!["yes", "no"].includes(isIslanderVal))
            errors.push("IsIslander must be yes or no");

          if (errors.length === 0) {
            validPassengers.push({
              name,
              fatherName,
              age,
              gender,
              phone,
              residence,
              documentType,
              documentId: documentIdRaw.slice(-4),
              isIslander: isIslanderVal === "yes" ? 1 : 0,
              isForeigner: 0,
            });
          } else {
            invalidPassengers.push({ ...p, errors });
          }
        }
        e.target.value = null;

        if (invalidPassengers.length > 0) {
          console.warn("Invalid rows in uploaded file:", invalidPassengers);
          MySwal.fire({
            icon: "warning",
            title: "Invalid Rows Detected",
            html: `
<b>${invalidPassengers.length}</b> invalid rows skipped.<br/>
Check console for details.
`,
            confirmButtonText: "OK",
          });
        }

        const existingSeatRequired = getSeatRequiredCount(formData.Passengers);
        const uploadSeatRequired = validPassengers.filter(
          (p) => Number(p.age) > 12,
        ).length;

        if (existingSeatRequired + uploadSeatRequired > vehicleSeating) {
          e.target.value = null;
          MySwal.fire({
            icon: "error",
            title: "Seating Limit Exceeded",
            text: `Adult passenger count exceeds vehicle seating capacity (${vehicleSeating}).`,
            confirmButtonText: "OK",
          });
          return;
        }

        if (validPassengers.length > 0) {
          setFormData((prev) => ({
            ...prev,
            Passengers: [...prev.Passengers, ...validPassengers],
          }));
          setPassengerSuccess(
            `${validPassengers.length} passengers imported successfully`,
          );
          setTimeout(() => setPassengerSuccess(""), 3000);
        } else if (validPassengers.length === 0) {
          MySwal.fire({
            icon: "warning",
            title: "No Valid Passengers",
            text: "No valid passengers found in uploaded file.",
            confirmButtonText: "OK",
          });
        }
      } catch (error) {
        console.error("Error processing file: ", error);
        e.target.value = null;
        MySwal.fire({
          icon: "error",
          title: "File Read Error",
          text: "Error reading the uploaded file. Please ensure it is a valid Excel or CSV.",
          confirmButtonText: "OK",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };
  console.log("userrrrrrrr", user.usertype);

  const selectedOriginPlace = locationList.find(
    (place) => String(place.id) === String(formData.origin),
  );
  const getAdultCount = (passengers) =>
    passengers.filter((p) => Number(p.age) > 12).length;

  const getChildCount = (passengers) =>
    passengers.filter((p) => Number(p.age) <= 12).length;

  return (
    <DashboardLayout>
      <Card className="w-full max-w-full mx-auto mt-6 overflow-x-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
            <CardTitle>
              {step === 1 ? "Trip Details" : "Passenger Details"}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={step === 1 ? "default" : "outline"}
                onClick={() => setStep(1)}
              >
                Step 1
              </Button>
              <Button
                variant={step === 2 ? "default" : "outline"}
                onClick={handleNext}
              >
                step 2
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 max-w-full">
              <div className="w-full">
                <Label>
                  Is this a Tourist Trip?{" "}
                  <span className="text-red-600">*</span>
                </Label>
                <select
                  value={isTouristTrip}
                  onChange={(e) => setIsTouristTrip(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {/* Vehicle Select */}
              <div className="w-full">
                <Label htmlFor="vId">
                  Select Vehicle<span className="text-red-600">*</span>
                </Label>

                <select
                  name="vId"
                  value={formData.vId}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full text-sm max-w-full"
                >
                  <option value="">Select Vehicle</option>
                  {vehicleList.map((vehicle) => (
                    <option key={vehicle.vId} value={vehicle.vId}>
                      {vehicle.vNum} - {vehicle.vCat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Select */}
              <div className="w-full">
                <Label htmlFor="dId">
                  Select Driver <span className="text-red-600">*</span>
                </Label>
                <select
                  name="dId"
                  value={formData.dId}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full text-sm max-w-full"
                >
                  <option value="">Select Driver</option>
                  {driverList.length > 0 ? (
                    driverList.map((driver) => (
                      <option key={driver.dId} value={driver.dId}>
                        {driver.dFirstName} {driver.dLastName} (
                        {driver.licenseNo})
                      </option>
                    ))
                  ) : (
                    <option disabled>No drivers available</option>
                  )}
                </select>
              </div>

              {/* Date */}
              <div className="w-full">
                <Label htmlFor="date">
                  Select Date <span className="text-red-600">*</span>
                </Label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  className="border rounded px-3 py-2 w-full text-sm max-w-full"
                  min={minDate}
                  max={maxDate}
                  value={formData.date}
                  onChange={handleChange}
                  disabled={!serverDate} // prevent use before API loads
                />
              </div>

              {/* Origin */}
              <div className="w-full">
                <Label htmlFor="origin">
                  Origin <span className="text-red-600">*</span>
                </Label>
                <select
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full text-sm max-w-full"
                >
                  <option value="">Select Origin</option>
                  {locationList.map((place) => (
                    <option key={place.id} value={String(place.id)}>
                      {place.location}
                    </option>
                  ))}
                </select>
                {/* Info message just below Convey Time */}
                {formData.origin && (
                  <p className="text-sky-600 text-xs mt-1 font-semibold italic">
                    ℹ️{" "}
                    {(() => {
                      const originPlace = locationList.find(
                        (place) => String(place.id) === formData.origin,
                      );
                      if (!originPlace) return null;
                      //console.log("location", originPlace.location);
                      return originPlace.location.toLowerCase() ===
                        "jirkatang" ? (
                        <>
                          Your first checkpoint will be <b>Jirkatang</b>{" "}
                          Checkpost.
                        </>
                      ) : (
                        <>
                          Your first checkpoint will be <b>Middlestreit</b>{" "}
                          Checkpost.
                        </>
                      );
                    })()}
                  </p>
                )}
              </div>

              {/* Destination */}
              <div className="w-full relative">
                <Label htmlFor="destination">
                  Destination <span className="text-red-600">*</span>
                </Label>
                <select
                  name="destination"
                  value={formData.destination || ""}
                  onChange={handleChange}
                  disabled={!formData.origin}
                  className="border rounded px-3 py-2 w-full text-sm max-w-full"
                >
                  <option value="">Select Destination</option>

                  {locationList
                    .filter(
                      (place) =>
                        !selectedOriginPlace ||
                        String(place.loc_id) !==
                          String(selectedOriginPlace.loc_id),
                    )
                    .map((place) => (
                      <option key={place.id} value={String(place.id)}>
                        {place.location}
                      </option>
                    ))}
                </select>
              </div>

              {/* Convey Time */}
              <div className="w-full">
                <Label htmlFor="convoyTime">
                  Convoy Time <span className="text-red-600">*</span>
                </Label>
                <select
                  id="convoyTime"
                  name="convoyTime"
                  value={formData.convoyTime}
                  onChange={handleChange}
                  disabled={!formData.origin || !formData.date}
                  className="border rounded px-3 py-2 w-full text-sm max-w-full"
                >
                  <option value="">Select Convoy Time</option>
                  {availableConveyTimes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.convey_time} ({item.convey_name})
                    </option>
                  ))}
                </select>

                {/* No conveys available message */}
                {availableConveyTimes.length === 0 &&
                  formData.origin &&
                  formData.date && (
                    <p className="text-red-600 text-xs mt-1">
                      No active conveys available for this origin and date.
                    </p>
                  )}
              </div>
<<<<<<< HEAD
=======

              <div className="space-y-2">
                <Label>Return Journey</Label>
                <select
                  value={isReturn ? "yes" : "no"}
                  onChange={(e) => {
                    const value = e.target.value === "yes";
                    setIsReturn(value);

                    if (!value) {
                      setReturnDate("");
                      setReturnConvoyTime("");
                      setReturnType("same");
                      setReturnPassengers([]);
                      setReturnConveyList([]); // 🔥 IMPORTANT
                    }
                  }}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              {isReturn && (
                <>
                  <div className="space-y-2">
                    <Label>Return Date</Label>
                    <input
                      type="date"
                      value={returnDate}
                      min={formData.date || minDate} // 🔥 IMPORTANT
                      max={maxDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="border rounded px-3 py-2 w-full text-sm max-w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Return Convoy Time</Label>
                    <select
                      value={returnConvoyTime}
                      disabled={!returnDate} // ✅ add this
                      onChange={(e) => setReturnConvoyTime(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select</option>
                      {returnConveyList?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.convey_time} ({c.convey_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
>>>>>>> b2b3d2d (20042026 return trip completed)
            </div>
          )}
          {step === 2 && (
            <>
              {/* Trip summary card */}
              <Card className="mb-6 bg-gray-50 border border-gray-200 shadow-sm">
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-700 pt-4">
                  <div>
                    <strong>Vehicle No:</strong>{" "}
                    {selectedVehicle?.vNum ||
                      `Vehicle ${formData.vId || "N/A"}`}
                  </div>
                  <div>
                    <strong>Route:</strong>{" "}
                    {locationList.find(
                      (p) => String(p.id) === String(formData.origin),
                    )?.location || "N/A"}{" "}
                    →{" "}
                    {locationList.find(
                      (p) => String(p.id) === String(formData.destination),
                    )?.location || "N/A"}
                  </div>

                  <div>
                    <strong>Date:</strong> {formData.date}
                  </div>
                  <div>
                    <strong>Convoy Time:</strong>{" "}
                    {(() => {
                      const matching = conveyTimeList.find(
                        (p) => String(p.id) === String(formData.convoyTime),
                      );
                      return matching
                        ? `${matching.convey_time} (${matching.convey_name})`
                        : "N/A";
                    })()}
                  </div>
                  <div>
                    <div>
                      <strong>Total Passengers:</strong>{" "}
                      {formData.Passengers.length}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Adults: {getAdultCount(formData.Passengers)}
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Children: {getChildCount(formData.Passengers)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <strong>Vehicle Capacity:</strong> {vehicleSeating}{" "}
                    {/* out of {vehicleSeating || "N/A"} seats filled */}
                  </div>
                </CardContent>
              </Card>
              <div className="mb-6">
                <Label>
                  Are Passengers Foreigners?{" "}
                  <span className="text-red-600">*</span>
                </Label>
                <select
                  value={isForeigner}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIsForeigner(value);
                    setEditIndex(-1);
                    setIsIslander("");

                    if (value === "yes") {
                      // ✅ Foreigner → always PASSPORT
                      setPassenger({
                        title: "",
                        name: "",
                        fatherName: "",
                        age: "",
                        gender: "",
                        phone: "",
                        residence: "",
                        documentType: "PASSPORT", // ✅ FIX
                        documentId: "",
                        passportNo: "",
                        nationality: "",
                        visaNo: "",
                      });
                    } else {
                      // ✅ Indian
                      setPassenger({
                        name: "",
                        fatherName: "",
                        age: "",
                        gender: "",
                        phone: "",
                        residence: "",
                        documentType: "",
                        documentId: "",
                      });
                    }
                  }}
                  className="border rounded px-3 py-2 w-full sm:w-1/3 text-sm"
                >
                  <option value="">Select</option>
                  <option value="no">No (Indian)</option>
                  <option value="yes">Yes (Foreigner)</option>
                </select>
              </div>

              {/* Passenger entry form */}
              {/* Passenger Entry (Indian / Foreigner) */}
              {isForeigner === "no" && (
                <AddPassengerIndian
                  passenger={passenger}
                  setPassenger={setPassenger}
                  isIslander={isIslander}
                  setIsIslander={setIsIslander}
                  onAdd={handleAddPassenger}
                  editIndex={editIndex}
                />
              )}

              {isForeigner === "yes" && (
                <AddPassengerForeigner
                  passenger={passenger}
                  setPassenger={setPassenger}
                  onAdd={handleAddPassenger}
                  editIndex={editIndex}
                />
              )}

              {/* Excel Upload - only for usertype 2 */}
              {user?.usertype === 2 && isForeigner === "no" && (
                <div className="mb-4">
                  <Label className="font-semibold">
                    Upload Passengers (Excel)
                  </Label>

                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="mt-2 block w-full text-sm border rounded p-2 bg-white"
                  />

                  <p className="text-xs text-gray-500 mt-1">
                    Upload Excel file with passenger details.
                  </p>
                </div>
              )}

              {/* Passenger Table - Responsive */}
              <div className="border p-2 sm:p-4 rounded-lg bg-gray-50 mt-6 overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4">Passenger Table</h3>
                <table className="min-w-full text-xs sm:text-sm bg-white rounded">
                  <thead className="hidden sm:table-header-group">
                    {/* Hide headers on mobile, show on desktop */}
                    <tr>
                      <th className="p-2 border-b text-left font-semibold">
                        #
                      </th>
                      <th className="p-2 border-b text-left font-semibold">
                        Name
                      </th>
                      <th className="p-2 border-b text-left font-semibold">
                        Age
                      </th>
                      <th className="p-2 border-b text-left font-semibold">
                        Gender
                      </th>
                      <th className="p-2 border-b text-left font-semibold">
                        Phone
                      </th>
                      <th className="p-2 border-b text-left font-semibold">
                        Doc Type
                      </th>
                      <th className="p-2 border-b text-left font-semibold">
                        Doc ID
                      </th>
                      <th className="p-2 border-b text-left font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.Passengers.map((p, idx) => (
                      <tr
                        key={idx}
                        className="flex flex-col sm:table-row border-b mb-2 sm:mb-0"
                      >
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.age}</td>
                        <td className="p-2">{p.gender}</td>
                        <td className="p-2">{p.phone}</td>
                        <td className="p-2">{p.documentType}</td>
                        <td className="p-2">{p.documentId || p.passportNo}</td>
                        <td className="p-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPassenger(idx)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemovePassenger(idx)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 max-w-full">
            {step === 1 && (
              <Button onClick={handleNext} className="w-full sm:w-auto">
                Next
              </Button>
            )}
            {step === 2 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="bg-gray-200 text-gray-700 w-full sm:w-auto"
                >
                  Previous
                </Button>
                <Button onClick={handleSubmit} className="w-full sm:w-auto">
                  Submit
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
<<<<<<< HEAD
=======

      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              Modify Return Passengers
            </h2>

            {/* Passenger Table */}
            <div className="max-h-60 overflow-y-auto mb-4">
              <table className="w-full text-sm border rounded">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">#</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Age</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {returnPassengers.map((p, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">{p.age}</td>
                      <td className="p-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPassenger(p);
                            setEditIndex(i);
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setReturnPassengers((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ➕ Add Passenger Button */}
            <Button
              className="mb-4 w-full"
              onClick={() => {
                setPassenger({
                  name: "",
                  fatherName: "",
                  age: "",
                  gender: "",
                  phone: "",
                  residence: "",
                  documentType: "",
                  documentId: "",
                });
                setEditIndex(-1);
              }}
            >
              ➕ Add Passenger
            </Button>

            {/* Passenger Form */}
            {isForeigner === "no" && (
              <AddPassengerIndian
                passenger={passenger}
                setPassenger={setPassenger}
                isIslander={isIslander}
                setIsIslander={setIsIslander}
                onAdd={() => {
                  const passengerToSave = buildPassengerToSave();

                  if (editIndex !== -1) {
                    const updated = [...returnPassengers];
                    updated[editIndex] = passengerToSave;
                    setReturnPassengers(updated);
                    setEditIndex(-1);
                  } else {
                    setReturnPassengers((prev) => [...prev, passengerToSave]);
                  }

                  setPassenger({
                    name: "",
                    fatherName: "",
                    age: "",
                    gender: "",
                    phone: "",
                    residence: "",
                    documentType: "",
                    documentId: "",
                  });
                }}
                editIndex={editIndex}
              />
            )}

            {isForeigner === "yes" && (
              <AddPassengerForeigner
                passenger={passenger}
                setPassenger={setPassenger}
                onAdd={() => {
                  const passengerToSave = buildPassengerToSave();

                  if (editIndex !== -1) {
                    const updated = [...returnPassengers];
                    updated[editIndex] = passengerToSave;
                    setReturnPassengers(updated);
                    setEditIndex(-1);
                  } else {
                    setReturnPassengers((prev) => [...prev, passengerToSave]);
                  }

                  setPassenger({
                    title: "",
                    name: "",
                    fatherName: "",
                    age: "",
                    gender: "",
                    phone: "",
                    residence: "",
                    documentType: "PASSPORT",
                    documentId: "",
                    passportNo: "",
                    nationality: "",
                    visaNo: "",
                  });
                }}
                editIndex={editIndex}
              />
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnType("same");
                }}
                variant="outline"
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  const accepted = await showTripRulesModal();
                  if (!accepted) return;

                  setShowReturnModal(false);
                  submitTrip("modified", accepted);
                }}
              >
                Submit Return
              </Button>
            </div>
          </div>
        </div>
      )}
>>>>>>> b2b3d2d (20042026 return trip completed)
    </DashboardLayout>
  );
}
