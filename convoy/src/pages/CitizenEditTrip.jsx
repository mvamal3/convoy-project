import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  getEditTripDetails,
  getOriginDestinations,
  getConveyTimeByLocId,
  getStopConveyDetails,
  getCurrentDateTime1,
} from "@/contexts/GetApi";
import { updateTripAPI } from "@/contexts/PostApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import AddPassengerIndian from "@/components/passengers/AddPassengerIndian";
import AddPassengerForeigner from "@/components/passengers/AddPassengerForeigner";

const MySwal = withReactContent(Swal);

export default function CitizenEditTrip() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { tripId } = useParams();

  const [vehicleList, setVehicleList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [conveyTimeList, setConveyTimeList] = useState([]);
  const [stopConveyList, setStopConveyList] = useState([]);
  const [serverTime, setServerTime] = useState(null);
  const [serverDate, setServerDate] = useState(null);

  const [step, setStep] = useState(1);
  const [passengerSuccess, setPassengerSuccess] = useState("");
  const [editingPassengerIndex, setEditingPassengerIndex] = useState(null);
  const [deletedPassengers, setDeletedPassengers] = useState([]);
  const [vehicleSeating, setVehicleSeating] = useState(null);
  const [isTouristTrip, setIsTouristTrip] = useState("");
  const [isForeigner, setIsForeigner] = useState("");
  const [isIslander, setIsIslander] = useState("");
  const [errors, setErrors] = useState({});

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

  // Fetch server time
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

  // Calculate server minutes for time comparison
  const getMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return null;

    const parts = timeStr.split(":").map(Number);

    const hour = parts[0] || 0;
    const minute = parts[1] || 0;

    return hour * 60 + minute;
  };

  const serverMinutes = getMinutes(serverTime);
  const isToday = formData.date === serverDate;

  const GRACE_MINUTES = 30;

  const availableConveyTimes = conveyTimeList
    .filter((ct) => {
      // ✅ allow all until server loads
      if (!serverDate || !serverTime) return true;

      const serverMinutes = getMinutes(serverTime);

      // ✅ fallback if invalid server time
      if (serverMinutes === null || isNaN(serverMinutes)) return true;

      if (isToday) {
        const convoyMinutes = getMinutes(ct.convey_time);

        if (convoyMinutes === null || isNaN(convoyMinutes)) return false;

        // ✅ 30 min grace logic
        return convoyMinutes + GRACE_MINUTES > serverMinutes;
      }

      return true;
    })
    .filter((ct) => !stopConveyList.includes(String(ct.id)));

  // Fetch trip data
  useEffect(() => {
    if (!accessToken || !tripId) return;

    async function fetchData() {
      try {
        const res = await getEditTripDetails(accessToken, tripId);
        console.log("Edit Trip API Response:", res);

        if (res?.data) {
          // Set vehicle list
          const vehicles = res.data.availabledata?.vehicles?.vehicle || [];
          setVehicleList(Array.isArray(vehicles) ? vehicles : []);

          // Set driver list
          const drivers = res.data.availabledata?.drivers?.driver || [];
          setDriverList(Array.isArray(drivers) ? drivers : []);

          const tripData = res.data.selecteddata?.data;

          if (tripData) {
            console.log("Trip Data isTourist:", tripData.isTourist);

            // Parse passengers
            const passengers = (tripData.passengers || []).map((p) => ({
              pId: p.pId,
              name: p.passengerName,
              fatherName: p.fatherName || "",
              age: p.age,
              gender: p.gender,
              phone: p.phoneNo,
              residence: p.residence || "",
              documentType: p.docType || "",
              documentId: p.docId || "",
              passportNo: p.docType === "PASSPORT" ? p.docId : "",
              nationality: p.nationality || "",
              visaNo: p.visaNumber || "",
              isForeigner: p.isForeigner || 0,
              isNew: false,
              isModified: false,
            }));

            // Set isTouristTrip based on API value
            if (tripData.isTourist === 1) {
              setIsTouristTrip("yes");
            } else if (tripData.isTourist === 0) {
              setIsTouristTrip("no");
            } else {
              setIsTouristTrip(""); // Default empty if not set
            }

            // Set form data
            setFormData({
              vId: tripData.vId ? String(tripData.vId) : "",
              dId: tripData.dId ? String(tripData.dId) : "",
              origin: tripData.origin ? String(tripData.origin) : "",
              destination: tripData.destination
                ? String(tripData.destination)
                : "",
              loc_id: tripData.loc_id || "",
              date: tripData.date || "",
              convoyTime: tripData.conveytime
                ? String(tripData.conveytime)
                : "",
              Passengers: passengers,
            });

            // Set vehicle seating
            const selectedVehicle = vehicles.find(
              (v) => String(v.vId) === String(tripData.vId),
            );
            setVehicleSeating(
              selectedVehicle ? Number(selectedVehicle.vSeating) : null,
            );
          }
        }
      } catch (error) {
        console.error("Error fetching trip data:", error);
        setVehicleList([]);
        setDriverList([]);
      }
    }
    fetchData();
  }, [accessToken, tripId]);

  // Fetch locations
  useEffect(() => {
    async function fetchLocations() {
      if (!accessToken) return;
      try {
        const originDestRes = await getOriginDestinations(accessToken);
        setLocationList(Array.isArray(originDestRes) ? originDestRes : []);
      } catch {
        setLocationList([]);
      }
    }
    fetchLocations();
  }, [accessToken]);

  // Update loc_id on origin change
  useEffect(() => {
    if (formData.origin) {
      const selectedPlace = locationList.find(
        (p) => String(p.id) === formData.origin,
      );
      if (selectedPlace) {
        setFormData((prev) => ({
          ...prev,
          loc_id: selectedPlace.loc_id || "",
        }));
      }
    }
  }, [formData.origin, locationList]);

  // Fetch convey times on loc_id change
  useEffect(() => {
    async function fetchConveyTimes() {
      if (!accessToken || !formData.loc_id) {
        setConveyTimeList([]);
        return;
      }
      try {
        const res = await getConveyTimeByLocId(formData.loc_id, accessToken);
        setConveyTimeList(Array.isArray(res) ? res : []);
      } catch {
        setConveyTimeList([]);
      }
    }
    fetchConveyTimes();
  }, [formData.loc_id, accessToken]);

  // Fetch stopped conveys on loc_id or date
  useEffect(() => {
    async function fetchStoppedConveys() {
      if (!accessToken || !formData.loc_id || !formData.date) {
        setStopConveyList([]);
        return;
      }
      try {
        const rawData = await getStopConveyDetails(
          accessToken,
          formData.loc_id,
          formData.date,
        );
        const stoppedIds = rawData
          .filter((c) => String(c.status) === "0")
          .map((c) => String(c.conveyid));
        setStopConveyList(stoppedIds);
      } catch {
        setStopConveyList([]);
      }
    }
    fetchStoppedConveys();
  }, [formData.loc_id, formData.date, accessToken]);

  // Handle form field changes
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
      const oppositePlace = locationList.find(
        (place) => String(place.loc_id) !== String(selectedPlace?.loc_id),
      );

      setFormData((prev) => ({
        ...prev,
        origin: value,
        loc_id: selectedPlace?.loc_id || "",
        destination: oppositePlace ? String(oppositePlace.id) : "",
        convoyTime: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Get seat required count
  const getSeatRequiredCount = (passengers) => {
    return passengers.filter((p) => Number(p.age) > 12).length;
  };

  // Add/update passenger
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
      isForeigner: isForeigner === "yes" ? 1 : 0,
      isNew: editingPassengerIndex === null,
      isModified: editingPassengerIndex !== null,
    };

    if (isForeigner === "yes") {
      passengerToSave.documentType = "PASSPORT";
    }

    // Indian validation
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

    // Foreigner validation
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

    // Seat validation
    let tempPassengers = [...formData.Passengers];

    if (editingPassengerIndex !== null) {
      passengerToSave.pId = tempPassengers[editingPassengerIndex].pId;
      tempPassengers[editingPassengerIndex] = passengerToSave;
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

    // Save passenger
    if (editingPassengerIndex === null) {
      setFormData({
        ...formData,
        Passengers: [...formData.Passengers, passengerToSave],
      });
      setPassengerSuccess("Passenger added successfully!");
    } else {
      const updatedPassengers = [...formData.Passengers];
      updatedPassengers[editingPassengerIndex] = passengerToSave;
      setFormData({
        ...formData,
        Passengers: updatedPassengers,
      });
      setPassengerSuccess("Passenger updated successfully!");
      setEditingPassengerIndex(null);
    }

    // Reset form
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

  // Edit passenger
  const handleEditPassenger = (index) => {
    const p = formData.Passengers[index];
    setPassenger({
      ...p,
      documentType: p.documentType || "PASSPORT",
    });

    setIsForeigner(p.isForeigner === 1 ? "yes" : "no");
    setEditingPassengerIndex(index);
  };

  // Remove passenger
  const handleRemovePassenger = (index) => {
    const p = formData.Passengers[index];
    if (p.pId) {
      setDeletedPassengers((prev) => [...prev, p.pId]);
    }

    setFormData({
      ...formData,
      Passengers: formData.Passengers.filter((_, i) => i !== index),
    });

    if (editingPassengerIndex === index) {
      setEditingPassengerIndex(null);
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
      setIsForeigner("");
      setIsIslander("");
    }

    setPassengerSuccess("Passenger removed successfully!");
    setTimeout(() => setPassengerSuccess(""), 2000);
  };

  // Handle Excel upload
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
        const allowedGenders = ["Male", "Female", "Other"];
        const allowedDocs = [
          "PAN",
          "AADHAAR",
          "PASSPORT",
          "IslanderCard",
          "OTHER",
        ];

        const validPassengers = [];
        const invalidPassengers = [];

        for (let p of jsonData) {
          const name = (p["Name"] || "").trim();
          const age = Number(p["Age"]);
          const gender = (p["Gender"] || "").trim();
          const phone = (p["Phone"] || "").toString().trim();
          const documentType = (p["DocumentType"] || "").trim();
          const documentIdRaw = (p["DocumentId"] || "").toString().trim();
          const documentId = documentIdRaw.slice(-4);
          const residence = (p["Residence"] || "").trim();

          const errors = [];
          if (!name || !namePattern.test(name)) errors.push("Invalid Name");
          if (!age || isNaN(age) || age <= 0 || age > 120)
            errors.push("Invalid Age");
          if (!allowedGenders.includes(gender)) errors.push("Invalid Gender");
          if (!phonePattern.test(phone)) errors.push("Invalid Phone");
          if (!allowedDocs.includes(documentType))
            errors.push("Invalid DocumentType");
          if (!documentId || documentId.length !== 4)
            errors.push("Invalid DocumentId");

          if (errors.length === 0) {
            validPassengers.push({
              name,
              age,
              gender,
              phone,
              documentType,
              documentId,
              residence,
              isForeigner: 0,
              isNew: true,
              isModified: false,
            });
          } else {
            invalidPassengers.push({ ...p, errors });
          }
        }

        if (invalidPassengers.length > 0) {
          MySwal.fire({
            icon: "warning",
            title: "Invalid Rows Detected",
            html: `${invalidPassengers.length} invalid rows were skipped.`,
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
            `${validPassengers.length} passengers added successfully!`,
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

  // Validation functions
  const validateTripDetails = () => {
    const newErrors = {};

    if (!isTouristTrip)
      newErrors.isTouristTrip = "Tourist trip selection is required.";
    if (!formData.vId) newErrors.vId = "Vehicle is required.";
    if (!formData.dId) newErrors.dId = "Driver is required.";
    if (!formData.origin) newErrors.origin = "Origin is required.";
    if (!formData.destination)
      newErrors.destination = "Destination is required.";
    if (!formData.date) newErrors.date = "Date is required.";
    if (!formData.convoyTime) newErrors.convoyTime = "Convey time is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build payload for API
  const buildPayloads = () => {
    const payloads = [];

    // Trip update
    payloads.push({
      type: "updateTrip",
      payload: {
        action: "updateTrip",
        tId: tripId,
        data: {
          vId: formData.vId,
          dId: formData.dId,
          origin: formData.origin,
          destination: formData.destination,
          date: formData.date,
          convoyTime: formData.convoyTime,
          isTourist: isTouristTrip === "yes" ? 1 : 0,
        },
      },
    });

    // Passenger operations
    formData.Passengers.forEach((p) => {
      if (p.isNew) {
        payloads.push({
          type: "addPassenger",
          payload: {
            action: "addPassenger",
            tId: tripId,
            data: {
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
            },
          },
        });
      } else if (p.isModified) {
        payloads.push({
          type: "updatePassenger",
          payload: {
            action: "updatePassenger",
            tId: tripId,
            pId: p.pId,
            data: {
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
            },
          },
        });
      }
    });

    // Passenger delete
    deletedPassengers.forEach((pId) => {
      payloads.push({
        type: "deletePassenger",
        payload: { action: "deletePassenger", tId: tripId, pId },
      });
    });

    return payloads;
  };

  // Save all changes
  const handleSubmit = async () => {
    if (!validateTripDetails()) {
      setStep(1);
      return;
    }

    if (!isTouristTrip) {
      MySwal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please select whether this is a Tourist Trip.",
      });
      return;
    }

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
        confirmButtonText: "OK",
      });
      return;
    }

    if (formData.Passengers.length === 0) {
      MySwal.fire({
        icon: "error",
        title: "No Passengers",
        text: "Please add at least one passenger.",
        confirmButtonText: "OK",
      });
      return;
    }

    const payload = buildPayloads();

    console.log("Final Payload for Update Trip:", payload);

    try {
      const res = await updateTripAPI(accessToken, payload);
      if (res.success) {
        MySwal.fire({
          icon: "success",
          title: "Trip Updated Successfully!",
          text: "Trip has been updated successfully!",
          confirmButtonText: "OK",
        }).then(() => {
          navigate(`/ManageTrip/ViewTrip/${tripId}`);
        });
      } else {
        MySwal.fire({
          icon: "error",
          title: "Update Failed",
          text: res.message || "Failed to update trip.",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Update Failed",
        text: "An error occurred while updating the trip.",
        confirmButtonText: "OK",
      });
    }
  };

  // Handle next step
  const handleNext = () => {
    if (!validateTripDetails()) {
      return;
    }

    if (!isTouristTrip) {
      MySwal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please select whether this is a Tourist Trip.",
      });
      return;
    }

    const { vId, dId, origin, destination, date, convoyTime } = formData;
    if (!vId || !dId || !origin || !destination || !date || !convoyTime) {
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

  // Helper functions for counts
  const getAdultCount = (passengers) =>
    passengers.filter((p) => Number(p.age) > 12).length;

  const getChildCount = (passengers) =>
    passengers.filter((p) => Number(p.age) <= 12).length;

  // Set min and max dates
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

  const selectedVehicle = vehicleList.find(
    (v) => String(v.vId) === String(formData.vId),
  );

  const selectedOriginPlace = locationList.find(
    (place) => String(place.id) === String(formData.origin),
  );

  return (
    <DashboardLayout>
      <Card className="w-full max-w-full mx-auto mt-6 overflow-x-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
            <CardTitle>
              {step === 1 ? "Edit Trip Details" : "Edit Passenger Details"}
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
                Step 2
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 max-w-full">
              {/* Tourist Trip */}
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
                {errors.isTouristTrip && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.isTouristTrip}
                  </p>
                )}
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
                {errors.vId && (
                  <p className="text-red-500 text-xs mt-1">{errors.vId}</p>
                )}
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
                {errors.dId && (
                  <p className="text-red-500 text-xs mt-1">{errors.dId}</p>
                )}
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
                  disabled={!serverDate}
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                )}
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
                {errors.origin && (
                  <p className="text-red-500 text-xs mt-1">{errors.origin}</p>
                )}
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

              {/* Destination - auto-selected based on origin */}
              <div className="w-full relative">
                <Label htmlFor="destination">
                  Destination <span className="text-red-600">*</span>
                </Label>
                <div className="border rounded px-3 py-2 w-full text-sm bg-gray-100 text-gray-700">
                  {formData.destination ? (
                    locationList.find(
                      (place) =>
                        String(place.id) === String(formData.destination),
                    )?.location || "Auto-selected"
                  ) : (
                    <span className="text-gray-400">Select origin first</span>
                  )}
                </div>
                {errors.destination && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.destination}
                  </p>
                )}
              </div>

              {/* Convey Time */}
              <div className="w-full">
                <Label htmlFor="convoyTime">
                  Convey Time <span className="text-red-600">*</span>
                </Label>
                <select
                  id="convoyTime"
                  name="convoyTime"
                  value={formData.convoyTime}
                  onChange={handleChange}
                  disabled={!formData.origin || !formData.date}
                  className="border rounded px-3 py-2 w-full text-sm max-w-full"
                >
                  <option value="">Select Convey Time</option>
                  {availableConveyTimes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.convey_time} ({item.convey_name})
                    </option>
                  ))}
                </select>
                {errors.convoyTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.convoyTime}
                  </p>
                )}
                {availableConveyTimes.length === 0 &&
                  formData.origin &&
                  formData.date && (
                    <p className="text-red-600 text-xs mt-1">
                      No active conveys available for this origin and date.
                    </p>
                  )}
              </div>
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
                    <strong>Vehicle Capacity:</strong> {vehicleSeating}
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
                    setEditingPassengerIndex(null);
                    setIsIslander("");

                    if (value === "yes") {
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
                    } else {
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

              {/* Excel Upload */}
              {isForeigner === "no" && (
                <div className="mb-6">
                  <Label htmlFor="excelUpload" className="block mb-2">
                    Upload Passengers via Excel (Indian Only)
                  </Label>
                  <input
                    type="file"
                    id="excelUpload"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload Excel file with columns: Name, Age, Gender, Phone,
                    DocumentType, DocumentId, Residence
                  </p>
                </div>
              )}

              {/* Passenger Entry (Indian / Foreigner) */}
              {isForeigner === "no" && (
                <AddPassengerIndian
                  passenger={passenger}
                  setPassenger={setPassenger}
                  isIslander={isIslander}
                  setIsIslander={setIsIslander}
                  onAdd={handleAddPassenger}
                  editIndex={editingPassengerIndex}
                />
              )}

              {isForeigner === "yes" && (
                <AddPassengerForeigner
                  passenger={passenger}
                  setPassenger={setPassenger}
                  onAdd={handleAddPassenger}
                  editIndex={editingPassengerIndex}
                />
              )}

              {/* Passenger Table */}
              <div className="border p-2 sm:p-4 rounded-lg bg-gray-50 mt-6 overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4">Passenger Table</h3>
                <table className="min-w-full text-xs sm:text-sm bg-white rounded">
                  <thead className="hidden sm:table-header-group">
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

          {/* Navigation Buttons */}
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
          {passengerSuccess && (
            <p className="text-green-600 text-sm mt-2">{passengerSuccess}</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
