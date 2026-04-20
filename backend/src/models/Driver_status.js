module.exports = (sequelize, DataTypes) => {
  const DriverStatus = sequelize.define(
    "DriverStatus",
    {
      reg_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      dId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      phNo: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          is: {
            args: /^\d{10}$/,
            msg: "Phone number must be exactly 10 digits.",
          },
        },
      },
      Status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        allowNull: false,
        defaultValue: "Active",
      },
    },
    {
      tableName: "driver_status_tbl",
      timestamps: false,
    }
  );

  // Optional method to return sanitized object
  DriverStatus.prototype.toSafeObject = function () {
    const { ...safeData } = this.toJSON();
    return safeData;
  };

  DriverStatus.associate = (models) => {
    DriverStatus.belongsTo(models.Driver, {
      foreignKey: "dId",
      as: "sts",
    });
  };

  return DriverStatus;
};
