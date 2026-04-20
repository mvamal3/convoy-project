/**
 * driver.model.js
 * ──────────────────────────────────────────────────────────
 * Pure stand-alone representation of driver_tbl
 */
module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define(
    "Driver",
    {
      dId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      licenseNo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      title: {
        type: DataTypes.STRING(50),
        allowNull: true, // ✅ matches DB
      },

      dFirstName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      dLastName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      son_of: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      gender: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      residence_of: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      phone_no: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },

      dStatus: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      tableName: "driver_tbl",
      timestamps: false,
    },
  );

  Driver.prototype.toSafeObject = function () {
    const { ...safeDriver } = this.toJSON();
    return safeDriver;
  };

  Driver.associate = (models) => {
    Driver.hasMany(models.DriverStatus, {
      foreignKey: "dId",
      as: "sts",
    });
  };

  return Driver;
};
