module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    "Vehicle",
    {
      vId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      vOwnName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      vNum: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      vCat: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      otherCat: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // ownershipType: {
      //   type: DataTypes.STRING(100),
      //   allowNull: false,
      // },
      ownershipType: {
        type: DataTypes.ENUM(
          "Commercial",
          "Private",
          "Government",
          "Ambulance"
        ),
        allowNull: false,
        validate: {
          isIn: [[
            "Commercial",
            "Private",
            "Government",
            "Ambulance"
          ]],
        },
      },

      deptName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      vPurpose: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      otherPurpose: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      vSeating: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      loadCapacity: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      regDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },

      // ✅ NEW FIELD: Vehicle Status (Active by default)
      status: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        validate: {
          isIn: [[0, 1]], // 0 = Inactive, 1 = Active
        },
      },
    },
    {
      tableName: "vehicle",
      timestamps: false,
    }
  );

  // ✅ Safe object for API responses
  Vehicle.prototype.toSafeObject = function () {
    const { ...safeVehicle } = this.toJSON();
    return safeVehicle;
  };

  // ✅ Associations
  Vehicle.associate = function (models) {
    Vehicle.hasMany(models.VehicleStatus, {
      foreignKey: "vId",
      as: "sts",
    });
  };

  return Vehicle;
};
