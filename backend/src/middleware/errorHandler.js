const BaseResponseDTO = require('../dto/response/BaseResponseDTO');
const config = require('../config/environment');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    error.message = err.errors.map(e => e.message).join(', ');
    error.status = 400;
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    error.message = 'Resource already exists';
    error.status = 409;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Send response
  const response = BaseResponseDTO.error(error.message);
  
  // Include stack trace in development
  if (config.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.status).json(response);
};

module.exports = errorHandler;