class BaseResponseDTO {
  constructor(success = true, message = '', data = null, errors = null) {
    this.success = success;
    this.message = message;
    this.timestamp = new Date().toISOString();
    
    if (data !== null) {
      this.data = data;
    }
    
    if (errors !== null) {
      this.errors = errors;
    }
  }

  static success(data, message = 'Success') {
    return new BaseResponseDTO(true, message, data);
  }

  static error(message = 'Error', errors = null) {
    return new BaseResponseDTO(false, message, null, errors);
  }
}

module.exports = BaseResponseDTO;