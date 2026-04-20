module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    "Admin",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userid: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM("user", "admin", "police"),
        allowNull: false,
        defaultValue: "admin",
      },

      isadmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      refreshToken: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "admin",
      timestamps: true,
    }
  );

  // 🔐 Password validator
  Admin.prototype.validatePassword = async function (password) {
    const bcrypt = require("bcrypt");
    return bcrypt.compare(password, this.password);
  };

  return Admin;
};
