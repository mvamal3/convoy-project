const BaseResponseDTO = require('../dto/response/BaseResponseDTO');

// Final error handler. Only messages marked safe (httpError's `expose`)
// or the fixed ones below reach the client; never raw database or
// runtime messages, and never stack traces.
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  let status = 500;
  let message = 'Internal Server Error';

  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    // body-parser errors (checked first: they also carry `expose`)
    status = err.status;
    message = 'Invalid request body';
  } else if (err.expose) {
    status = err.status || 400;
    message = err.message;
  } else if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = 'Invalid input';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'Resource already exists';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired token';
  } else if (err.message === 'Origin not allowed by CORS') {
    status = 403;
    message = 'Origin not allowed';
  }

  res.status(status).json(BaseResponseDTO.error(message));
};

module.exports = errorHandler;
