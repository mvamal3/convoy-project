// One-time passwords for registration and password reset (see utils/otp.js).
// Only a bcrypt hash of the code is stored.
module.exports = (sequelize, DataTypes) => {
  const AuthOtp = sequelize.define(
    "AuthOtp",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      accountType: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      accountId: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      purpose: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      otpHash: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      // Epoch milliseconds
      expiresAt: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "auth_otp",
      timestamps: true,
      updatedAt: false,
    },
  );

  return AuthOtp;
};
