module.exports = (sequelize, DataTypes) => {
  const Trip = sequelize.define(
    "Trip",
    {
      tId: {
        type: DataTypes.STRING(50), // Matches DB VARCHAR(50)
        primaryKey: true,
        allowNull: false,
      },
      reg_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      vId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      dId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      origin: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      destination: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      convoyTime: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      entrydatetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        onUpdate: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      isTourist: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },

      verifiystatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "trip_tbl",
      timestamps: false,
    },
  );

  Trip.prototype.toSafeObject = function () {
    const { ...safeTrip } = this.toJSON();
    return safeTrip;
  };

  Trip.associate = (models) => {
    Trip.belongsTo(models.Driver, {
      foreignKey: "dId",
      as: "driver",
    });

    Trip.belongsTo(models.Registration, {
      foreignKey: "reg_id",
      as: "registration",
    });

    Trip.belongsTo(models.Vehicle, {
      foreignKey: "vId",
      as: "vehicle",
    });

    // BelongsToMany passengers via tripRelation, unique alias
    Trip.belongsToMany(models.Passenger, {
      through: models.tripRelation,
      foreignKey: "tId",
      otherKey: "pId",
      as: "passengers",
    });

    Trip.belongsTo(models.OriginDestination, {
      foreignKey: "origin",
      as: "originLocation",
    });

    Trip.belongsTo(models.OriginDestination, {
      foreignKey: "destination",
      as: "destinationLocation",
    });

    Trip.belongsTo(models.TConvey, {
      foreignKey: "convoyTime",
      as: "convey",
    });

    Trip.hasOne(models.ApproveTrip, {
      foreignKey: "tId",
      sourceKey: "tId",
      as: "approveDetails",
    });
    // Uncomment if needed, ensure unique alias
    // Trip.belongsTo(models.CheckoutTrip, {
    //   foreignKey: "convoyTime",
    //   as: "checkoutconvoy",
    // });

    Trip.hasOne(models.VerifiedTrip, {
      foreignKey: "tripId", // verified_trip.tripId
      sourceKey: "tId", // trip_tbl.tId
      as: "verifiedDetails",
    });
    Trip.hasMany(models.VerifiedTrip, {
      foreignKey: "tripId",
      sourceKey: "tId",
      as: "allVerifiedTrips",
    });

    // ✅ ADD THIS
    Trip.hasMany(models.CheckoutTrip, {
      foreignKey: "tId",
      sourceKey: "tId",
      as: "checkoutDetails",
    });
    Trip.hasOne(models.ConveyControl, {
      foreignKey: "conveyid", // from ConveyControl
      sourceKey: "convoyTime", // from Trip
      as: "conveyControl",
    });
    Trip.hasMany(models.CheckoutControl, {
      foreignKey: "conveyid",
      sourceKey: "convoyTime",
      as: "checkoutControls",
    });
  };

  return Trip;
};
