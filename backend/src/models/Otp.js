// models/Otp.js
module.exports = (sequelize, DataTypes) => {
  const Otp = sequelize.define(
    "Otp",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      otp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      regid: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "0",
      },
      userid: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "0",
      },
      datetime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "otp", // ✅ matches DB table
      timestamps: false, // ✅ because your table has its own datetime column
    }
  );

  // Optional: define associations if needed later
  Otp.associate = (models) => {
    Otp.belongsTo(models.Registration, {
      foreignKey: "regid",
      targetKey: "reg_id",
      as: "registration",
    });
  };

  return Otp;
};
