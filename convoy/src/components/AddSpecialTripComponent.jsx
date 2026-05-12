import React, { useEffect, useState } from "react";
import Select from "react-select";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  getDriverList,
  getVehicleList,
  getOriginDestinations,
  getCurrentDateTime1,
} from "@/contexts/GetApi";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AddSpecialTripComponent = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [vehicleList, setVehicleList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  const [vehicleSeating, setVehicleSeating] = useState(null);

  const [serverDate, setServerDate] = useState(null);

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    vId: "",
    dId: "",
    origin: "",
    destination: "",
    loc_id: "",
    date: "",
    convoyTime: "",
    specialType: "",
    remarks: "",
    isTouristTrip: "",
  });

  const requiredMark = <span className="text-red-600">*</span>;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleRes = await getVehicleList(accessToken);
        setVehicleList(vehicleRes?.data?.vehicle || []);

        const driverRes = await getDriverList(accessToken);
        setDriverList(driverRes?.data?.driver || []);

        const originDestRes = await getOriginDestinations(accessToken);
        setLocationList(Array.isArray(originDestRes) ? originDestRes : []);
      } catch (error) {
        console.error(error);
      }
    };

    if (accessToken) fetchData();
  }, [accessToken]);

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const currentTimeData = await getCurrentDateTime1(accessToken);
        setServerDate(currentTimeData?.date);
      } catch (error) {
        console.error(error);
      }
    };

    if (accessToken) fetchServerTime();
  }, [accessToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "origin") {
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
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNext = () => {
    const newErrors = {};

    if (!formData.isTouristTrip) newErrors.isTouristTrip = "Required";

    if (!formData.vId) newErrors.vId = "Required";

    if (!formData.dId) newErrors.dId = "Required";

    if (!formData.origin) newErrors.origin = "Required";

    if (!formData.date) newErrors.date = "Required";

    if (!formData.convoyTime) newErrors.convoyTime = "Required";

    if (!formData.specialType) newErrors.specialType = "Required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    navigate("/specialConvoydeparture", {
      state: {
        ...formData,
        vehicleSeating,
      },
    });
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

  const fieldClass = (error) =>
    `border rounded px-3 py-2 w-full text-sm max-w-full ${
      error ? "border-red-600" : ""
    }`;
  return (
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tourist */}
        <div className="w-full">
          <Label>Tourist Trip? {requiredMark}</Label>

          <select
            name="isTouristTrip"
            value={formData.isTouristTrip}
            onChange={handleChange}
            className={fieldClass(errors.isTouristTrip)}
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          {errors.isTouristTrip && (
            <p className="text-red-600 text-xs mt-1">{errors.isTouristTrip}</p>
          )}
        </div>

        {/* Vehicle */}
        <div className="w-full">
          <Label>Select Vehicle {requiredMark}</Label>

          <select
            name="vId"
            value={formData.vId}
            onChange={(e) => {
              const value = e.target.value;

              const selectedVehicle = vehicleList.find(
                (v) => String(v.vId) === String(value),
              );

              setVehicleSeating(
                selectedVehicle ? Number(selectedVehicle.vSeating) : null,
              );

              setFormData((prev) => ({
                ...prev,
                vId: value,
              }));
            }}
            className={fieldClass(errors.vId)}
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

        {/* Driver */}
        <div className="w-full">
          <Label>Select Driver {requiredMark}</Label>

          <select
            name="dId"
            value={formData.dId}
            onChange={handleChange}
            className={fieldClass(errors.dId)}
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

        {/* Date */}
        <div className="w-full">
          <Label>Select Date {requiredMark}</Label>

          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={minDate}
            max={maxDate}
            className={fieldClass(errors.date)}
          />

          {errors.date && (
            <p className="text-red-600 text-xs mt-1">{errors.date}</p>
          )}
        </div>

        {/* Origin */}
        <div className="w-full">
          <Label>Origin {requiredMark}</Label>

          <select
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            className={fieldClass(errors.origin)}
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

        {/* Special Type */}
        <div className="w-full">
          <Label>Convoy Type {requiredMark}</Label>

          <select
            name="specialType"
            value={formData.specialType}
            onChange={handleChange}
            className={fieldClass(errors.specialType)}
          >
            <option value="">Select</option>
            <option value="100">🚨 Emergency Cases</option>
            <option value="200">⭐ VIP Cases</option>
          </select>

          {errors.specialType && (
            <p className="text-red-600 text-xs mt-1">{errors.specialType}</p>
          )}
        </div>

        {/* Time */}
        <div className="w-full">
          <Label>Time {requiredMark}</Label>

          <input
            type="time"
            name="convoyTime"
            value={formData.convoyTime}
            onChange={handleChange}
            className={fieldClass(errors.convoyTime)}
          />

          {errors.convoyTime && (
            <p className="text-red-600 text-xs mt-1">{errors.convoyTime}</p>
          )}
        </div>

        {/* Remarks */}
        <div className="w-full">
          <Label>Remarks</Label>

          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Enter remarks"
            className="border rounded px-3 py-2 w-full text-sm max-w-full"
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </CardContent>
  );
};

export default AddSpecialTripComponent;
