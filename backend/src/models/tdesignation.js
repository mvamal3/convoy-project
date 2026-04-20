// models/tdesignation.js
module.exports = (sequelize, DataTypes) => {
  const TDesignation = sequelize.define(
    "TDesignation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      designation: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "0",
      },

      value: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "0",
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
      tableName: "tdesignation",
      timestamps: false,
    },
  );

  // ✅ Safe object (same pattern as OriginDestination)
  TDesignation.prototype.toSafeObject = function () {
    const { ...safeDesignation } = this.toJSON();
    return safeDesignation;
  };

  return TDesignation;
};
