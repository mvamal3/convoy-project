const PoliceLoginUserResponseDto = require("./PoliceLoginUserResponseDto");

class PoliceLoginResponseDTO {
  constructor(user, accessToken, refreshToken) {
    this.user = new PoliceLoginUserResponseDto(user);
    this.tokens = {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
    };
  }
}

module.exports = PoliceLoginResponseDTO;
