module.exports = (sequelize, DataTypes) => {
  const ConveyControl = sequelize.define(
    "ConveyControl",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      conveyid: {
        // 👈 keep consistent
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      checkpostid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        references: {
          model: "origin_destination",
          key: "id",
        },
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      starttime: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: "00:00:00",
      },
      closetime: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: "00:00:00",
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "convey_control",
      timestamps: false,
    }
  );

  ConveyControl.prototype.toSafeObject = function () {
    const { ...safeData } = this.toJSON();
    return safeData;
  };

  ConveyControl.associate = (models) => {
    // ✅ Relation with OriginDestination
    ConveyControl.belongsTo(models.OriginDestination, {
      foreignKey: "checkpostid",
      as: "originDestination",
      targetKey: "id",
    });

    // ✅ Relation with TConvey
    ConveyControl.belongsTo(models.TConvey, {
      foreignKey: "conveyid", // 👈 match column name
      as: "tconvey",
    });
  };

  return ConveyControl;
};
