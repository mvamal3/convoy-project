// models/ApproveTrip.js
module.exports = (sequelize, DataTypes) => {
  const ApproveTrip = sequelize.define(
    "ApproveTrip",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "0",
      },
      arrdate: {
        type: DataTypes.DATEONLY, // DATE -> YYYY-MM-DD
        allowNull: true,
      },
      arrtime: {
        type: DataTypes.TIME, // TIME -> HH:mm:ss
        allowNull: true,
      },
      convey_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      checkpost_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      remarks: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "0",
      },
      astatus: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      approveby: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "approve_trip",
      timestamps: false, // no createdAt/updatedAt - arrdate
    }
  );

  ApproveTrip.associate = (models) => {
    // ✅ Trip link
    ApproveTrip.belongsTo(models.Trip, {
      foreignKey: "tId",
      targetKey: "tId",
      as: "trip",
    });

    // ✅ TConvey link
    ApproveTrip.belongsTo(models.TConvey, {
      foreignKey: "convey_id",
      targetKey: "id",
      as: "convey",
    });

    // ✅ OriginDestination link for checkpost
    ApproveTrip.belongsTo(models.OriginDestination, {
      foreignKey: "checkpost_id",
      targetKey: "id",
      as: "checkpost",
    });
    ApproveTrip.belongsTo(models.PoliceRegistration, {
      foreignKey: "approveby", // approve_trip.approveby
      targetKey: "reg_id", // police_registration_tbl.reg_id
      as: "approverOfficer",
    });
  };

  return ApproveTrip;
};
