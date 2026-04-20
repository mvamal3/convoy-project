class MobilenumberResponseDTO {
  static success(data, message = "Driver fetched successfully") {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(errorMessage) {
    return {
      success: false,
      message: errorMessage,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MobilenumberResponseDTO;
