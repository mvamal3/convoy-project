module.exports = (sequelize, DataTypes) => {
  const tripRelation = sequelize.define(
    "tripRelation",
    {
      // Make tId STRING(50) to match Trip.tId data type
      tId: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      pId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "trip_relation_tbl",
      timestamps: false,
    }
  );

  tripRelation.prototype.toSafeObject = function () {
    const { ...safeData } = this.toJSON();
    return safeData;
  };

  tripRelation.associate = (models) => {
    tripRelation.belongsTo(models.Trip, {
      foreignKey: "tId",
      as: "trip",
    });

    tripRelation.belongsTo(models.Passenger, {
      foreignKey: "pId",
      as: "passenger",
    });
  };

  return tripRelation;
};
