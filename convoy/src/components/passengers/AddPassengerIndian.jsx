import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AddPassengerIndian({
  passenger,
  setPassenger,
  isIslander,
  setIsIslander,
  onAdd,
}) {
  const namePattern = /^[A-Za-z\s.'-]*$/;
  const phonePattern = /^\d{0,10}$/;
  const agePattern = /^\d{0,3}$/;
  const docIdPattern = /^[A-Za-z0-9]{0,4}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name" || name === "fatherName") {
      if (!namePattern.test(value)) return;
    }

    if (name === "phone") {
      if (!phonePattern.test(value)) return;
    }

    if (name === "age") {
      if (!agePattern.test(value)) return;
      if (Number(value) > 120) return;
    }

    if (name === "documentId") {
      if (!docIdPattern.test(value)) return;
    }

    setPassenger({ ...passenger, [name]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 w-full">
      {/* Row 1 */}
      <div>
        <Label>Passenger Name *</Label>
        <Input
          name="name"
          value={passenger.name || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>Father Name *</Label>
        <Input
          name="fatherName"
          value={passenger.fatherName || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>Age *</Label>
        <Input
          name="age"
          inputMode="numeric"
          value={passenger.age || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>Gender *</Label>
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
        <Label>Phone *</Label>
        <Input
          name="phone"
          inputMode="numeric"
          maxLength={10}
          value={passenger.phone || ""}
          onChange={handleChange}
        />
      </div>

      {/* Row 2 */}
      <div>
        <Label>Residence *</Label>
        <Input
          name="residence"
          value={passenger.residence || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>Is Islander *</Label>
        <select
          value={isIslander}
          onChange={(e) => setIsIslander(e.target.value)}
          className="border rounded px-3 py-2 w-full text-sm"
        >
          <option value="">Select</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <div>
        <Label>Id Type *</Label>
        <select
          name="documentType"
          value={passenger.documentType || ""}
          onChange={handleChange}
          className="border rounded px-3 py-2 w-full text-sm"
        >
          <option value="">Select</option>
          <option value="PAN">PAN</option>
          <option value="AADHAAR">AADHAAR</option>
          <option value="PASSPORT">PASSPORT</option>
        </select>
      </div>

      <div>
        <Label>Last 4 Characters of Id *</Label>
        <Input
          name="documentId"
          maxLength={4}
          value={passenger.documentId || ""}
          onChange={handleChange}
        />
      </div>

      <div className="hidden md:block" />
      <div className="md:col-span-5 flex justify-end mt-4">
        <Button onClick={onAdd} className="bg-yellow-500 text-white">
          Add Passenger
        </Button>
      </div>
    </div>
  );
}
