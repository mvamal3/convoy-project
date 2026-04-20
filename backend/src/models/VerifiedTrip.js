module.exports = (sequelize, DataTypes) => {
  const VerifiedTrip = sequelize.define(
    "VerifiedTrip",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tripId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      verifiedby: {
        type: DataTypes.STRING(50), // stores reg_id
        allowNull: true,
      },
      vdate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: sequelize.literal("CURRENT_DATE"),
      },
      vtime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: sequelize.literal("CURRENT_TIME"),
      },
      remarks: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "verified_trip",
      timestamps: false,
    }
  );

  // ✅ ASSOCIATIONS
  VerifiedTrip.associate = (models) => {
    // Link to Trip
    VerifiedTrip.belongsTo(models.Trip, {
      foreignKey: "tripId",
      targetKey: "tId",
      as: "trip",
    });

    // ✅ Link to PoliceRegistration (Officer)
    VerifiedTrip.belongsTo(models.PoliceRegistration, {
      foreignKey: "verifiedby", // verified_trip.verifiedby
      targetKey: "reg_id", // police_registration_tbl.reg_id
      as: "verifiedOfficer",
    });
  };

  return VerifiedTrip;
};
