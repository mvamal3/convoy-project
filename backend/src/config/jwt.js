const jwt = require('jsonwebtoken');
const config = require('./environment');

class JWTConfig {
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: 'myapp',
      audience: 'myapp-users'
    });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      issuer: 'myapp',
      audience: 'myapp-users'
    });
  }

  static verifyAccessToken(token) {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'myapp',
      audience: 'myapp-users'
    });
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, config.JWT_REFRESH_SECRET, {
      issuer: 'myapp',
      audience: 'myapp-users'
    });
  }
}

module.exports = JWTConfig;