import React, { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getDriverList,
  getVehicleList,
  getOriginDestinations,
  getConveyTimeByLocId,
  getStopConveyDetails,
  getCurrentDateTime1,
} from "@/contexts/GetApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AddTripComponent = () => {
  const { accessToken } = useAuth();
  const [vehicleList, setVehicleList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [conveyTimeList, setConveyTimeList] = useState([]);
  const [stopConveyList, setStopConveyList] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [serverTime, setServerTime] = useState(null);
  const [serverDate, setServerDate] = useState(null);

  const requiredMark = <span className="text-red-600">*</span>;

  const [formData, setFormData] = useState({
    vId: "",
    dId: "",
    origin: "",
    destination: "",
    loc_id: "",
    date: "",
    convoyTime: "",
    vehicleSeating: null,
    isTouristTrip: "",
  });
  const [isReturn, setIsReturn] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [returnConvoyTime, setReturnConvoyTime] = useState("");
  const [returnConveyList, setReturnConveyList] = useState([]);

  const toMinutes = (time) => {
    if (!time || typeof time !== "string") return null;

    const parts = time.split(":").map(Number);
    const hour = parts[0] || 0;
    const minute = parts[1] || 0;

    return hour * 60 + minute;
  };
  // Update vehicleSeating in formData whenever vId changes
  useEffect(() => {
    if (!formData.vId) {
      setFormData((prev) => ({ ...prev, vehicleSeating: null }));
      return;
    }
    const selectedVehicle = vehicleList.find(
      (v) => String(v.vId) === String(formData.vId),
    );
    setFormData((prev) => ({
      ...prev,
      vehicleSeating: selectedVehicle ? Number(selectedVehicle.vSeating) : null,
    }));
  }, [formData.vId, vehicleList]);

  // Initial load of vehicles, drivers, and locations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleRes = await getVehicleList(accessToken);
        setVehicleList(vehicleRes?.data?.vehicle || []);
        const driverRes = await getDriverList(accessToken);
        setDriverList(driverRes?.data?.driver || []);
        const locationsRes = await getOriginDestinations(accessToken);
        setLocationList(Array.isArray(locationsRes) ? locationsRes : []);
      } catch (error) {
        setVehicleList([]);
        setDriverList([]);
        setLocationList([]);
      }
    };
    if (accessToken) fetchData();
  }, [accessToken]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "origin") {
      const selectedPlace = locationList.find(
        (place) => String(place.id) === value,
      );

      // Auto-set destination to the opposite location
      const oppositePlace = locationList.find(
        (place) => String(place.loc_id) !== String(selectedPlace?.loc_id),
      );

      setFormData((prev) => ({
        ...prev,
        origin: value,
        loc_id: selectedPlace?.loc_id || "",
        destination: oppositePlace ? String(oppositePlace.id) : "",
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

  // Fetch server current time and date
  useEffect(() => {
    const fetchServerTime = async () => {
      if (!accessToken) return;
      try {
        const currentTimeData = await getCurrentDateTime1(accessToken);
        setServerTime(currentTimeData?.time); // format "HH:mm"
        setServerDate(currentTimeData?.date); // format "YYYY-MM-DD"
        console.log("Fetched server time:", currentTimeData?.time);
        console.log("Fetched server date:", currentTimeData?.date);
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };
    fetchServerTime();
  }, [accessToken]);

  // Fetch return convey times and filter based on date and time
  useEffect(() => {
    const fetchReturnConvey = async () => {
      if (!accessToken || !formData.destination || !isReturn) {
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
      setReturnConvoyTime("");
      fetchReturnConvey();
    }
  }, [formData.destination, isReturn, accessToken, locationList]);

  // Fetch convey times and filter based on date and time
  useEffect(() => {
    const fetchConveyTimes = async () => {
      if (
        !accessToken ||
        !formData.loc_id ||
        !formData.date ||
        !serverDate ||
        !serverTime
      ) {
        setConveyTimeList([]);
        return;
      }
      try {
        const res = await getConveyTimeByLocId(formData.loc_id, accessToken);
        console.log("Fetched convey times:", res);
        const conveyTimes = Array.isArray(res) ? res : [];

        console.log(
          "Filtering convey times with formDate:",
          formData.date,
          "serverDate:",
          serverDate,
          "serverTime:",
          serverTime,
        );

        // Filter convey times by current time only if date matches server date
        if (formData.date === serverDate) {
          const serverMinutes = toMinutes(serverTime);
          const GRACE_MINUTES = 30;

          const filteredTimes = conveyTimes.filter((ct) => {
            const convoyMinutes = toMinutes(ct.convey_time);

            // ✅ safety check
            if (convoyMinutes === null || isNaN(convoyMinutes)) return false;

            // ✅ allow till convoy time + 30 mins
            return convoyMinutes + GRACE_MINUTES > serverMinutes;
          });

          setConveyTimeList(filteredTimes);
        } else {
          setConveyTimeList(conveyTimes);
          console.log("All convey times for other date:", conveyTimes);
        }
      } catch {
        setConveyTimeList([]);
      }
    };
    fetchConveyTimes();
  }, [formData.loc_id, formData.date, accessToken, serverDate, serverTime]);

  // Fetch and store stopped convey IDs
  useEffect(() => {
    const fetchStoppedConveys = async () => {
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
        console.log("Stopped convey IDs:", stoppedIds);
      } catch {
        setStopConveyList([]);
      }
    };
    fetchStoppedConveys();
  }, [formData.loc_id, formData.date, accessToken]);

  // Filter convey times excluding stopped conveys
  const availableConveyTimes = conveyTimeList.filter(
    (ct) => !stopConveyList.includes(String(ct.id)),
  );

  // Calculate return convey times with grace period filter
  const isReturnToday = returnDate === serverDate;
  const GRACE_MINUTES = 30;

  const availableReturnConveyTimes = returnConveyList.filter((ct) => {
    // Allow all until server time loads
    if (!serverDate || !serverTime) return true;

    if (isReturnToday) {
      const convoyMinutes = toMinutes(ct.convey_time);

      // Allow convoy till convoy time + 30 mins
      return convoyMinutes + GRACE_MINUTES > toMinutes(serverTime);
    }

    // Future dates → allow all
    return true;
  });

  // Validation and navigation on Next button click
  const handleNext = () => {
    const newErrors = {};
    if (!formData.isTouristTrip) {
      newErrors.isTouristTrip = "Tourist Trip selection is required";
    }
    if (!formData.vId) newErrors.vId = "Vehicle is required";
    if (!formData.dId) newErrors.dId = "Driver is required";
    if (!formData.origin) newErrors.origin = "Origin is required";
    if (!formData.destination)
      newErrors.destination = "Destination is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.convoyTime) newErrors.convoyTime = "Convey Time is required";

    // Return journey validation
    if (isReturn) {
      if (!returnDate) newErrors.returnDate = "Return date is required";
      if (!returnConvoyTime)
        newErrors.returnConvoyTime = "Return convoy time is required";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    navigate("/AddTrip", {
      state: { ...formData, isReturn, returnDate, returnConvoyTime },
    });
  };
  const selectedOriginPlace = locationList.find(
    (loc) => String(loc.id) === String(formData.origin),
  );

  let minDate = "";
  let maxDate = "";

  if (serverDate) {
    const [y, m, d] = serverDate.split("-").map(Number);
    const today = new Date(y, m - 1, d);

    const max = new Date(today);
    max.setDate(today.getDate() + 7);

    const fmt = (dt) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
        dt.getDate(),
      ).padStart(2, "0")}`;

    minDate = fmt(today);
    maxDate = fmt(max);
  }

  return (
    <CardContent>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 max-w-full">
        <div className="w-full">
          <Label> Tourist Trip? {requiredMark}</Label>
          <select
            name="isTouristTrip"
            value={formData.isTouristTrip}
            onChange={handleChange}
            className={`border rounded px-3 py-2 w-full text-sm ${
              errors.isTouristTrip ? "border-red-600" : ""
            }`}
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          {errors.isTouristTrip && (
            <p className="text-red-600 text-xs mt-1">{errors.isTouristTrip}</p>
          )}
        </div>

        <div className="w-full">
          <Label htmlFor="vId">Select Vehicle {requiredMark}</Label>
          <select
            name="vId"
            value={formData.vId}
            onChange={handleChange}
            className={`border rounded px-3 py-2 w-full text-sm max-w-full ${
              errors.vId ? "border-red-600" : ""
            }`}
          >
            <option value="">Select Vehicle</option>
            {vehicleList.map((vehicle) => (
              <option key={vehicle.vId} value={vehicle.vId}>
                {vehicle.vNum} - {vehicle.vCat}
              </option>
            ))}
          </select>
          {errors.vId && (
            <p className="text-red-600 text-xs mt-1">{errors.vId}</p>
          )}
        </div>

        <div className="w-full">
          <Label htmlFor="dId">Select Driver {requiredMark}</Label>
          <select
            name="dId"
            value={formData.dId}
            onChange={handleChange}
            className={`border rounded px-3 py-2 w-full text-sm max-w-full ${
              errors.dId ? "border-red-600" : ""
            }`}
          >
            <option value="">Select Driver</option>
            {driverList.length > 0 ? (
              driverList.map((driver) => (
                <option key={driver.dId} value={driver.dId}>
                  {driver.dFirstName} {driver.dLastName} ({driver.licenseNo})
                </option>
              ))
            ) : (
              <option disabled>No drivers available</option>
            )}
          </select>
          {errors.dId && (
            <p className="text-red-600 text-xs mt-1">{errors.dId}</p>
          )}
        </div>

        <div className="w-full">
          <Label htmlFor="date">Select Date {requiredMark}</Label>
          <input
            type="date"
            id="date"
            name="date"
            className={`border rounded px-3 py-2 w-full text-sm max-w-full ${
              errors.date ? "border-red-600" : ""
            }`}
            min={minDate}
            max={maxDate}
            value={formData.date}
            onChange={handleChange}
            disabled={!serverDate}
          />

          {errors.date && (
            <p className="text-red-600 text-xs mt-1">{errors.date}</p>
          )}
        </div>
      </div>

      {/* Row 2: Origin, Convoy Time, Return Journey */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 mt-4">
        <div className="w-full">
          <Label htmlFor="origin">Origin {requiredMark}</Label>
          <select
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            className={`border rounded px-3 py-2 w-full text-sm max-w-full ${
              errors.origin ? "border-red-600" : ""
            }`}
          >
            <option value="">Select Origin</option>
            {locationList.map((loc) => (
              <option key={loc.id} value={String(loc.id)}>
                {loc.location}
              </option>
            ))}
          </select>
          {errors.origin && (
            <p className="text-red-600 text-xs mt-1">{errors.origin}</p>
          )}
        </div>

        <div className="w-full">
          <Label htmlFor="convoyTime">Convoy Time {requiredMark}</Label>
          <select
            id="convoyTime"
            name="convoyTime"
            value={formData.convoyTime}
            onChange={handleChange}
            disabled={!formData.origin || !formData.date}
            className={`border rounded px-3 py-2 w-full text-sm max-w-full ${
              errors.convoyTime ? "border-red-600" : ""
            }`}
          >
            <option value="">Select Convey Time</option>
            {availableConveyTimes.length > 0 ? (
              availableConveyTimes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.convey_time} ({ct.convey_name})
                </option>
              ))
            ) : (
              <option disabled>No active conveys available</option>
            )}
          </select>
          {errors.convoyTime && (
            <p className="text-red-600 text-xs mt-1">{errors.convoyTime}</p>
          )}
        </div>

        <div className="w-full">
          <Label>Return Journey</Label>
          <select
            value={isReturn ? "yes" : "no"}
            onChange={(e) => {
              const value = e.target.value === "yes";
              setIsReturn(value);
              if (!value) {
                setReturnDate("");
                setReturnConvoyTime("");
                setReturnConveyList([]);
              }
            }}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>

      {/* Return Date and Return Convoy Time (conditional) */}
      {isReturn && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <div className="w-full">
            <Label htmlFor="returnDate">Return Date</Label>
            <input
              type="date"
              value={returnDate}
              min={formData.date || minDate}
              max={maxDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className={`border rounded px-3 py-2 w-full text-sm max-w-full ${
                errors.returnDate ? "border-red-600" : ""
              }`}
            />
            {errors.returnDate && (
              <p className="text-red-600 text-xs mt-1">{errors.returnDate}</p>
            )}
          </div>

          <div className="w-full">
            <Label htmlFor="returnConvoyTime">Return Convoy Time</Label>
            <select
              value={returnConvoyTime}
              disabled={!returnDate}
              onChange={(e) => setReturnConvoyTime(e.target.value)}
              className={`w-full border rounded px-3 py-2 text-sm ${
                errors.returnConvoyTime ? "border-red-600" : ""
              }`}
            >
              <option value="">Select</option>
              {availableReturnConveyTimes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.convey_time} ({c.convey_name})
                </option>
              ))}
            </select>
            {errors.returnConvoyTime && (
              <p className="text-red-600 text-xs mt-1">
                {errors.returnConvoyTime}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </CardContent>
  );
};

export default AddTripComponent;
