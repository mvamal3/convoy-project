// models/originDestination.js
module.exports = (sequelize, DataTypes) => {
  const OriginDestination = sequelize.define(
    "OriginDestination",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "0",
      },
      loc_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isIn: [[0, 1]],
        },
      },
    },
    {
      tableName: "origin_destination",
      timestamps: false,
    }
  );

  OriginDestination.prototype.toSafeObject = function () {
    const { ...safeLocation } = this.toJSON();
    return safeLocation;
  };

  // ✅ Associations
  OriginDestination.associate = (models) => {
    OriginDestination.hasMany(models.Trip, {
      foreignKey: "origin",
      as: "originTrips",
    });

    OriginDestination.hasMany(models.Trip, {
      foreignKey: "destination",
      as: "destinationTrips",
    });

    OriginDestination.hasMany(models.PoliceRegistration, {
      foreignKey: "checkpost",
      as: "policeRegistrations",
    });

    // Association with TConvey using loc_id
    OriginDestination.hasMany(models.TConvey, {
      foreignKey: "loc_id",
      sourceKey: "loc_id",
      as: "conveyTimings",
    });
  };

  return OriginDestination;
};
