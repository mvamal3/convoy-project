module.exports = (sequelize, DataTypes) => {
  const VehicleStatus = sequelize.define(
    "VehicleStatus",
    {
      vId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reg_id: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
    },
    {
      tableName: "vehicle_status_tbl",
      timestamps: false,
    }
  );

  VehicleStatus.associate = function (models) {
    VehicleStatus.belongsTo(models.Vehicle, {
      foreignKey: "vId",
      as: "vehicle",
    });
  };

  return VehicleStatus;
};
