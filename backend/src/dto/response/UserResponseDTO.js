class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.fullName = `${user.firstName} ${user.lastName}`;
    this.role = user.role;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.lastLoginAt = user.lastLoginAt;
  }
}

module.exports = UserResponseDTO;