class LoginUserResponseDto {
  constructor(user) {
    console.log("userssssssssssssssss", user.registration);
    this.id = user.id;
    this.email = user.email;
    //this.firstName = user.registration?.firstName || "";
    //this.lastName = user.registration?.lastName || "";
    this.name = `${user.registration?.firstName || ""} ${
      user.registration?.lastName || ""
    }`.trim();
    this.role = user.role;
    this.usertype = user.registration.isOrg;
    this.orgName = user.registration.orgName || "";
    // this.usertype = user.registration?.isOrg ?? 0; // Default value set here
  }
}

module.exports = LoginUserResponseDto;
