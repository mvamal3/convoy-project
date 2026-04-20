module.exports = (sequelize, DataTypes) => {
  const CheckoutControl = sequelize.define(
    "CheckoutControl",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      conveyid: {
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
        type: DataTypes.DATEONLY,
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
      tableName: "checkout_control",
      timestamps: false,
    }
  );

  /* ================= SAFE OBJECT ================= */
  CheckoutControl.prototype.toSafeObject = function () {
    const { ...safeData } = this.toJSON();
    return safeData;
  };

  /* ================= ASSOCIATIONS ================= */
  CheckoutControl.associate = (models) => {
    // ✅ Relation with OriginDestination (Checkpost)
    CheckoutControl.belongsTo(models.OriginDestination, {
      foreignKey: "checkpostid",
      as: "originDestination",
      targetKey: "id",
    });

    // ✅ Relation with TConvey
    CheckoutControl.belongsTo(models.TConvey, {
      foreignKey: "conveyid",
      as: "tconvey",
    });
  };

  return CheckoutControl;
};
