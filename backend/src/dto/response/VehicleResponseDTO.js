class VehicleDto {
  constructor(data) {
    this.v_id = data.v_id;
    this.v_owner_name = data.v_owner_name || null;
    this.special_type = data.special_type || null;
    this.v_number = data.v_number;
    this.license_number = data.license_number || null;
    this.v_category = data.v_category;
    this.commercial_type = data.commercial_type || null;
    this.v_type = data.v_type || null;
    this.registration_date = data.registration_date || null;
    this.status = data.status ?? 1;
  }

  validate() {
    const errors = [];

    // Required
    if (!this.v_id?.trim()) errors.push("Vehicle ID is required");
    if (!this.v_number?.trim()) errors.push("Vehicle number is required");
    if (!this.v_category) errors.push("Vehicle category is required");

    // Enums
    const validCategories = ['Commercial', 'Non-Commercial'];
    const validCommercialTypes = ['Cargo', 'Passenger'];
    const validTypes = ['Bus', '4-Wheeler', 'Special'];
    const validSpecialTypes = ['Ambulance', 'Mortuary Van'];

    if (this.v_category && !validCategories.includes(this.v_category)) {
      errors.push("Invalid vehicle category");
    }

    if (this.commercial_type && !validCommercialTypes.includes(this.commercial_type)) {
      errors.push("Invalid commercial type");
    }

    if (this.v_type && !validTypes.includes(this.v_type)) {
      errors.push("Invalid vehicle type");
    }

    if (this.special_type && !validSpecialTypes.includes(this.special_type)) {
      errors.push("Invalid special type");
    }

    // Logical validations from DB constraints
    if (this.v_category === 'Commercial' && !this.commercial_type) {
      errors.push("Commercial type is required for Commercial vehicles");
    }

    if (this.commercial_type === 'Passenger' && !this.v_type) {
      errors.push("Vehicle type is required for Passenger commercial vehicles");
    }

    if (this.v_type === 'Special' && !this.special_type) {
      errors.push("Special type is required for Special vehicle type");
    }

    if (![0, 1].includes(this.status)) {
      errors.push("Status must be either 0 or 1");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = VehicleDto;
