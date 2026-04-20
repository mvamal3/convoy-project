class PoliceLoginUserResponseDto {
  constructor(user) {
    console.log(
      "Creating PoliceLoginUserResponseDto for user:",
      JSON.stringify(user, null, 2),
    );

    this.id = user.id;
    this.email = user.email;

    // Construct full name from registration
    this.name = `${user.registration?.firstName || ""} ${
      user.registration?.lastName || ""
    }`.trim();

    // Additional fields for police
    this.designation = user.registration?.designation || null;
    this.checkpost = user.registration?.checkpost || null; // ID only
    this.reg_id = user.registration?.reg_id || null;

    // ✅ Add readable checkpost details (from OriginDestination)
    this.checkpostDetails = user.registration?.originDestination
      ? {
          locationid: user.registration.originDestination.id,
          location: user.registration.originDestination.location,
        }
      : null;

    this.role = user.role;
    this.usertype = "admin"; // Optional, you can change this if needed
  }
}

module.exports = PoliceLoginUserResponseDto;
