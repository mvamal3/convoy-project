const UserResponseDTO = require("./UserResponseDTO");
const LoginUserResponseDto = require("./LoginUserResponseDto");

class LoginResponseDTO {
  constructor(registration, accessToken, refreshToken) {
    // this.user = new UserResponseDTO(user);
    this.user = new LoginUserResponseDto(registration);
    this.tokens = {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
    };
  }
}

module.exports = LoginResponseDTO;
