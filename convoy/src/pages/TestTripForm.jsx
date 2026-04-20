import React, { useEffect, useState } from "react";
import {
  getOriginDestinations,
  getConveyTimeByLocId,
  getStopConveyDetails,
} from "@/contexts/GetApi"; // adjust path

const TestTripForm = () => {
  const [locationList, setLocationList] = useState([]);
  const [conveyTimeList, setConveyTimeList] = useState([]);
  const [stopConveyList, setStopConveyList] = useState([]); // store stopped convey IDs only

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    convoyTime: "",
    date: "", // NEW DATE FIELD
  });

  // Fetch locations once
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await getOriginDestinations();
        console.log("📌 Locations API response:", res);

        const locations = Array.isArray(res) ? res : [];
        setLocationList(locations);
      } catch (error) {
        console.error("❌ Error fetching origin/destination:", error);
        setLocationList([]);
      }
    };

    fetchLocations();
  }, []);

  // Fetch convey times when origin changes
  useEffect(() => {
    const fetchConveyTimes = async () => {
      if (!formData.origin) {
        setConveyTimeList([]);
        return;
      }

      const selectedOrigin = locationList.find(
        (place) => String(place.id) === formData.origin
      );

      if (!selectedOrigin?.loc_id) {
        setConveyTimeList([]);
        return;
      }

      try {
        const res = await getConveyTimeByLocId(selectedOrigin.loc_id);
        console.log("📌 Convey Times API response:", res);

        const times = Array.isArray(res?.data) ? res.data : res;
        setConveyTimeList(times || []);
      } catch (error) {
        console.error("❌ Error fetching convey times:", error);
        setConveyTimeList([]);
      }
    };

    fetchConveyTimes();
  }, [formData.origin, locationList]);

  // Fetch stopped conveys when origin OR date changes
  useEffect(() => {
    const fetchStoppedConveys = async () => {
      if (!formData.origin || !formData.date) {
        setStopConveyList([]);
        return;
      }

      try {
        const rawData = await getStopConveyDetails(
          "121212",
          formData.origin,
          formData.date // send date too 🚀
        );
        console.log("🔎 Normalized Stop Convey data:", rawData);

        const stoppedIds = rawData
          .filter((c) => String(c.status) === "0")
          .map((c) => String(c.conveyid));

        setStopConveyList(stoppedIds);
        console.log("⛔ Stopped Convey IDs:", stoppedIds);
      } catch (error) {
        console.error("❌ Error fetching stopped conveys:", error);
        setStopConveyList([]);
      }
    };

    fetchStoppedConveys();
  }, [formData.origin, formData.date]);

  // Filter available convey times by removing stopped ones
  const availableConveyTimes = conveyTimeList.filter(
    (ct) => !stopConveyList.includes(String(ct.id))
  );
  console.log("✅ Available Convey Times:", availableConveyTimes);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "origin") {
      setFormData({
        origin: value,
        destination: "",
        convoyTime: "",
        date: formData.date, // keep date same
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Test Trip Form</h2>

      {/* Origin */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="origin">Origin</label>
        <select
          id="origin"
          name="origin"
          value={formData.origin}
          onChange={handleChange}
          style={{ width: "100%", padding: 8 }}
        >
          <option value="">Select Origin</option>
          {locationList.map((place) => (
            <option key={place.id} value={String(place.id)}>
              {place.location}
            </option>
          ))}
        </select>
      </div>

      {/* Destination */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="destination">Destination</label>
        <select
          id="destination"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          style={{ width: "100%", padding: 8 }}
        >
          <option value="">Select Destination</option>
          {locationList.map((place) => (
            <option
              key={place.id}
              value={String(place.id)}
              disabled={formData.origin === String(place.id)}
            >
              {place.location}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="date">Date</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      {/* Convey Time */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="convoyTime">Convey Time</label>
        <select
          id="convoyTime"
          name="convoyTime"
          value={formData.convoyTime}
          onChange={handleChange}
          disabled={!formData.origin || !formData.date}
          style={{ width: "100%", padding: 8 }}
        >
          <option value="">Select Convey Time</option>
          {availableConveyTimes.map((ct) => (
            <option key={ct.id} value={ct.convey_time}>
              {ct.convey_time} {ct.convey_name}
            </option>
          ))}
        </select>
        {availableConveyTimes.length === 0 &&
          formData.origin &&
          formData.date && (
            <p style={{ color: "red", marginTop: 8 }}>
              No active conveys available for this origin and date.
            </p>
          )}
      </div>

      <pre>{JSON.stringify(formData, null, 2)}</pre>
    </div>
  );
};

export default TestTripForm;
