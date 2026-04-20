// models/tconvey.js

module.exports = (sequelize, DataTypes) => {
  const TConvey = sequelize.define(
    "TConvey",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      convey_time: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: "00:00:00",
      },
      convey_name: {
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
        defaultValue: 1,
        validate: {
          isIn: [[0, 1]],
        },
      },
    },
    {
      tableName: "tconvey",
      timestamps: false,
    }
  );

  TConvey.prototype.toSafeObject = function () {
    const { ...safeConvey } = this.toJSON();
    return safeConvey;
  };
  TConvey.associate = (models) => {
    TConvey.hasMany(models.ConveyControl, {
      foreignKey: "conveyid", // match column name in ConveyControl
      as: "conveyControls",
    });
  };
  TConvey.associate = (models) => {
    TConvey.hasMany(models.ConveyControl, {
      foreignKey: "conveyid",
      as: "conveyControls",
    });

    // link to ApproveTrip
    TConvey.hasMany(models.ApproveTrip, {
      foreignKey: "convey_id",
      as: "approvedTrips",
    });
  };

  return TConvey;
};
