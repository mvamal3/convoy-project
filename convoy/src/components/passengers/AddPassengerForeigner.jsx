import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getNationalityList } from "@/contexts/GetApi";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function AddPassengerForeigner({
  passenger,
  setPassenger,
  onAdd,
}) {
  const namePattern = /^[A-Za-z\s.'-]*$/;
  const alphaPattern = /^[A-Za-z\s]*$/;
  const phonePattern = /^\d{0,10}$/;
  const agePattern = /^\d{0,3}$/;
  const alphaNumPattern = /^[A-Za-z0-9]*$/;
  const { accessToken } = useAuth();
  const [nationalities, setNationalities] = useState([]);
  const passportPattern = /^[A-Za-z0-9]{6,9}$/;
  const visaPattern = /^[A-Za-z0-9]{6,15}$/;

  /* ================= FETCH NATIONALITY LIST ================= */
  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const res = await getNationalityList(accessToken);
        console.log("result", res);
        setNationalities(res?.data?.nationalities || []);
      } catch (err) {
        console.error("Failed to load nationality list", err);
        setNationalities([]);
      }
    };

    if (accessToken) fetchNationalities();
  }, [accessToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["name", "fatherName"].includes(name)) {
      if (!namePattern.test(value)) return;
    }

    if (name === "phone") {
      if (!phonePattern.test(value)) return;
    }

    if (name === "age") {
      if (!agePattern.test(value)) return;
      if (Number(value) > 120) return;
    }

    if (["passportNo", "visaNo"].includes(name)) {
      if (!alphaNumPattern.test(value)) return;
    }

    setPassenger({
      ...passenger,
      [name]:
        name === "passportNo" || name === "visaNo"
          ? value.toUpperCase()
          : value,
    });
  };

  const validateForeignerPassenger = () => {
    if (!passportPattern.test(passenger.passportNo || "")) {
      alert("Passport number must be 6–9 alphanumeric characters");
      return false;
    }

    if (!visaPattern.test(passenger.visaNo || "")) {
      alert("Visa number must be 6–15 alphanumeric characters");
      return false;
    }

    if (!passenger.nationality) {
      alert("Nationality is required");
      return false;
    }

    return true;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 w-full">
      {/* Row 1 */}

      <div>
        <Label>
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          name="name"
          value={passenger.name || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>
          Father Name <span className="text-red-500">*</span>
        </Label>
        <Input
          name="fatherName"
          value={passenger.fatherName || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>
          Gender <span className="text-red-500">*</span>
        </Label>
        <select
          name="gender"
          value={passenger.gender || ""}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full text-sm"
        >
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <Label>
          Age <span className="text-red-500">*</span>
        </Label>
        <Input
          name="age"
          inputMode="numeric"
          value={passenger.age || ""}
          onChange={handleChange}
        />
      </div>

      {/* Row 2 */}
      <div>
        <Label>
          Phone <span className="text-red-500">*</span>
        </Label>
        <Input
          name="phone"
          inputMode="numeric"
          maxLength={10}
          value={passenger.phone || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>
          Passport No <span className="text-red-500">*</span>
        </Label>
        <Input
          name="passportNo"
          maxLength={9}
          value={passenger.passportNo || ""}
          onChange={handleChange}
        />
      </div>

      {/* ✅ NATIONALITY DROPDOWN */}
      <div>
        <Label>
          Nationality <span className="text-red-500">*</span>
        </Label>
        <select
          name="nationality"
          value={passenger.nationality || ""}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full text-sm"
        >
          <option value="">Select Nationality</option>
          {nationalities.map((n) => (
            <option key={n.id} value={n.nationality}>
              {n.nationality}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>
          Visa No <span className="text-red-500">*</span>
        </Label>
        <Input
          name="visaNo"
          maxLength={15} // ✅ ADD THIS
          value={passenger.visaNo || ""}
          onChange={handleChange}
        />
      </div>

      {/* Row 3 */}
      <div className="md:col-span-2">
        <Label>
          Residence <span className="text-red-500">*</span>
        </Label>
        <Input
          name="residence"
          value={passenger.residence || ""}
          onChange={handleChange}
        />
      </div>

      <div className="md:col-span-5 flex justify-end mt-4">
        <Button
          onClick={() => {
            if (!validateForeignerPassenger()) return;
            onAdd();
          }}
          className="bg-yellow-500 text-white"
        >
          Add Passenger
        </Button>
      </div>
    </div>
  );
}
