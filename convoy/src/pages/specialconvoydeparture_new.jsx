import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { formatDateDDMMYY } from "@/utils/dateUtils";

import {
  getDriverList,
  getVehicleList,
  getOriginDestinations,
  getCurrentDateTime1,
} from "@/contexts/GetApi";
import { useAuth } from "@/contexts/AuthContext";
import { handleAddTripAPI } from "@/contexts/PostApi";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import AddPassengerIndian from "@/components/passengers/AddPassengerIndian";
import AddPassengerForeigner from "@/components/passengers/AddPassengerForeigner";

const MySwal = withReactContent(Swal);

export default function specialConvoyDeparture() {
  const { user, accessToken } = useAuth();
  const [vehicleList, setVehicleList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [locationList, setLocationList] = useState([]);

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

  const [formData, setFormData] = useState({
    vId: "",
    dId: "",
    origin: "",
    destination: "",
    loc_id: "",
    date: "",
    convoyTime: "",
    specialType: "",
    Passengers: [],
  });

  const [passenger, setPassenger] = useState({
    title: "",
    name: "",
    fatherName: "",
    age: "",
    gender: "",
    phone: "",
    residence: "",
    documentType: "",
    documentId: "",
    passportNo: "",
    nationality: "",
    visaNo: "",
  });

  const getSeatRequiredCount = (passengers) => {
    return passengers.filter((p) => Number(p.age) > 12).length;
  };

  const mapPassengerForPayload = (p) => {
    const isPassengerForeigner = p.isForeigner === 1 || p.isForeigner === "1";

    return {
      PassengerName: p.PassengerName ?? p.name,
      FatherName: p.FatherName ?? p.fatherName ?? null,
      Age: p.Age ?? p.age,
      Gender: p.Gender ?? p.gender,
      PhoneNo: p.PhoneNo ?? p.phone,
      isForeigner: isPassengerForeigner ? 1 : 0,
      isIslander: p.isIslander ?? null,
      docType: isPassengerForeigner ? "PASSPORT" : p.documentType || p.docType,
      docId: isPassengerForeigner
        ? p.passportNo || p.docId
        : p.documentId || p.docId,
      Nationality: isPassengerForeigner ? p.nationality || p.Nationality : null,
      VisaNo: isPassengerForeigner ? p.visaNo || p.VisaNo : null,
      Residence: p.residence || p.Residence,
    };
  };

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
        setLocationList(Array.isArray(originDestRes) ? originDestRes : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setVehicleList([]);
        setDriverList([]);
        setLocationList([]);
      }
    };

    if (accessToken) fetchData();
  }, [accessToken]);

  useEffect(() => {
    const fetchServerTime = async () => {
      if (!accessToken) return;
      try {
        const currentTimeData = await getCurrentDateTime1(accessToken);
        setServerTime(currentTimeData?.time);
        setServerDate(currentTimeData?.date);
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };
    fetchServerTime();
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
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  let minDate = "";
  let maxDate = "";

  if (serverDate) {
    const [year, month, day] = serverDate.split("-").map(Number);
    const today = new Date(year, month - 1, day);

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
        text: "Vehicle seating information is not available.",
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
      isForeigner: isForeigner === "yes" ? 1 : 0,
      isIslander: isForeigner === "no" ? (isIslander === "yes" ? 1 : 0) : null,
      passportNo: isForeigner === "yes" ? passenger.passportNo : null,
      nationality: isForeigner === "yes" ? passenger.nationality : null,
      visaNo: isForeigner === "yes" ? passenger.visaNo : null,
      documentType: isForeigner === "yes" ? "PASSPORT" : passenger.documentType,
      documentId: isForeigner === "yes" ? null : passenger.documentId,
    };

    if (isForeigner === "yes") {
      passengerToSave.documentType = "PASSPORT";
    }

    // Indian Validation
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

    // Foreigner Validation
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

    if (editIndex === -1) {
      setFormData((prev) => ({
        ...prev,
        Passengers: [...prev.Passengers, passengerToSave],
      }));
      setPassengerSuccess("Passenger added successfully!");
    } else {
      const updated = [...formData.Passengers];
      updated[editIndex] = passengerToSave;
      setFormData((prev) => ({
        ...prev,
        Passengers: updated,
      }));
      setPassengerSuccess("Passenger updated successfully!");
      setEditIndex(-1);
    }

    setPassenger({
      title: "",
      name: "",
      fatherName: "",
      age: "",
      gender: "",
      phone: "",
      residence: "",
      documentType: "",
      documentId: "",
      passportNo: "",
      nationality: "",
      visaNo: "",
    });

    setTimeout(() => setPassengerSuccess(""), 3000);
  };

  const handleEditPassenger = (index) => {
    const p = formData.Passengers[index];
    setPassenger({
      ...p,
      documentType: p.documentType || "PASSPORT",
      passportNo: p.passportNo || "",
      nationality: p.nationality || "",
      visaNo: p.visaNo || "",
    });

    setIsForeigner(p.isForeigner === 1 ? "yes" : "no");

    if (p.isForeigner === 0) {
      setIsIslander(p.isIslander === 1 ? "yes" : "no");
    } else {
      setIsIslander("");
    }

    setEditIndex(index);
  };

  const handleRemovePassenger = (index) => {
    setFormData((prev) => ({
      ...prev,
      Passengers: prev.Passengers.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    if (!isTouristTrip) {
      MySwal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please select whether this is a Tourist Trip.",
      });
      return;
    }

    const { vId, dId, origin, destination, date, convoyTime, specialType } =
      formData;

    if (
      !vId ||
      !dId ||
      !origin ||
      !destination ||
      !date ||
      !convoyTime ||
      !specialType
    ) {
      MySwal.fire({
        icon: "error",
        title: "Incomplete Trip Details",
        text: "Please fill all fields in Trip Details before proceeding.",
        confirmButtonText: "OK",
      });
      return;
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

  const submitTrip = async () => {
    const payload = {
      vId: formData.vId,
      dId: formData.dId,
      origin: formData.origin,
      destination: formData.destination,
      date: formData.date,
      convoyTime: formData.convoyTime,
      specialType: formData.specialType,
      isTouristTrip: isTouristTrip === "yes" ? 1 : 0,
      Passengers: formData.Passengers.map(mapPassengerForPayload),
      totalPax: formData.Passengers.length,
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

      // Reset form
      setFormData({
        vId: "",
        dId: "",
        origin: "",
        destination: "",
        loc_id: "",
        date: "",
        convoyTime: "",
        specialType: "",
        Passengers: [],
      });

      setStep(1);
      setEditIndex(-1);
      setVehicleSeating(null);
      setIsTouristTrip("");
      setIsForeigner("");
      setIsIslander("");
    });
  };

  const handleSubmit = async () => {
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
      });
      return;
    }

    const accepted = await showTripRulesModal();
    if (!accepted) return;

    await submitTrip();
  };

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
        text: "Vehicle seating information is not available.",
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
          if (!documentIdRaw) {
            errors.push("DocumentId required");
          } else if (documentIdRaw.length !== 4) {
            errors.push("DocumentId must be exactly 4 characters");
          }
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
            html: `<b>${invalidPassengers.length}</b> invalid rows skipped.<br/>Check console for details.`,
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
        } else {
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

  const selectedVehicle = vehicleList.find(
    (v) => String(v.vId) === String(formData.vId),
  );

  const selectedOriginPlace = locationList.find(
    (place) => String(place.id) === String(formData.origin),
  );

  const getAdultCount = (passengers) =>
    passengers.filter((p) => Number(p.age) > 12).length;

  const getChildCount = (passengers) =>
    passengers.filter((p) => Number(p.age) <= 12).length;

  const resetPassenger = () => ({
    title: "",
    name: "",
    fatherName: "",
    age: "",
    gender: "",
    phone: "",
    residence: "",
    documentType: "",
    documentId: "",
    passportNo: "",
    nationality: "",
    visaNo: "",
  });

  return (
    <DashboardLayout>
      <Card className="w-full max-w-full mx-auto mt-6 overflow-x-hidden">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
            <CardTitle className="text-lg sm:text-xl">
              {step === 1 ? "Special Convoy Trip Details" : "Passenger Details"}
            </CardTitle>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant={step === 1 ? "default" : "outline"}
                onClick={() => setStep(1)}
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                Step 1
              </Button>
              <Button
                variant={step === 2 ? "default" : "outline"}
                onClick={handleNext}
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                Step 2
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          {step === 1 && (
            <div className="space-y-4">
              {/* First Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs sm:text-sm">
                    Is Tourist Trip <span className="text-red-600">*</span>
                  </Label>
                  <select
                    value={isTouristTrip}
                    onChange={(e) => setIsTouristTrip(e.target.value)}
                    className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="vId" className="text-xs sm:text-sm">
                    Select Vehicle <span className="text-red-600">*</span>
                  </Label>
                  <select
                    name="vId"
                    value={formData.vId}
                    onChange={handleChange}
                    className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicleList.map((vehicle) => (
                      <option key={vehicle.vId} value={vehicle.vId}>
                        {vehicle.vNum} - {vehicle.vCat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="dId" className="text-xs sm:text-sm">
                    Select Driver <span className="text-red-600">*</span>
                  </Label>
                  <select
                    name="dId"
                    value={formData.dId}
                    onChange={handleChange}
                    className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
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

                <div>
                  <Label htmlFor="date" className="text-xs sm:text-sm">
                    Select Date <span className="text-red-600">*</span>
                  </Label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
                    min={minDate}
                    max={maxDate}
                    value={formData.date}
                    onChange={handleChange}
                    disabled={!serverDate}
                  />
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="origin" className="text-xs sm:text-sm">
                    Origin <span className="text-red-600">*</span>
                  </Label>
                  <select
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
                  >
                    <option value="">Select Origin</option>
                    {locationList.map((place) => (
                      <option key={place.id} value={String(place.id)}>
                        {place.location}
                      </option>
                    ))}
                  </select>
                  {formData.origin && (
                    <p className="text-sky-600 text-xs mt-1 font-semibold italic">
                      ℹ️{" "}
                      {(() => {
                        const originPlace = locationList.find(
                          (place) => String(place.id) === formData.origin,
                        );
                        if (!originPlace) return null;
                        return originPlace.location.toLowerCase() ===
                          "jirkatang" ? (
                          <>
                            First checkpoint: <b>Jirkatang</b>
                          </>
                        ) : (
                          <>
                            First checkpoint: <b>Middlestreit</b>
                          </>
                        );
                      })()}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="destination" className="text-xs sm:text-sm">
                    Destination <span className="text-red-600">*</span>
                  </Label>
                  <select
                    name="destination"
                    value={formData.destination || ""}
                    onChange={handleChange}
                    disabled={!formData.origin}
                    className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
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

                <div>
                  <Label className="text-xs sm:text-sm">
                    Convoy Type <span className="text-red-600">*</span>
                  </Label>
                  <select
                    name="specialType"
                    value={formData.specialType || ""}
                    onChange={handleChange}
                    className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
                  >
                    <option value="">Select</option>
                    <option value="100">🚨 Emergency Cases</option>
                    <option value="200">⭐ VIP Cases</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs sm:text-sm">
                    Time <span className="text-red-600">*</span>
                  </Label>
                  <input
                    type="time"
                    name="convoyTime"
                    value={formData.convoyTime || ""}
                    onChange={handleChange}
                    className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              {/* Trip Summary */}
              <Card className="mb-4 sm:mb-6 bg-gray-50 border border-gray-200 shadow-sm">
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 pt-3 sm:pt-4">
                  <div>
                    <strong>Vehicle:</strong>{" "}
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
                    <strong>Convoy Time:</strong> {formData.convoyTime || "N/A"}
                  </div>
                  <div>
                    <strong>Type:</strong>{" "}
                    {formData.specialType === "100"
                      ? "Emergency"
                      : formData.specialType === "200"
                        ? "VIP"
                        : "N/A"}
                  </div>
                  <div>
                    <div>
                      <strong>Passengers:</strong> {formData.Passengers.length}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Adults: {getAdultCount(formData.Passengers)}
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Children: {getChildCount(formData.Passengers)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Passenger Type Selection */}
              <div className="mb-4 sm:mb-6">
                <Label className="text-xs sm:text-sm">
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
                  }}
                  className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
                >
                  <option value="">Select</option>
                  <option value="no">Indian</option>
                  <option value="yes">Foreigner</option>
                </select>
              </div>

              {/* Islander Selection (only for Indian) */}
              {isForeigner === "no" && (
                <div className="mb-4 sm:mb-6">
                  <Label className="text-xs sm:text-sm">
                    Is Passenger an Islander?{" "}
                    <span className="text-red-600">*</span>
                  </Label>
                  <select
                    value={isIslander}
                    onChange={(e) => setIsIslander(e.target.value)}
                    className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              )}

              {/* Passenger Form */}
              {isForeigner === "no" && (
                <AddPassengerIndian
                  passenger={passenger}
                  setPassenger={setPassenger}
                  onAddPassenger={handleAddPassenger}
                  editIndex={editIndex}
                  isIslander={isIslander}
                  onFileUpload={handleFileUpload}
                  passengerSuccess={passengerSuccess}
                />
              )}

              {isForeigner === "yes" && (
                <AddPassengerForeigner
                  passenger={passenger}
                  setPassenger={setPassenger}
                  onAddPassenger={handleAddPassenger}
                  editIndex={editIndex}
                  passengerSuccess={passengerSuccess}
                />
              )}

              {/* Passengers List */}
              {formData.Passengers.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <h3 className="text-sm sm:text-base font-bold mb-3">
                    Passengers ({formData.Passengers.length})
                  </h3>
                  <div className="space-y-2">
                    {formData.Passengers.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded border border-gray-200"
                      >
                        <div className="text-xs sm:text-sm">
                          <p>
                            <strong>{p.name}</strong> - Age: {p.age}
                          </p>
                          <p className="text-gray-600">
                            {p.phone} | {p.residence}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleEditPassenger(idx)}
                            size="sm"
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleRemovePassenger(idx)}
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="text-xs sm:text-sm"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                >
                  Submit
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
