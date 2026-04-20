const UserResponseDTO = require("./UserResponseDTO");
const RegistrationResponseDto = require("./RegistrationResponseDto");

class AuthResponseDTO {
  constructor(registration, accessToken, refreshToken) {
    // this.user = new UserResponseDTO(user);
    this.registration = new RegistrationResponseDto(registration);
    this.tokens = {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
    };
  }
}

module.exports = AuthResponseDTO;
