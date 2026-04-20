// models/CheckoutTrip.js
module.exports = (sequelize, DataTypes) => {
  const CheckoutTrip = sequelize.define(
    "CheckoutTrip",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      tId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "0",
      },

      conveyid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      checkoutdate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      checkouttime: {
        type: DataTypes.TIME,
        allowNull: false,
      },

      checkpostid: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      remarks: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },

      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "checkout_trip",
      timestamps: false,
    }
  );

  // ================= ASSOCIATIONS =================
  CheckoutTrip.associate = (models) => {
    // 🔗 Trip (via tId)
    CheckoutTrip.belongsTo(models.Trip, {
      foreignKey: "tId",
      targetKey: "tId",
      as: "trip",
    });

    // 🔗 ApproveTrip (via tId)
    CheckoutTrip.belongsTo(models.ApproveTrip, {
      foreignKey: "tId",
      targetKey: "tId",
      as: "approveTrip",
    });

    // 🔗 Checkpost Location
    CheckoutTrip.belongsTo(models.OriginDestination, {
      foreignKey: "checkpostid",
      targetKey: "id",
      as: "checkpostLocation",
    });

    // 🔗 Convey (IMPORTANT – NEW)
    CheckoutTrip.belongsTo(models.TConvey, {
      foreignKey: "conveyid",
      targetKey: "id",
      as: "convey",
    });
  };

  return CheckoutTrip;
};
